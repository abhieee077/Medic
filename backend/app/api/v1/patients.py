from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import Patient
from database.session import SessionLocal

router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def patient_to_dict(patient: Patient) -> dict:
    return {
        "id": str(patient.id),
        "patient_id": patient.patient_id,
        "mrn": patient.mrn,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "date_of_birth": (
            patient.date_of_birth.isoformat()
            if patient.date_of_birth
            else None
        ),
        "gender": patient.gender,
        "phone": patient.phone,
        "email": patient.email,
        "created_at": (
            patient.created_at.isoformat()
            if patient.created_at
            else None
        ),
        "updated_at": (
            patient.updated_at.isoformat()
            if patient.updated_at
            else None
        ),
    }


@router.get("/")
def get_patients(db: Session = Depends(get_db)):
    patients = db.scalars(
        select(Patient).order_by(Patient.patient_id)
    ).all()

    return {
        "items": [patient_to_dict(patient) for patient in patients],
        "total": len(patients),
    }


@router.get("/{patient_id}")
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
):
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_id)
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    return patient_to_dict(patient)
