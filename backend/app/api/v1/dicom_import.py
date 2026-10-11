
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services.dicom_sync import get_db, preview_study_sync

router = APIRouter(
    prefix="/dicom-import",
    tags=["DICOM Import"],
)


@router.get("/review")
def review_dicom_imports(
    db: Session = Depends(get_db),
):
    """
    Preview Orthanc studies that need import review.

    This endpoint does not modify PostgreSQL or Orthanc.
    """
    return preview_study_sync(db)
