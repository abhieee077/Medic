
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services.dicom_sync import (
    confirm_study_import,
    get_db,
    preview_study_sync,
)


router = APIRouter(
    prefix="/dicom-import",
    tags=["DICOM Import"],
)


class ConfirmImportRequest(BaseModel):
    orthanc_study_id: str = Field(min_length=1, max_length=255)
    patient_id: str = Field(min_length=1, max_length=20)


@router.get("/review")
def review_dicom_imports(
    db: Session = Depends(get_db),
):
    """Preview Orthanc studies without modifying either system."""
    return preview_study_sync(db)


@router.post("/confirm")
def confirm_dicom_import(
    request: ConfirmImportRequest,
    db: Session = Depends(get_db),
):
    """Import a study after explicit patient selection."""
    return confirm_study_import(
        db=db,
        orthanc_study_id=request.orthanc_study_id,
        patient_public_id=request.patient_id,
    )
