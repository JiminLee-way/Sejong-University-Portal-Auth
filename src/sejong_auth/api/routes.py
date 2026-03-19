from fastapi import APIRouter, HTTPException

from sejong_auth.client import SejongClient
from sejong_auth.exceptions import (
    LoginFailedError,
    NetworkError,
    ParseError,
    PortalError,
)
from sejong_auth.api.schemas import CredentialRequest, SemesterRequest

router = APIRouter(prefix="/api/v1")


def _handle_error(e: Exception) -> None:
    if isinstance(e, LoginFailedError):
        raise HTTPException(status_code=401, detail=str(e))
    if isinstance(e, (NetworkError, PortalError)):
        raise HTTPException(status_code=502, detail=str(e))
    if isinstance(e, ParseError):
        raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=500, detail=str(e))


@router.post("/grades")
async def get_grades(req: CredentialRequest):
    try:
        async with SejongClient() as client:
            await client.login(req.username, req.password)
            return (await client.get_grades()).model_dump()
    except Exception as e:
        _handle_error(e)


@router.post("/enrollments")
async def get_enrollments(req: SemesterRequest):
    try:
        async with SejongClient() as client:
            await client.login(req.username, req.password)
            return (
                await client.get_enrollments(
                    req.year or "", req.semester_code or ""
                )
            ).model_dump()
    except Exception as e:
        _handle_error(e)


@router.post("/scholarships")
async def get_scholarships(req: CredentialRequest):
    try:
        async with SejongClient() as client:
            await client.login(req.username, req.password)
            return (await client.get_scholarships()).model_dump()
    except Exception as e:
        _handle_error(e)
