from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import requests

app = FastAPI(title="MEDIC Backend")

ORTHANC_URL = "http://localhost:8042"
ORTHANC_USERNAME = "orthanc"
ORTHANC_PASSWORD = "change-me"

# Allow browser-based OHIF to communicate with MEDIC.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "MEDIC backend is running"}


@app.get("/orthanc/system")
def orthanc_system():
    try:
        response = requests.get(
            f"{ORTHANC_URL}/system",
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=5,
        )

        response.raise_for_status()

        return response.json()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not connect to Orthanc: {error}",
        )


@app.get("/orthanc/studies")
def orthanc_studies():
    try:
        response = requests.get(
            f"{ORTHANC_URL}/studies",
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=5,
        )

        response.raise_for_status()

        return response.json()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve studies from Orthanc: {error}",
        )


@app.get("/orthanc/studies/{study_id}")
def orthanc_study(study_id: str):
    try:
        response = requests.get(
            f"{ORTHANC_URL}/studies/{study_id}",
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=5,
        )

        if response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Study not found in Orthanc",
            )

        response.raise_for_status()

        return response.json()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve study from Orthanc: {error}",
        )


@app.get("/dicom-web/config")
def dicom_web_config():
    return {
        "servers": {
            "dicomWeb": [
                {
                    "name": "MEDIC",
                    "wadoUriRoot": "http://127.0.0.1:8001/dicom-web",
                    "qidoRoot": "http://127.0.0.1:8001/dicom-web",
                    "wadoRoot": "http://127.0.0.1:8001/dicom-web",
                    "qidoSupportsIncludeField": True,
                    "supportsReject": False,
                    "imageRendering": "wadors",
                    "thumbnailRendering": "wadors",
                    "enableStudyLazyLoad": True,
                }
            ]
        }
    }


@app.get("/dicom-web/{path:path}")
def dicom_web_proxy(path: str, request: Request):
    """
    Proxy DICOMweb GET requests from the browser to Orthanc.
    """

    orthanc_endpoint = f"{ORTHANC_URL}/dicom-web/{path}"

    try:
        response = requests.get(
            orthanc_endpoint,
            params=request.query_params,
            headers={
                "Accept": request.headers.get("accept", "*/*"),
            },
            auth=(ORTHANC_USERNAME, ORTHANC_PASSWORD),
            timeout=30,
        )

        return Response(
            content=response.content,
            status_code=response.status_code,
            media_type=response.headers.get("content-type"),
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve DICOMweb data from Orthanc: {error}",
        )