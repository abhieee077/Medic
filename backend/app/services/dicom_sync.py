
import os
import secrets
from datetime import datetime
from uuid import UUID

import requests
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database.models import DicomInstance, Patient, Series, Study
from database.session import SessionLocal


ORTHANC_URL = os.getenv(
    "ORTHANC_URL", "http://127.0.0.1:8042"
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


def _dict(value) -> dict:
    return value if isinstance(value, dict) else {}


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value), "%Y%m%d").date()
    except ValueError:
        return None


def _parse_int(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def fetch_orthanc_studies() -> list[dict]:
    """Read study, series, and instance metadata from Orthanc."""
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
            continue

        tags = _dict(study_data.get("MainDicomTags"))
        patient_tags = _dict(study_data.get("PatientMainDicomTags"))
        series_ids = study_data.get("Series") or []
        if not isinstance(series_ids, list):
            series_ids = []

        series_results = []
        modalities = set()
        total_instances = 0

        for orthanc_series_id in series_ids:
            series_data = orthanc_json(f"series/{orthanc_series_id}")
            if not isinstance(series_data, dict):
                continue

            series_tags = _dict(series_data.get("MainDicomTags"))
            instance_ids = series_data.get("Instances") or []
            if not isinstance(instance_ids, list):
                instance_ids = []

            modality = series_tags.get("Modality")
            if modality:
                modalities.add(modality)

            instance_results = []
            for orthanc_instance_id in instance_ids:
                instance_data = orthanc_json(
                    f"instances/{orthanc_instance_id}"
                )
                if not isinstance(instance_data, dict):
                    raise HTTPException(
                        status_code=502,
                        detail="Orthanc returned invalid instance metadata.",
                    )

                instance_tags = _dict(
                    instance_data.get("MainDicomTags")
                )
                instance_results.append({
                    "orthanc_instance_id": instance_data.get(
                        "ID", orthanc_instance_id
                    ),
                    "sop_instance_uid": instance_tags.get(
                        "SOPInstanceUID"
                    ),
                    "instance_number": instance_tags.get(
                        "InstanceNumber"
                    ),
                    "sop_class_uid": instance_tags.get("SOPClassUID"),
                    "file_size": instance_data.get("FileSize"),
                })

            total_instances += len(instance_ids)
            series_results.append({
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
                "instances": instance_results,
            })

        results.append({
            "orthanc_study_id": orthanc_study_id,
            "study_instance_uid": tags.get("StudyInstanceUID"),
            "patient_id": patient_tags.get("PatientID"),
            "study_description": tags.get("StudyDescription"),
            "study_date": tags.get("StudyDate"),
            "study_time": tags.get("StudyTime"),
            "accession_number": tags.get("AccessionNumber"),
            "referring_physician": tags.get("ReferringPhysicianName"),
            "institution_name": tags.get("InstitutionName"),
            "modalities": sorted(modalities),
            "series_count": len(series_results),
            "instance_count": total_instances,
            "series": series_results,
        })

    return results


def preview_study_sync(db: Session) -> dict:
    """Preview exact StudyInstanceUID matches without database writes."""
    orthanc_studies = fetch_orthanc_studies()

    database_studies = db.scalars(
        select(Study).where(Study.study_instance_uid.is_not(None))
    ).all()

    studies_by_uid = {
        study.study_instance_uid: study for study in database_studies
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
            preview_item["application_study_id"] = existing_study.study_id
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


def confirm_study_import(
    db: Session,
    orthanc_study_id: str,
    patient_public_id: str,
) -> dict:
    """
    Import one Orthanc study for an explicitly selected existing patient.

    Orthanc is read-only here. PostgreSQL changes are committed atomically.
    """
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_public_id)
    )
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Re-fetch authoritative metadata; never trust study data from the client.
    study_data = orthanc_json(f"studies/{orthanc_study_id}")
    if not isinstance(study_data, dict):
        raise HTTPException(status_code=502, detail="Invalid Orthanc study.")

    main_tags = _dict(study_data.get("MainDicomTags"))
    study_uid = main_tags.get("StudyInstanceUID")
    series_ids = study_data.get("Series") or []

    if not isinstance(study_uid, str) or not study_uid.strip():
        raise HTTPException(
            status_code=422,
            detail="Study is missing StudyInstanceUID.",
        )
    if len(study_uid) > 128:
        raise HTTPException(status_code=422, detail="Study UID is too long.")
    if not isinstance(series_ids, list) or not series_ids:
        raise HTTPException(
            status_code=422, detail="Study contains no series."
        )

    if db.scalar(
        select(Study.id).where(Study.study_instance_uid == study_uid)
    ):
        raise HTTPException(
            status_code=409, detail="This study is already imported."
        )

    patient_tags = _dict(study_data.get("PatientMainDicomTags"))
    prepared_series = []
    all_series_uids = []
    all_sop_uids = []

    for orthanc_series_id in series_ids:
        series_data = orthanc_json(f"series/{orthanc_series_id}")
        if not isinstance(series_data, dict):
            raise HTTPException(
                status_code=502, detail="Invalid Orthanc series metadata."
            )

        tags = _dict(series_data.get("MainDicomTags"))
        series_uid = tags.get("SeriesInstanceUID")
        instance_ids = series_data.get("Instances") or []

        if not isinstance(series_uid, str) or not series_uid.strip():
            raise HTTPException(
                status_code=422,
                detail="A series is missing SeriesInstanceUID.",
            )
        if len(series_uid) > 128:
            raise HTTPException(status_code=422, detail="Series UID is too long.")
        if not isinstance(instance_ids, list) or not instance_ids:
            raise HTTPException(
                status_code=422,
                detail="A series contains no instances.",
            )

        instances = []
        for orthanc_instance_id in instance_ids:
            data = orthanc_json(f"instances/{orthanc_instance_id}")
            if not isinstance(data, dict):
                raise HTTPException(
                    status_code=502, detail="Invalid instance metadata."
                )

            instance_tags = _dict(data.get("MainDicomTags"))
            sop_uid = instance_tags.get("SOPInstanceUID")
            if not isinstance(sop_uid, str) or not sop_uid.strip():
                raise HTTPException(
                    status_code=422,
                    detail="An instance is missing SOPInstanceUID.",
                )
            if len(sop_uid) > 128:
                raise HTTPException(
                    status_code=422, detail="SOP Instance UID is too long."
                )

            all_sop_uids.append(sop_uid)
            instances.append({
                "orthanc_instance_id": data.get("ID", orthanc_instance_id),
                "sop_instance_uid": sop_uid,
                "instance_number": _parse_int(
                    instance_tags.get("InstanceNumber")
                ),
                "sop_class_uid": instance_tags.get("SOPClassUID"),
                "file_size": _parse_int(data.get("FileSize")),
            })

        all_series_uids.append(series_uid)
        prepared_series.append({
            "uid": series_uid,
            "number": _parse_int(tags.get("SeriesNumber")),
            "description": tags.get("SeriesDescription"),
            "modality": tags.get("Modality"),
            "body_part": tags.get("BodyPartExamined"),
            "instances": instances,
        })

    # Catch duplicates within the Orthanc study before inserting anything.
    if len(set(all_series_uids)) != len(all_series_uids):
        raise HTTPException(
            status_code=422, detail="Duplicate SeriesInstanceUID in study."
        )
    if len(set(all_sop_uids)) != len(all_sop_uids):
        raise HTTPException(
            status_code=422, detail="Duplicate SOPInstanceUID in study."
        )

    if db.scalar(
        select(Series.id).where(Series.series_instance_uid.in_(all_series_uids))
    ):
        raise HTTPException(
            status_code=409, detail="A series UID is already imported."
        )
    if db.scalar(
        select(DicomInstance.id).where(
            DicomInstance.sop_instance_uid.in_(all_sop_uids)
        )
    ):
        raise HTTPException(
            status_code=409, detail="An instance UID is already imported."
        )

    # Random public ID avoids relying on a race-prone MAX/count sequence.
    study_public_id = None
    for _ in range(5):
        candidate = f"ST-{secrets.token_hex(6).upper()}"
        if not db.scalar(
            select(Study.id).where(Study.study_id == candidate)
        ):
            study_public_id = candidate
            break
    if study_public_id is None:
        raise HTTPException(
            status_code=503,
            detail="Could not allocate a unique study ID. Try again.",
        )

    study = Study(
        study_id=study_public_id,
        patient_id=patient.id,
        study_instance_uid=study_uid,
        accession_number=main_tags.get("AccessionNumber"),
        study_description=main_tags.get("StudyDescription"),
        modality=",".join(sorted({
            item["modality"]
            for item in prepared_series
            if item["modality"]
        })) or None,
        study_date=_parse_date(main_tags.get("StudyDate")),
        study_time=main_tags.get("StudyTime"),
        status="READY",
        referring_physician=main_tags.get("ReferringPhysicianName"),
        institution_name=main_tags.get("InstitutionName"),
    )

    try:
        db.add(study)
        db.flush()

        for series_data in prepared_series:
            series = Series(
                series_instance_uid=series_data["uid"],
                study_id=study.id,
                series_number=series_data["number"],
                series_description=series_data["description"],
                modality=series_data["modality"],
                body_part=series_data["body_part"],
                number_of_instances=len(series_data["instances"]),
            )
            db.add(series)
            db.flush()

            for instance_data in series_data["instances"]:
                db.add(DicomInstance(
                    sop_instance_uid=instance_data["sop_instance_uid"],
                    series_id=series.id,
                    orthanc_instance_id=instance_data["orthanc_instance_id"],
                    instance_number=instance_data["instance_number"],
                    sop_class_uid=instance_data["sop_class_uid"],
                    file_size=instance_data["file_size"],
                ))

        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A duplicate identifier or database constraint prevented import.",
        ) from error
    except Exception:
        db.rollback()
        raise

    return {
        "mode": "imported",
        "database_writes": True,
        "study_id": study_public_id,
        "patient_id": patient.patient_id,
        "study_instance_uid": study_uid,
        "series_count": len(prepared_series),
        "instance_count": len(all_sop_uids),
    }


def get_db():
    """Yield a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
