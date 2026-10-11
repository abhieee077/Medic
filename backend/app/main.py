
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import dicom
from app.api.router import api_router

app = FastAPI(
    title="Medic API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing patient, study, and API status routes.
app.include_router(
    api_router,
    prefix="/api/v1",
)

# DICOM routes at the root, for OHIF.
app.include_router(dicom.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "medic-api",
    }
