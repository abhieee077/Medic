from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.ai.images import pick_instances, pick_series, render_png
from app.ai.provider import AIError, ChatTurn, get_provider
from app.core.demo import DEMO_AUTHOR_ID
from database.models import (
    AIAnalysis,
    AIFinding,
    Conversation,
    Message,
    Patient,
    Report,
    Series,
    Study,
)
from database.session import SessionLocal

router = APIRouter(prefix="/ai", tags=["AI"])

DRAFT_FINDING_TYPE = "draft_report"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _require_provider():
    provider = get_provider()
    if provider is None:
        raise HTTPException(
            status_code=503,
            detail="AI is not configured. Restart the backend with an Anthropic API key.",
        )
    return provider


def _get_study(db: Session, study_id: str) -> tuple[Study, Patient]:
    row = db.execute(
        select(Study, Patient)
        .join(Patient, Study.patient_id == Patient.id)
        .where(Study.study_id == study_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Study not found")
    return row[0], row[1]


def _age(date_of_birth: date | None) -> str:
    if not date_of_birth:
        return "age unknown"
    today = date.today()
    years = today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )
    return f"{years}y"


def _latest_analysis(db: Session, study: Study) -> AIAnalysis | None:
    return db.execute(
        select(AIAnalysis)
        .where(AIAnalysis.study_id == study.id)
        .where(AIAnalysis.status == "COMPLETED")
        .order_by(AIAnalysis.created_at.desc())
    ).scalars().first()


def _draft_payload(db: Session, analysis: AIAnalysis) -> dict | None:
    finding = db.execute(
        select(AIFinding)
        .where(AIFinding.analysis_id == analysis.id)
        .where(AIFinding.finding_type == DRAFT_FINDING_TYPE)
    ).scalars().first()
    return finding.location_data if finding else None


def _study_context(db: Session, study: Study, patient: Patient) -> str:
    series = db.execute(
        select(Series).where(Series.study_id == study.id).order_by(Series.series_number)
    ).scalars().all()

    lines = [
        f"Study {study.study_id}: {study.study_description or 'no description'}",
        f"Modality: {study.modality or 'unknown'}; date: {study.study_date or 'unknown'}",
        f"Patient: {patient.gender or 'sex unknown'}, {_age(patient.date_of_birth)}",
        "Series: " + (
            "; ".join(
                f"{item.series_description or 'unnamed'} ({item.number_of_instances or 0} images)"
                for item in series
            )
            or "none imported"
        ),
    ]

    report = db.execute(
        select(Report)
        .where(Report.study_id == study.id)
        .order_by(Report.updated_at.desc())
    ).scalars().first()
    if report and (report.findings or report.impression):
        lines.append(
            f"Current report ({report.status}):\nFindings: {report.findings or '-'}\n"
            f"Impression: {report.impression or '-'}"
        )

    analysis = _latest_analysis(db, study)
    draft = _draft_payload(db, analysis) if analysis else None
    if draft:
        lines.append(
            f"Latest AI draft ({analysis.model_name}):\nFindings: {draft.get('findings')}\n"
            f"Impression: {draft.get('impression')}"
        )

    return "\n".join(lines)


def _analysis_to_dict(db: Session, analysis: AIAnalysis, study_public_id: str) -> dict:
    observations = db.execute(
        select(AIFinding)
        .where(AIFinding.analysis_id == analysis.id)
        .where(AIFinding.finding_type == "observation")
        .order_by(AIFinding.created_at)
    ).scalars().all()

    return {
        "id": str(analysis.id),
        "study_id": study_public_id,
        "provider": analysis.provider,
        "model": analysis.model_name,
        "status": analysis.status,
        "error": analysis.error_message,
        "started_at": _iso(analysis.started_at),
        "completed_at": _iso(analysis.completed_at),
        "draft": _draft_payload(db, analysis),
        "observations": [
            {
                "title": item.title,
                "description": item.description,
                "body_region": item.body_region,
                "significance": item.severity,
                "confidence": item.confidence,
            }
            for item in observations
        ],
    }


@router.get("/status")
def ai_status():
    provider = get_provider()
    return {
        "configured": provider is not None,
        "provider": provider.name if provider else None,
        "model": provider.model if provider else None,
    }


@router.post("/studies/{study_id}/analyze")
def analyze_study(study_id: str, db: Session = Depends(get_db)):
    provider = _require_provider()
    study, patient = _get_study(db, study_id)

    series = pick_series(db, study)
    if series is None:
        raise HTTPException(
            status_code=422,
            detail="This study has no imported images to analyse.",
        )

    analysis = AIAnalysis(
        study_id=study.id,
        requested_by=DEMO_AUTHOR_ID,
        provider=provider.name,
        model_name=provider.model,
        analysis_type="draft_report",
        status="RUNNING",
        started_at=_now(),
    )
    db.add(analysis)
    db.commit()

    try:
        instance_ids = pick_instances(db, series)
        images = [render_png(item) for item in instance_ids]
        context = (
            _study_context(db, study, patient)
            + f"\nSlices shown: {len(images)} evenly spaced images from series "
            f"'{series.series_description or 'unnamed'}' "
            f"({series.number_of_instances or len(instance_ids)} images total)."
        )
        result = provider.analyze_study(images, context)
    except Exception as error:
        if isinstance(error, AIError):
            message, status_code = error.message, error.status_code
        elif isinstance(error, HTTPException):
            message, status_code = str(error.detail), error.status_code
        else:
            message, status_code = "The AI analysis failed unexpectedly.", 500
        db.rollback()
        analysis.status = "FAILED"
        analysis.error_message = message
        analysis.completed_at = _now()
        db.commit()
        raise HTTPException(status_code=status_code, detail=message) from error

    draft = result.draft
    analysis.model_name = result.model
    analysis.status = "COMPLETED"
    analysis.completed_at = _now()

    db.add(AIFinding(
        analysis_id=analysis.id,
        finding_type=DRAFT_FINDING_TYPE,
        title="Draft report",
        description=draft.impression,
        location_data={
            "findings": draft.findings,
            "impression": draft.impression,
            "limitations": draft.limitations,
            "recommendations": draft.recommendations,
            "series": series.series_description,
            "slices": len(images),
        },
    ))
    for item in draft.observations:
        db.add(AIFinding(
            analysis_id=analysis.id,
            finding_type="observation",
            title=item.title[:255],
            description=item.description,
            confidence=max(0.0, min(1.0, item.confidence)),
            severity=item.significance,
            body_region=item.body_region[:100],
        ))
    db.commit()

    return _analysis_to_dict(db, analysis, study.study_id)


@router.get("/studies/{study_id}/analyses")
def list_analyses(study_id: str, db: Session = Depends(get_db)):
    study, _ = _get_study(db, study_id)
    analyses = db.execute(
        select(AIAnalysis)
        .where(AIAnalysis.study_id == study.id)
        .order_by(AIAnalysis.created_at.desc())
        .limit(10)
    ).scalars().all()
    return {"items": [_analysis_to_dict(db, item, study.study_id) for item in analyses]}


class CreateConversationRequest(BaseModel):
    study_id: str | None = Field(default=None, max_length=20)
    title: str | None = Field(default=None, max_length=255)


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


def _get_conversation(db: Session, conversation_id: str) -> Conversation:
    try:
        key = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation = db.get(Conversation, key)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


def _conversation_to_dict(db: Session, conversation: Conversation, with_messages: bool) -> dict:
    study_row = None
    if conversation.study_id:
        study_row = db.execute(
            select(Study, Patient)
            .join(Patient, Study.patient_id == Patient.id)
            .where(Study.id == conversation.study_id)
        ).first()

    messages = db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    ).scalars().all()

    result = {
        "id": str(conversation.id),
        "title": conversation.title or "New conversation",
        "study_id": study_row[0].study_id if study_row else None,
        "study_description": study_row[0].study_description if study_row else None,
        "patient_name": (
            f"{study_row[1].first_name} {study_row[1].last_name}" if study_row else None
        ),
        "patient_id": study_row[1].patient_id if study_row else None,
        "created_at": _iso(conversation.created_at),
        "updated_at": _iso(conversation.updated_at),
        "message_count": len(messages),
        "last_message": messages[-1].content[:160] if messages else None,
    }
    if with_messages:
        result["messages"] = [
            {
                "id": str(item.id),
                "role": item.role,
                "content": item.content,
                "created_at": _iso(item.created_at),
            }
            for item in messages
        ]
    return result


