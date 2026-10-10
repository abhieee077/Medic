from fastapi import APIRouter

from app.api.v1 import patients, studies

api_router = APIRouter()


api_router.include_router(patients.router)
api_router.include_router(studies.router)


@api_router.get("/status")
def api_status():
    return {
        "status": "ok",
        "api": "v1",
        "service": "medic-api",
    }