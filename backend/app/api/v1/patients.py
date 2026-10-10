from fastapi import APIRouter

router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)


@router.get("/")
def get_patients():
    return {
        "items": [],
        "total": 0,
    }


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    return {
        "id": patient_id,
        "message": "Patient endpoint is ready",
    }