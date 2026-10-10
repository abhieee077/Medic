from fastapi import APIRouter

router = APIRouter(
    prefix="/studies",
    tags=["Studies"],
)


@router.get("/")
def get_studies():
    return {
        "items": [],
        "total": 0,
    }


@router.get("/{study_id}")
def get_study(study_id: str):
    return {
        "id": study_id,
        "message": "Study endpoint is ready",
    }


@router.get("/{study_id}/series")
def get_study_series(study_id: str):
    return {
        "study_id": study_id,
        "items": [],
        "total": 0,
    }


@router.get("/{study_id}/images")
def get_study_images(study_id: str):
    return {
        "study_id": study_id,
        "items": [],
        "total": 0,
    }