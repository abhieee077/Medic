
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
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


class PatientCreate(BaseModel):
    patient_id: str = Field(min_length=1, max_length=20)
    mrn: str = Field(min_length=1, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(str_strip_whitespace=True)


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


@router.post("/", status_code=201)
def create_patient(
    request: PatientCreate,
    db: Session = Depends(get_db),
):
    patient_id = request.patient_id.strip()
    mrn = request.mrn.strip()
    first_name = request.first_name.strip()
    last_name = request.last_name.strip()

    if not patient_id or not mrn or not first_name or not last_name:
        raise HTTPException(
            status_code=422,
            detail="Patient ID, MRN, first name, and last name are required.",
        )

    existing = db.scalar(
        select(Patient).where(
            (Patient.patient_id == patient_id)
            | (Patient.mrn == mrn)
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A patient with this Patient ID or MRN already exists.",
        )

    patient = Patient(
        patient_id=patient_id,
        mrn=mrn,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=request.date_of_birth,
        gender=request.gender,
        phone=request.phone,
        email=str(request.email) if request.email else None,
        address=request.address,
    )

    try:
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient_to_dict(patient)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A patient with this Patient ID or MRN already exists.",
        )


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