@router.get("/conversations")
def list_conversations(study_id: str | None = None, db: Session = Depends(get_db)):
    query = select(Conversation).order_by(Conversation.updated_at.desc())
    if study_id:
        study, _ = _get_study(db, study_id)
        query = query.where(Conversation.study_id == study.id)
    conversations = db.execute(query.limit(100)).scalars().all()
    return {"items": [_conversation_to_dict(db, item, False) for item in conversations]}


@router.post("/conversations", status_code=201)
def create_conversation(payload: CreateConversationRequest, db: Session = Depends(get_db)):
    study = _get_study(db, payload.study_id)[0] if payload.study_id else None
    conversation = Conversation(
        user_id=DEMO_AUTHOR_ID,
        study_id=study.id if study else None,
        title=payload.title,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return _conversation_to_dict(db, conversation, True)


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    return _conversation_to_dict(db, _get_conversation(db, conversation_id), True)


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = _get_conversation(db, conversation_id)
    db.execute(delete(Message).where(Message.conversation_id == conversation.id))
    db.delete(conversation)
    db.commit()


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
):
    provider = _require_provider()
    conversation = _get_conversation(db, conversation_id)

    history = db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    ).scalars().all()

    if conversation.study_id:
        study, patient = db.execute(
            select(Study, Patient)
            .join(Patient, Study.patient_id == Patient.id)
            .where(Study.id == conversation.study_id)
        ).one()
        context = _study_context(db, study, patient)
    else:
        context = "No study is linked to this conversation."

    turns = [ChatTurn(role=item.role, content=item.content) for item in history]
    turns.append(ChatTurn(role="user", content=payload.content))

    try:
        answer = provider.chat(turns, context)
    except AIError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    db.add(Message(conversation_id=conversation.id, role="user", content=payload.content))
    db.add(Message(conversation_id=conversation.id, role="assistant", content=answer))
    if not conversation.title:
        conversation.title = payload.content[:80]
    conversation.updated_at = func.now()
    db.commit()

    return _conversation_to_dict(db, conversation, True)
