from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import DicomInstance, Patient, Series, Study
from database.session import SessionLocal

router = APIRouter(
    prefix="/studies",
    tags=["Studies"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def study_to_dict(study: Study, patient: Patient) -> dict:
    return {
        "id": str(study.id),
        "study_id": study.study_id,
        "study_instance_uid": study.study_instance_uid,
        "study_description": study.study_description,
        "modality": study.modality,
        "study_date": (
            study.study_date.isoformat()
            if study.study_date
            else None
        ),
        "study_time": study.study_time,
        "status": study.status,
        "accession_number": study.accession_number,
        "patient": {
            "id": str(patient.id),
            "patient_id": patient.patient_id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "full_name": f"{patient.first_name} {patient.last_name}",
        },
    }


@router.get("/")
def get_studies(db: Session = Depends(get_db)):
    results = db.execute(
        select(Study, Patient)
        .join(Patient, Study.patient_id == Patient.id)
        .order_by(Study.study_id)
    ).all()

    return {
        "items": [
            study_to_dict(study, patient)
            for study, patient in results
        ],
        "total": len(results),
    }


@router.get("/{study_id}")
def get_study(
    study_id: str,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Study, Patient)
        .join(Patient, Study.patient_id == Patient.id)
        .where(Study.study_id == study_id)
    ).first()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Study not found",
        )

    study, patient = result
    return study_to_dict(study, patient)


@router.get("/{study_id}/series")
def get_study_series(
    study_id: str,
    db: Session = Depends(get_db),
):
    study = db.execute(
        select(Study).where(Study.study_id == study_id)
    ).scalar_one_or_none()

    if study is None:
        raise HTTPException(
            status_code=404,
            detail="Study not found",
        )

    results = db.execute(
        select(Series)
        .where(Series.study_id == study.id)
        .order_by(Series.series_number)
    ).scalars().all()

    items = [
        {
            "series_instance_uid": series.series_instance_uid,
            "series_number": series.series_number,
            "series_description": series.series_description,
            "modality": series.modality,
            "body_part": series.body_part,
            "number_of_instances": series.number_of_instances,
        }
        for series in results
    ]

    return {
        "study_id": study.study_id,
        "items": items,
        "total": len(items),
    }


@router.get("/{study_id}/images")
def get_study_images(
    study_id: str,
    db: Session = Depends(get_db),
):
    study = db.execute(
        select(Study).where(Study.study_id == study_id)
    ).scalar_one_or_none()

    if study is None:
        raise HTTPException(
            status_code=404,
            detail="Study not found",
        )

    results = db.execute(
        select(DicomInstance)
        .join(Series, DicomInstance.series_id == Series.id)
        .where(Series.study_id == study.id)
        .order_by(DicomInstance.instance_number)
    ).scalars().all()

    items = [
        {
            "sop_instance_uid": instance.sop_instance_uid,
            "orthanc_instance_id": instance.orthanc_instance_id,
            "instance_number": instance.instance_number,
            "sop_class_uid": instance.sop_class_uid,
            "file_size": instance.file_size,
        }
        for instance in results
    ]

    return {
        "study_id": study.study_id,
        "items": items,
        "total": len(items),
    }
