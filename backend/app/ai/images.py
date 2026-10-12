"""Pick representative slices of a study and render them as PNG via Orthanc."""

import requests
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.services.dicom_sync import (
    ORTHANC_PASSWORD,
    ORTHANC_URL,
    ORTHANC_USERNAME,
    _orthanc_session,
)
from database.models import DicomInstance, Series, Study

MAX_SLICES = 6


def pick_series(db: Session, study: Study) -> Series | None:
    """The series with the most images is usually the main diagnostic one."""
    return db.execute(
        select(Series)
        .join(DicomInstance, DicomInstance.series_id == Series.id)
        .where(Series.study_id == study.id)
        .group_by(Series.id)
        .order_by(func.count(DicomInstance.id).desc(), Series.series_number)
    ).scalars().first()


def pick_instances(db: Session, series: Series, limit: int = MAX_SLICES) -> list[str]:
    """Evenly spaced Orthanc instance IDs, skipping the extreme first/last slices."""
    ids = [
        orthanc_id
        for orthanc_id in db.execute(
            select(DicomInstance.orthanc_instance_id)
            .where(DicomInstance.series_id == series.id)
            .order_by(DicomInstance.instance_number, DicomInstance.sop_instance_uid)
        ).scalars()
        if orthanc_id
    ]
    if len(ids) <= limit:
        return ids

    step = len(ids) / (limit + 1)
    return [ids[round(step * (index + 1))] for index in range(limit)]


def render_png(orthanc_instance_id: str) -> bytes:
    try:
        response = _orthanc_session.get(
            f"{ORTHANC_URL}/instances/{orthanc_instance_id}/rendered",
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            headers={"Accept": "image/png"},
            timeout=(10, 60),
        )
        response.raise_for_status()
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Could not render study images from Orthanc.",
        ) from error

    return response.content
