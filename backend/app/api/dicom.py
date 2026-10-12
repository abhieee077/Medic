
import os

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

router = APIRouter(tags=["DICOM"])

ORTHANC_URL = os.getenv("ORTHANC_URL", "http://127.0.0.1:8042").rstrip("/")
ORTHANC_USERNAME = os.getenv("ORTHANC_USERNAME", "orthanc")
ORTHANC_PASSWORD = os.getenv("ORTHANC_PASSWORD", "")

TIMEOUT_SECONDS = 30

FORWARDED_RESPONSE_HEADERS = (
    "content-type",
    "content-range",
    "accept-ranges",
    "content-length",
    "content-disposition",
    "cache-control",
    "etag",
    "last-modified",
)


def orthanc_request(path: str, timeout: int = 5) -> requests.Response:
    """Send a request to Orthanc using server-side credentials."""
    try:
        response = requests.get(
            f"{ORTHANC_URL}/{path.lstrip('/')}",
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=timeout,
        )
        return response
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the Orthanc server.",
        ) from error


@router.get("/orthanc/system")
def orthanc_system():
    response = orthanc_request("system")
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve Orthanc system information.",
        )
    return response.json()


@router.get("/orthanc/studies")
def orthanc_studies():
    response = orthanc_request("studies")
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve studies from Orthanc.",
        )
    return response.json()


@router.get("/orthanc/studies/{study_id}")
def orthanc_study(study_id: str):
    response = orthanc_request(f"studies/{study_id}")

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Study not found in Orthanc")

    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve the study from Orthanc.",
        )

    return response.json()


@router.get("/dicom-web/config")
def dicom_web_config():
    return {
        "servers": {
            "dicomWeb": [
                {
                    "name": "MEDIC",
                    "wadoUriRoot": "/dicom-web",
                    "qidoRoot": "/dicom-web",
                    "wadoRoot": "/dicom-web",
                    "qidoSupportsIncludeField": True,
                    "supportsReject": False,
                    "imageRendering": "wadors",
                    "thumbnailRendering": "wadors",
                    "enableStudyLazyLoad": True,
                }
            ]
        }
    }


@router.get("/dicom-web/{path:path}")
def dicom_web_proxy(path: str, request: Request):
    """Proxy browser DICOMweb GET requests to the configured Orthanc server."""
    try:
        upstream = requests.get(
            f"{ORTHANC_URL}/dicom-web/{path}",
            params=list(request.query_params.multi_items()),
            headers={"Accept": request.headers.get("accept", "*/*")},
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve DICOMweb data from Orthanc.",
        ) from error

    response_headers = {
        name: upstream.headers[name]
        for name in FORWARDED_RESPONSE_HEADERS
        if name in upstream.headers
    }

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
    )
