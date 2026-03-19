from pydantic import BaseModel


class CredentialRequest(BaseModel):
    username: str
    password: str


class SemesterRequest(BaseModel):
    username: str
    password: str
    year: str | None = None
    semester_code: str | None = None
