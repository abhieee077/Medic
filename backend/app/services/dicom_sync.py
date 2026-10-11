
import os

import requests
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import Study
from database.session import SessionLocal


ORTHANC_URL = os.getenv(
    "ORTHANC_URL",
    "http://127.0.0.1:8042",
).rstrip("/")
ORTHANC_USERNAME = os.getenv("ORTHANC_USERNAME", "orthanc")
ORTHANC_PASSWORD = os.getenv("ORTHANC_PASSWORD", "")
ORTHANC_TIMEOUT_SECONDS = 15


def orthanc_get(path: str) -> requests.Response:
    """Retrieve metadata from Orthanc without modifying it."""
    try:
        response = requests.get(
            f"{ORTHANC_URL}/{path.lstrip('/')}",
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=ORTHANC_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve metadata from Orthanc.",
        ) from error


def orthanc_json(path: str):
    """Retrieve and validate a JSON response from Orthanc."""
    try:
        return orthanc_get(path).json()
    except (ValueError, requests.RequestException) as error:
        raise HTTPException(
            status_code=502,
            detail="Orthanc returned invalid metadata.",
        ) from error


def fetch_orthanc_studies() -> list[dict]:
    """Read Orthanc study metadata, including series-level modalities."""
    study_ids = orthanc_json("studies")

    if not isinstance(study_ids, list):
        raise HTTPException(
            status_code=502,
            detail="Orthanc returned an unexpected study list.",
        )

    results = []

    for orthanc_study_id in study_ids:
        study_data = orthanc_json(f"studies/{orthanc_study_id}")

        if not isinstance(study_data, dict):
            raise HTTPException(
                status_code=502,
                detail="Orthanc returned an invalid study record.",
            )

        tags = study_data.get("MainDicomTags") or {}
        patient_tags = study_data.get("PatientMainDicomTags") or {}
        series_ids = study_data.get("Series") or []

        if not isinstance(tags, dict):
            tags = {}
        if not isinstance(patient_tags, dict):
            patient_tags = {}
        if not isinstance(series_ids, list):
            series_ids = []

        series_results = []
        modalities = set()
        total_instances = 0

        for orthanc_series_id in series_ids:
            series_data = orthanc_json(
                f"series/{orthanc_series_id}"
            )

            if not isinstance(series_data, dict):
                continue

            series_tags = series_data.get("MainDicomTags") or {}
            if not isinstance(series_tags, dict):
                series_tags = {}

            instance_ids = series_data.get("Instances") or []
            if not isinstance(instance_ids, list):
                instance_ids = []

            modality = series_tags.get("Modality")
            if modality:
                modalities.add(modality)

            total_instances += len(instance_ids)

            series_results.append(
                {
                    "orthanc_series_id": orthanc_series_id,
                    "series_instance_uid": series_tags.get(
                        "SeriesInstanceUID"
                    ),
                    "series_number": series_tags.get("SeriesNumber"),
                    "series_description": series_tags.get(
                        "SeriesDescription"
                    ),
                    "modality": modality,
                    "body_part": series_tags.get("BodyPartExamined"),
                    "instance_count": len(instance_ids),
                }
            )

        results.append(
            {
                "orthanc_study_id": orthanc_study_id,
                "study_instance_uid": tags.get("StudyInstanceUID"),
                "patient_id": patient_tags.get("PatientID"),
                "study_description": tags.get("StudyDescription"),
                "modalities": sorted(modalities),
                "series_count": len(series_results),
                "instance_count": total_instances,
                "series": series_results,
            }
        )

    return results


def preview_study_sync(db: Session) -> dict:
    """
    Preview exact StudyInstanceUID matches.

    This function does not insert, update, or delete database records.
    """
    orthanc_studies = fetch_orthanc_studies()

    database_studies = db.scalars(
        select(Study).where(
            Study.study_instance_uid.is_not(None)
        )
    ).all()

    studies_by_uid = {
        study.study_instance_uid: study
        for study in database_studies
    }

    matched = []
    unmatched = []

    for item in orthanc_studies:
        uid = item["study_instance_uid"]
        existing_study = studies_by_uid.get(uid) if uid else None

        preview_item = {
            "orthanc_study_id": item["orthanc_study_id"],
            "study_instance_uid": uid,
            "study_description": item["study_description"],
            "modalities": item["modalities"],
            "series_count": item["series_count"],
            "instance_count": item["instance_count"],
        }

        if existing_study:
            preview_item["application_study_id"] = (
                existing_study.study_id
            )
            matched.append(preview_item)
        else:
            unmatched.append(preview_item)

    return {
        "mode": "preview_only",
        "database_writes": False,
        "orthanc_study_count": len(orthanc_studies),
        "matched_count": len(matched),
        "unmatched_count": len(unmatched),
        "matched": matched,
        "unmatched": unmatched,
    }


def get_db():
    """Yield a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
