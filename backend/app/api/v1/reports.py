from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.demo import DEMO_AUTHOR_ID
from database.models import Patient, Report, Study
from database.session import SessionLocal


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SaveDraftRequest(BaseModel):
    study_id: str = Field(min_length=1, max_length=20)
    findings: str = ""
    impression: str = ""


class FinalizeReportRequest(BaseModel):
    findings: str = ""
    impression: str = ""


def report_to_dict(report: Report) -> dict:
    return {
        "id": str(report.id),
        "report_id": report.report_id,
        "study_id": str(report.study_id),
        "status": report.status,
        "findings": report.findings or "",
        "impression": report.impression or "",
        "created_at": (
            report.created_at.isoformat()
            if report.created_at else None
        ),
        "updated_at": (
            report.updated_at.isoformat()
            if report.updated_at else None
        ),
    }


@router.post("/")
def save_draft(
    payload: SaveDraftRequest,
    db: Session = Depends(get_db),
):
    study = db.execute(
        select(Study).where(Study.study_id == payload.study_id)
    ).scalar_one_or_none()

    if study is None:
        raise HTTPException(status_code=404, detail="Study not found")

    report = db.execute(
        select(Report)
        .where(Report.study_id == study.id)
        .where(Report.status == "DRAFT")
        .order_by(Report.updated_at.desc())
    ).scalars().first()

    if report is None:
        report = Report(
            id=uuid4(),
            report_id=f"R-{uuid4().hex[:12].upper()}",
            study_id=study.id,
            author_id=DEMO_AUTHOR_ID,
            status="DRAFT",
            findings=payload.findings,
            impression=payload.impression,
        )
        db.add(report)
    else:
        report.findings = payload.findings
        report.impression = payload.impression

    try:
        db.commit()
        db.refresh(report)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save report draft",
        )

    return report_to_dict(report)


@router.post("/{report_id}/finalize")
def finalize_report(
    report_id: str,
    payload: FinalizeReportRequest,
    db: Session = Depends(get_db),
):
    report = db.execute(
        select(Report).where(Report.report_id == report_id)
    ).scalar_one_or_none()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status == "FINALIZED":
        raise HTTPException(status_code=409, detail="Report is already finalized")

    report.findings = payload.findings
    report.impression = payload.impression
    report.status = "FINALIZED"
    report.finalized_at = datetime.now()

    try:
        db.commit()
        db.refresh(report)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not finalize report",
        )

    return report_to_dict(report)

@router.post("/{report_id}/reopen")
def reopen_report(
    report_id: str,
    db: Session = Depends(get_db),
):
    report = db.execute(
        select(Report).where(Report.report_id == report_id)
    ).scalar_one_or_none()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "FINALIZED":
        raise HTTPException(status_code=409, detail="Report is not finalized")

    report.status = "DRAFT"
    report.finalized_at = None

    try:
        db.commit()
        db.refresh(report)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not reopen report",
        )

    return report_to_dict(report)

@router.get("/study/{study_id}")
def get_study_draft(
    study_id: str,
    db: Session = Depends(get_db),
):
    study = db.execute(
        select(Study).where(Study.study_id == study_id)
    ).scalar_one_or_none()

    if study is None:
        raise HTTPException(status_code=404, detail="Study not found")

    report = db.execute(
        select(Report)
        .where(Report.study_id == study.id)
        .where(Report.status == "DRAFT")
        .order_by(Report.updated_at.desc())
    ).scalars().first()

    if report is None:
        return {
            "study_id": study.study_id,
            "draft": None,
        }

    return {
        "study_id": study.study_id,
        "draft": report_to_dict(report),
    }


def _report_with_details(report: Report, study: Study, patient: Patient) -> dict:
    return {
        **report_to_dict(report),
        "study_id": study.study_id,
        "study_description": study.study_description,
        "modality": study.modality,
        "patient_id": patient.patient_id,
        "patient_name": f"{patient.first_name} {patient.last_name}",
        "mrn": patient.mrn,
    }


def _reports_query():
    return (
        select(Report, Study, Patient)
        .join(Study, Report.study_id == Study.id)
        .join(Patient, Study.patient_id == Patient.id)
    )


@router.get("/")
def list_reports(db: Session = Depends(get_db)):
    rows = db.execute(_reports_query().order_by(Report.updated_at.desc())).all()
    return [_report_with_details(*row) for row in rows]


@router.get("/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    row = db.execute(_reports_query().where(Report.report_id == report_id)).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return _report_with_details(*row)
