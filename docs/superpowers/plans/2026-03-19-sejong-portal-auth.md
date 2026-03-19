# Sejong Portal Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python library + FastAPI server that authenticates against Sejong University's portal SSO and fetches grade data via JSON API.

**Architecture:** httpx async client handles SSO login (form POST to portal.sejong.ac.kr) and grade API calls (JSON POST to sjpt.sejong.ac.kr). The library is the core; the FastAPI server is a thin stateless wrapper. Each API request creates a fresh client, logs in, fetches grades, and tears down.

**Tech Stack:** Python 3.11+, httpx, FastAPI, Pydantic, pytest, pytest-asyncio

**Spec:** `docs/superpowers/specs/2026-03-19-sejong-portal-auth-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `pyproject.toml` | Project metadata, dependencies, build config |
| `src/sejong_auth/__init__.py` | Public API exports |
| `src/sejong_auth/exceptions.py` | Custom exception hierarchy |
| `src/sejong_auth/models.py` | Pydantic models: Semester, Grade, CreditSummary, GradeReport |
| `src/sejong_auth/credential.py` | CredentialProvider ABC + EnvCredentialProvider, StaticCredentialProvider |
| `src/sejong_auth/client.py` | SejongClient: SSO login, grade fetching, session management |
| `src/sejong_auth/api/__init__.py` | Empty |
| `src/sejong_auth/api/schemas.py` | FastAPI request/response schemas |
| `src/sejong_auth/api/app.py` | FastAPI app factory |
| `src/sejong_auth/api/routes.py` | POST /api/v1/grades endpoint |
| `tests/conftest.py` | Shared fixtures |
| `tests/test_exceptions.py` | Exception hierarchy tests |
| `tests/test_models.py` | Pydantic model tests |
| `tests/test_credential.py` | CredentialProvider tests |
| `tests/test_client.py` | SejongClient tests (mocked HTTP) |
| `tests/test_api.py` | FastAPI endpoint tests |
| `.env.example` | Example env file |

---

### Task 1: Project Setup

**Files:**
- Create: `pyproject.toml`
- Create: `src/sejong_auth/__init__.py`
- Create: `tests/__init__.py`
- Create: `.env.example`

- [ ] **Step 1: Create pyproject.toml**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "sejong-auth"
version = "0.1.0"
description = "Sejong University portal authentication and grade fetching"
requires-python = ">=3.11"
dependencies = [
    "httpx>=0.27",
    "pydantic>=2.0",
    "fastapi>=0.110",
    "uvicorn>=0.29",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "httpx",  # for FastAPI TestClient
]

[tool.hatch.build.targets.wheel]
packages = ["src/sejong_auth"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create directory structure and empty init files**

```bash
mkdir -p src/sejong_auth/api tests
touch src/sejong_auth/__init__.py src/sejong_auth/api/__init__.py tests/__init__.py
```

- [ ] **Step 3: Create .env.example**

```
SEJONG_USERNAME=학번
SEJONG_PASSWORD=비밀번호
```

- [ ] **Step 4: Install dependencies**

Run: `pip install -e ".[dev]"`
Expected: Successful installation of all dependencies

- [ ] **Step 5: Verify pytest works**

Run: `pytest --co`
Expected: "no tests ran" (empty test collection, no errors)

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml src/ tests/ .env.example
git commit -m "feat: initial project setup with dependencies"
```

---

### Task 2: Exceptions

**Files:**
- Create: `src/sejong_auth/exceptions.py`
- Create: `tests/test_exceptions.py`

- [ ] **Step 1: Write tests**

```python
# tests/test_exceptions.py
from sejong_auth.exceptions import (
    SejongAuthError,
    LoginFailedError,
    SessionExpiredError,
    NetworkError,
    PortalError,
    ParseError,
)


def test_all_exceptions_inherit_from_base():
    for exc_cls in [LoginFailedError, SessionExpiredError, NetworkError, PortalError, ParseError]:
        assert issubclass(exc_cls, SejongAuthError)


def test_base_inherits_from_exception():
    assert issubclass(SejongAuthError, Exception)


def test_exception_message():
    err = LoginFailedError("bad password")
    assert str(err) == "bad password"
    assert isinstance(err, SejongAuthError)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_exceptions.py -v`
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Implement exceptions**

```python
# src/sejong_auth/exceptions.py


class SejongAuthError(Exception):
    """Base exception for sejong-auth."""


class LoginFailedError(SejongAuthError):
    """Raised when login fails due to invalid credentials."""


class SessionExpiredError(SejongAuthError):
    """Raised when session is expired or login() was not called."""


class NetworkError(SejongAuthError):
    """Raised on connection failure, timeout, or DNS error."""


class PortalError(SejongAuthError):
    """Raised when portal returns unexpected HTTP status."""


class ParseError(SejongAuthError):
    """Raised when JSON response structure has changed."""
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_exceptions.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/sejong_auth/exceptions.py tests/test_exceptions.py
git commit -m "feat: add exception hierarchy"
```

---

### Task 3: Data Models

**Files:**
- Create: `src/sejong_auth/models.py`
- Create: `tests/test_models.py`

- [ ] **Step 1: Write tests**

```python
# tests/test_models.py
import pytest
from sejong_auth.models import Semester, Grade, CreditSummary, GradeReport


def test_semester_values():
    assert Semester.FIRST == "1학기"
    assert Semester.SECOND == "2학기"
    assert Semester.SUMMER == "여름학기"
    assert Semester.WINTER == "겨울학기"


def test_grade_creation():
    g = Grade(
        year=2025,
        semester=Semester.FIRST,
        course_code="001357",
        section="008",
        course_name="미적분학1",
        course_type="기필",
        graduation_course_type="기필",
        credit=3.0,
        grade="B0",
        grade_point=3.0,
        evaluation_type="GRADE",
        retake=False,
    )
    assert g.course_name == "미적분학1"
    assert g.elective_area is None
    assert g.teaching_area is None


def test_grade_with_pnp():
    g = Grade(
        year=2025,
        semester=Semester.SECOND,
        course_code="008364",
        section="002",
        course_name="세종사회봉사1",
        course_type="교선",
        graduation_course_type="교선",
        credit=1.0,
        grade="P",
        grade_point=0.0,
        evaluation_type="P/NP",
        retake=False,
        elective_area="자기계발과진로",
    )
    assert g.evaluation_type == "P/NP"
    assert g.elective_area == "자기계발과진로"


def test_credit_summary():
    cs = CreditSummary(
        liberal_required=10,
        liberal_total=20,
        major_required=0,
        major_elective=0,
        major_basic=15,
        major_total=15,
    )
    assert cs.liberal_total == 20


def test_grade_report():
    report = GradeReport(
        student_id="20241234",
        student_name="홍길동",
        major="컴퓨터공학과",
        year_level=2,
        grades=[],
        credit_summary=CreditSummary(
            liberal_required=10, liberal_total=20,
            major_required=0, major_elective=0,
            major_basic=15, major_total=15,
        ),
        total_gpa=2.95,
        total_earned_credits=35,
        total_attempted_credits=36,
        graduation_credits=35,
        liberal_gpa=3.17,
        major_gpa=2.70,
        percentile=83.5,
    )
    assert report.student_name == "홍길동"
    assert report.total_gpa == 2.95
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_models.py -v`
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Implement models**

```python
# src/sejong_auth/models.py
from enum import Enum

from pydantic import BaseModel


class Semester(str, Enum):
    FIRST = "1학기"
    SECOND = "2학기"
    SUMMER = "여름학기"
    WINTER = "겨울학기"


class Grade(BaseModel):
    year: int
    semester: Semester
    course_code: str
    section: str
    course_name: str
    course_type: str
    graduation_course_type: str
    credit: float
    grade: str
    grade_point: float
    evaluation_type: str
    retake: bool
    elective_area: str | None = None
    teaching_area: str | None = None


class CreditSummary(BaseModel):
    liberal_required: float
    liberal_total: float
    major_required: float
    major_elective: float
    major_basic: float
    major_total: float


class GradeReport(BaseModel):
    student_id: str
    student_name: str
    major: str
    year_level: int
    grades: list[Grade]
    credit_summary: CreditSummary
    total_gpa: float
    total_earned_credits: float
    total_attempted_credits: float
    graduation_credits: float
    liberal_gpa: float
    major_gpa: float
    percentile: float
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_models.py -v`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/sejong_auth/models.py tests/test_models.py
git commit -m "feat: add Pydantic data models"
```

---

### Task 4: Credential Providers

**Files:**
- Create: `src/sejong_auth/credential.py`
- Create: `tests/test_credential.py`

- [ ] **Step 1: Write tests**

```python
# tests/test_credential.py
import os
import pytest
from sejong_auth.credential import (
    CredentialProvider,
    StaticCredentialProvider,
    EnvCredentialProvider,
)


async def test_static_provider():
    provider = StaticCredentialProvider("myid", "mypass")
    username, password = await provider.get_credentials()
    assert username == "myid"
    assert password == "mypass"


async def test_env_provider(monkeypatch):
    monkeypatch.setenv("SEJONG_USERNAME", "envid")
    monkeypatch.setenv("SEJONG_PASSWORD", "envpass")
    provider = EnvCredentialProvider()
    username, password = await provider.get_credentials()
    assert username == "envid"
    assert password == "envpass"


async def test_env_provider_missing_vars():
    provider = EnvCredentialProvider("MISSING_USER", "MISSING_PASS")
    with pytest.raises(ValueError, match="not set"):
        await provider.get_credentials()


def test_credential_provider_is_abstract():
    with pytest.raises(TypeError):
        CredentialProvider()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_credential.py -v`
Expected: FAIL

- [ ] **Step 3: Implement credential providers**

```python
# src/sejong_auth/credential.py
import os
from abc import ABC, abstractmethod


class CredentialProvider(ABC):
    @abstractmethod
    async def get_credentials(self) -> tuple[str, str]:
        ...


class StaticCredentialProvider(CredentialProvider):
    def __init__(self, username: str, password: str) -> None:
        self._username = username
        self._password = password

    async def get_credentials(self) -> tuple[str, str]:
        return self._username, self._password


class EnvCredentialProvider(CredentialProvider):
    def __init__(
        self,
        username_var: str = "SEJONG_USERNAME",
        password_var: str = "SEJONG_PASSWORD",
    ) -> None:
        self._username_var = username_var
        self._password_var = password_var

    async def get_credentials(self) -> tuple[str, str]:
        username = os.environ.get(self._username_var)
        password = os.environ.get(self._password_var)
        if not username or not password:
            missing = []
            if not username:
                missing.append(self._username_var)
            if not password:
                missing.append(self._password_var)
            raise ValueError(f"Environment variable(s) not set: {', '.join(missing)}")
        return username, password
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_credential.py -v`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/sejong_auth/credential.py tests/test_credential.py
git commit -m "feat: add credential providers"
```

---

### Task 5: SejongClient — Login

**Files:**
- Create: `src/sejong_auth/client.py`
- Create: `tests/test_client.py`
- Create: `tests/conftest.py`

This is the most complex task. We mock httpx to test without hitting the real portal.

- [ ] **Step 1: Write conftest with shared fixtures**

```python
# tests/conftest.py
import json
from urllib.parse import quote, urlencode

import pytest


@pytest.fixture
def make_add_param():
    """Helper to create addParam query strings like the portal does."""
    import base64

    def _make(data: dict) -> str:
        json_str = json.dumps(data, separators=(",", ":"))
        url_encoded = quote(json_str, safe="")
        return base64.b64encode(url_encoded.encode()).decode()

    return _make
```

- [ ] **Step 2: Write login tests**

```python
# tests/test_client.py
import httpx
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from sejong_auth.client import SejongClient
from sejong_auth.credential import StaticCredentialProvider
from sejong_auth.exceptions import LoginFailedError, SessionExpiredError


async def test_login_with_direct_credentials():
    """Login with username/password directly sets session state."""
    mock_transport = httpx.MockTransport(lambda req: _mock_login_handler(req))

    async with SejongClient() as client:
        client._http = httpx.AsyncClient(transport=mock_transport)
        await client.login("20241234", "testpass")
        assert client._logged_in is True
        assert client._student_id == "20241234"


async def test_login_with_provider():
    """Login via CredentialProvider works."""
    provider = StaticCredentialProvider("20241234", "testpass")
    mock_transport = httpx.MockTransport(lambda req: _mock_login_handler(req))

    async with SejongClient(credential_provider=provider) as client:
        client._http = httpx.AsyncClient(transport=mock_transport)
        await client.login()
        assert client._logged_in is True


async def test_login_partial_credentials_raises():
    """Passing only username or only password raises ValueError."""
    async with SejongClient() as client:
        with pytest.raises(ValueError):
            await client.login(username="20241234")
        with pytest.raises(ValueError):
            await client.login(password="testpass")


async def test_login_no_credentials_no_provider_raises():
    """No credentials and no provider raises ValueError."""
    async with SejongClient() as client:
        with pytest.raises(ValueError):
            await client.login()


async def test_login_failed_wrong_password():
    """Wrong password triggers LoginFailedError."""
    def handler(req: httpx.Request) -> httpx.Response:
        if "login_action" in str(req.url):
            # Portal redirects back to login page on failure
            return httpx.Response(200, text='<title>세종대학교 포탈</title><script>alert("ID 또는 비밀번호가 올바르지 않습니다")</script>')
        return httpx.Response(200)

    mock_transport = httpx.MockTransport(handler)
    async with SejongClient() as client:
        client._http = httpx.AsyncClient(transport=mock_transport)
        with pytest.raises(LoginFailedError):
            await client.login("20241234", "wrongpass")


def _mock_login_handler(req: httpx.Request) -> httpx.Response:
    """Simulate the SSO login flow."""
    url = str(req.url)
    if "login_action" in url:
        # Step 1: SSO login returns redirect (simulated as 200 with cookies)
        return httpx.Response(
            200,
            headers={"set-cookie": "ssotoken=fake_token; Path=/"},
            text="<html>redirect</html>",
        )
    if "doSsoLogin" in url:
        # Step 2: Portal redirect sets session
        return httpx.Response(
            200,
            headers={"set-cookie": "PO1_JSESSIONID=fake_session; Path=/"},
            text="<html>portal</html>",
        )
    if "initUserInfo" in url:
        # Step 3: Returns session metadata
        import json
        return httpx.Response(200, json={
            "INTG_USR_NO": "20241234",
            "PG_LOGIN_DT": "20260319130000",
            "RUNNING_SEJONG": "test-uuid-1234",
        })
    return httpx.Response(200)
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pytest tests/test_client.py -v`
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 4: Implement SejongClient login**

```python
# src/sejong_auth/client.py
from __future__ import annotations

import base64
import json
from urllib.parse import quote

import httpx

from sejong_auth.credential import CredentialProvider
from sejong_auth.exceptions import (
    LoginFailedError,
    NetworkError,
    ParseError,
    PortalError,
    SessionExpiredError,
)
from sejong_auth.models import (
    CreditSummary,
    Grade,
    GradeReport,
    Semester,
)

PORTAL_LOGIN_URL = "https://portal.sejong.ac.kr/jsp/login/login_action.jsp"
SJPT_SSO_URL = "https://sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p="
SJPT_USER_INFO_URL = "https://sjpt.sejong.ac.kr/main/sys/UserInfo/initUserInfo.do"
SJPT_STUDENT_INFO_URL = "https://sjpt.sejong.ac.kr/sch/sch/sys/SchStudentBaseInfo/doStudent.do"
SJPT_GRADE_LIST_URL = "https://sjpt.sejong.ac.kr/sch/sch/sug/SugRecordQ/doList.do"

_JSON_HEADERS = {
    "Content-Type": 'application/json; charset="UTF-8"',
    "Accept": "application/json",
}


class SejongClient:
    """세종대 포털 인증 + 데이터 조회 클라이언트."""

    def __init__(self, credential_provider: CredentialProvider | None = None) -> None:
        self._http = httpx.AsyncClient(follow_redirects=True, timeout=30.0)
        self._credential_provider = credential_provider
        self._logged_in = False
        self._student_id: str = ""
        self._login_dt: str = ""
        self._running_sejong: str = ""

    async def login(
        self,
        username: str | None = None,
        password: str | None = None,
    ) -> None:
        """Authenticate against Sejong portal SSO."""
        username, password = await self._resolve_credentials(username, password)

        try:
            # Step 1: SSO form login
            resp = await self._http.post(
                PORTAL_LOGIN_URL,
                data={
                    "id": username,
                    "password": password,
                    "mainLogin": "Y",
                    "rtUrl": "sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=",
                },
            )
            # Check for login failure (portal returns login page with error)
            if "올바르지 않습니다" in resp.text or "로그인 페이지로 이동" in resp.text:
                raise LoginFailedError("아이디 또는 비밀번호가 올바르지 않습니다")

            # Step 2: Access sjpt portal to establish session
            await self._http.get(SJPT_SSO_URL)

            # Step 3: Get session metadata
            resp = await self._http.post(SJPT_USER_INFO_URL)
            data = resp.json()
            self._student_id = data.get("INTG_USR_NO", username)
            self._login_dt = data.get("PG_LOGIN_DT", "")
            self._running_sejong = data.get("RUNNING_SEJONG", "")
            self._logged_in = True

        except LoginFailedError:
            raise
        except httpx.TimeoutException as e:
            raise NetworkError(f"Connection timed out: {e}") from e
        except httpx.ConnectError as e:
            raise NetworkError(f"Connection failed: {e}") from e
        except Exception as e:
            if isinstance(e, (NetworkError, LoginFailedError)):
                raise
            raise PortalError(f"Unexpected error during login: {e}") from e

    async def _resolve_credentials(
        self,
        username: str | None,
        password: str | None,
    ) -> tuple[str, str]:
        both_provided = username is not None and password is not None
        neither_provided = username is None and password is None

        if both_provided:
            return username, password  # type: ignore[return-value]

        if not neither_provided:
            raise ValueError("Provide both username and password, or neither")

        if self._credential_provider is None:
            raise ValueError(
                "No credentials provided and no credential_provider configured"
            )

        return await self._credential_provider.get_credentials()

    def _make_add_param(self, extra: dict | None = None) -> str:
        data = {
            "_runPgmKey": "SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ",
            "_runSysKey": "SCH",
            "_runIntgUsrNo": self._student_id,
            "_runPgLoginDt": self._login_dt,
            "_runningSejong": self._running_sejong,
        }
        if extra:
            data.update(extra)
        json_str = json.dumps(data, separators=(",", ":"))
        url_encoded = quote(json_str, safe="")
        return base64.b64encode(url_encoded.encode()).decode()

    async def get_grades(self) -> GradeReport:
        """Fetch complete grade report. Must call login() first."""
        if not self._logged_in:
            raise SessionExpiredError("Not logged in. Call login() first.")

        try:
            add_param = self._make_add_param()

            # Fetch student info
            student_resp = await self._http.post(
                SJPT_STUDENT_INFO_URL,
                params={"addParam": add_param},
                headers=_JSON_HEADERS,
                json={
                    "dm_reqKey": {
                        "keyOrgnClsfCd": "20",
                        "keyStudentNo": self._student_id,
                        "keyStudentImagPath": "",
                        "keyYear": "",
                        "keySmtCd": "",
                    }
                },
            )
            student_data = student_resp.json()

            # Fetch grade list
            grade_resp = await self._http.post(
                SJPT_GRADE_LIST_URL,
                params={"addParam": add_param},
                headers=_JSON_HEADERS,
                json={
                    "dm_search": {
                        "ORGN_CLSF_CD": "20",
                        "YEAR": "",
                        "SMT_CD": "",
                        "RECORD_YN": "Y",
                        "STUDENT_NO": self._student_id,
                        "STUDENT_NM": "",
                        "YEAR_SMT": "",
                    }
                },
            )
            grade_data = grade_resp.json()

            return self._build_grade_report(student_data, grade_data)

        except httpx.TimeoutException as e:
            raise NetworkError(f"Connection timed out: {e}") from e
        except httpx.ConnectError as e:
            raise NetworkError(f"Connection failed: {e}") from e
        except (KeyError, TypeError, ValueError) as e:
            raise ParseError(f"Failed to parse portal response: {e}") from e

    def _build_grade_report(self, student_data: dict, grade_data: dict) -> GradeReport:
        """Convert raw JSON responses into GradeReport model.

        NOTE: The exact JSON keys depend on the portal response.
        This implementation uses placeholder keys that must be
        adjusted after testing against the real portal.
        """
        # Parse student info — keys will be adjusted based on real response
        student_info = student_data.get("dm_studentInfo", student_data)

        # Parse grades — the grade list key will be adjusted
        raw_grades = grade_data.get("dl_record", grade_data.get("data", []))
        if isinstance(raw_grades, dict):
            raw_grades = raw_grades.get("data", [])

        grades = []
        for row in raw_grades:
            semester_str = row.get("SMT_NM", row.get("학기", ""))
            grades.append(
                Grade(
                    year=int(row.get("YEAR", row.get("년도", 0))),
                    semester=self._parse_semester(semester_str),
                    course_code=row.get("LSSN_NO", row.get("학수번호", "")),
                    section=row.get("CLASS_NO", row.get("분반", "")),
                    course_name=row.get("LSSN_NM", row.get("교과목명", "")),
                    course_type=row.get("ISU_NM", row.get("이수구분", "")),
                    graduation_course_type=row.get("CHG_ISU_NM", row.get("졸업심사용이수구분", "")),
                    credit=float(row.get("CDT", row.get("학점", 0))),
                    grade=row.get("MRKS_GRD", row.get("등급", "")),
                    grade_point=float(row.get("MRKS", row.get("평점", 0))),
                    evaluation_type=row.get("EVAL_NM", row.get("평가방식", "")),
                    retake=row.get("RETAKE_YN", row.get("재수강", "")) != "",
                    elective_area=row.get("SEL_AREA_NM") or None,
                    teaching_area=row.get("TCHR_AREA_NM") or None,
                )
            )

        # Parse summary — keys to be adjusted
        summary = grade_data.get("dm_summary", {})
        credit_info = grade_data.get("dm_credit", {})

        return GradeReport(
            student_id=self._student_id,
            student_name=student_info.get("STUDENT_NM", student_info.get("성명", "")),
            major=student_info.get("DEPT_NM", student_info.get("학과", "")),
            year_level=int(student_info.get("YEAR_LEVEL", student_info.get("학년", 0))),
            grades=grades,
            credit_summary=CreditSummary(
                liberal_required=float(credit_info.get("LIB_REQ", 0)),
                liberal_total=float(credit_info.get("LIB_TOT", 0)),
                major_required=float(credit_info.get("MAJ_REQ", 0)),
                major_elective=float(credit_info.get("MAJ_ELC", 0)),
                major_basic=float(credit_info.get("MAJ_BAS", 0)),
                major_total=float(credit_info.get("MAJ_TOT", 0)),
            ),
            total_gpa=float(summary.get("GPA", 0)),
            total_earned_credits=float(summary.get("EARNED", 0)),
            total_attempted_credits=float(summary.get("ATTEMPTED", 0)),
            graduation_credits=float(summary.get("GRAD_CDT", 0)),
            liberal_gpa=float(summary.get("LIB_GPA", 0)),
            major_gpa=float(summary.get("MAJ_GPA", 0)),
            percentile=float(summary.get("PERCENTILE", 0)),
        )

    @staticmethod
    def _parse_semester(value: str) -> Semester:
        mapping = {
            "1학기": Semester.FIRST,
            "2학기": Semester.SECOND,
            "여름학기": Semester.SUMMER,
            "겨울학기": Semester.WINTER,
        }
        result = mapping.get(value)
        if result is None:
            raise ParseError(f"Unknown semester: {value}")
        return result

    async def close(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> SejongClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pytest tests/test_client.py -v`
Expected: 5 passed

- [ ] **Step 6: Commit**

```bash
git add src/sejong_auth/client.py tests/test_client.py tests/conftest.py
git commit -m "feat: implement SejongClient with SSO login"
```

---

### Task 6: SejongClient — Grade Fetching Tests

**Files:**
- Modify: `tests/test_client.py`

- [ ] **Step 1: Add grade fetching tests**

Append to `tests/test_client.py`:

```python
async def test_get_grades_without_login_raises():
    async with SejongClient() as client:
        with pytest.raises(SessionExpiredError, match="Not logged in"):
            await client.get_grades()


async def test_get_grades_returns_grade_report():
    """After login, get_grades returns a GradeReport with parsed data."""
    from sejong_auth.models import GradeReport

    def handler(req: httpx.Request) -> httpx.Response:
        url = str(req.url)
        if "login_action" in url:
            return httpx.Response(200, text="<html>ok</html>")
        if "doSsoLogin" in url:
            return httpx.Response(200, text="<html>portal</html>")
        if "initUserInfo" in url:
            return httpx.Response(200, json={
                "INTG_USR_NO": "20241234",
                "PG_LOGIN_DT": "20260319130000",
                "RUNNING_SEJONG": "test-uuid",
            })
        if "doStudent" in url:
            return httpx.Response(200, json={
                "dm_studentInfo": {
                    "STUDENT_NM": "홍길동",
                    "DEPT_NM": "컴퓨터공학과",
                    "YEAR_LEVEL": "2",
                }
            })
        if "doList" in url:
            return httpx.Response(200, json={
                "dl_record": [
                    {
                        "YEAR": "2025",
                        "SMT_NM": "1학기",
                        "LSSN_NO": "001357",
                        "CLASS_NO": "008",
                        "LSSN_NM": "미적분학1",
                        "ISU_NM": "기필",
                        "CHG_ISU_NM": "기필",
                        "CDT": "3",
                        "MRKS_GRD": "B0",
                        "MRKS": "3.0",
                        "EVAL_NM": "GRADE",
                        "RETAKE_YN": "",
                    },
                ],
                "dm_summary": {
                    "GPA": "2.95",
                    "EARNED": "35",
                    "ATTEMPTED": "36",
                    "GRAD_CDT": "35",
                    "LIB_GPA": "3.17",
                    "MAJ_GPA": "2.70",
                    "PERCENTILE": "83.5",
                },
                "dm_credit": {
                    "LIB_REQ": "10",
                    "LIB_TOT": "20",
                    "MAJ_REQ": "0",
                    "MAJ_ELC": "0",
                    "MAJ_BAS": "15",
                    "MAJ_TOT": "15",
                },
            })
        return httpx.Response(200)

    mock_transport = httpx.MockTransport(handler)
    async with SejongClient() as client:
        client._http = httpx.AsyncClient(transport=mock_transport)
        await client.login("20241234", "testpass")
        report = await client.get_grades()

        assert isinstance(report, GradeReport)
        assert report.student_name == "홍길동"
        assert report.total_gpa == 2.95
        assert len(report.grades) == 1
        assert report.grades[0].course_name == "미적분학1"
        assert report.credit_summary.major_basic == 15
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pytest tests/test_client.py -v`
Expected: 7 passed

- [ ] **Step 3: Commit**

```bash
git add tests/test_client.py
git commit -m "test: add grade fetching tests"
```

---

### Task 7: Public API Exports

**Files:**
- Modify: `src/sejong_auth/__init__.py`

- [ ] **Step 1: Add exports**

```python
# src/sejong_auth/__init__.py
from sejong_auth.client import SejongClient
from sejong_auth.credential import (
    CredentialProvider,
    EnvCredentialProvider,
    StaticCredentialProvider,
)
from sejong_auth.exceptions import (
    LoginFailedError,
    NetworkError,
    ParseError,
    PortalError,
    SejongAuthError,
    SessionExpiredError,
)
from sejong_auth.models import (
    CreditSummary,
    Grade,
    GradeReport,
    Semester,
)

__all__ = [
    "SejongClient",
    "CredentialProvider",
    "EnvCredentialProvider",
    "StaticCredentialProvider",
    "SejongAuthError",
    "LoginFailedError",
    "SessionExpiredError",
    "NetworkError",
    "PortalError",
    "ParseError",
    "Semester",
    "Grade",
    "CreditSummary",
    "GradeReport",
]
```

- [ ] **Step 2: Verify imports work**

Run: `python -c "from sejong_auth import SejongClient, GradeReport; print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/sejong_auth/__init__.py
git commit -m "feat: add public API exports"
```

---

### Task 8: FastAPI Server

**Files:**
- Create: `src/sejong_auth/api/schemas.py`
- Create: `src/sejong_auth/api/routes.py`
- Create: `src/sejong_auth/api/app.py`
- Create: `tests/test_api.py`

- [ ] **Step 1: Write API tests**

```python
# tests/test_api.py
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from sejong_auth.api.app import create_app
from sejong_auth.models import CreditSummary, Grade, GradeReport, Semester
from sejong_auth.exceptions import LoginFailedError, NetworkError


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def mock_grade_report():
    return GradeReport(
        student_id="20241234",
        student_name="홍길동",
        major="컴퓨터공학과",
        year_level=2,
        grades=[
            Grade(
                year=2025, semester=Semester.FIRST,
                course_code="001357", section="008",
                course_name="미적분학1", course_type="기필",
                graduation_course_type="기필", credit=3.0,
                grade="B0", grade_point=3.0,
                evaluation_type="GRADE", retake=False,
            )
        ],
        credit_summary=CreditSummary(
            liberal_required=10, liberal_total=20,
            major_required=0, major_elective=0,
            major_basic=15, major_total=15,
        ),
        total_gpa=2.95, total_earned_credits=35,
        total_attempted_credits=36, graduation_credits=35,
        liberal_gpa=3.17, major_gpa=2.70, percentile=83.5,
    )


async def test_grades_endpoint_success(app, mock_grade_report):
    with patch("sejong_auth.api.routes.SejongClient") as MockClient:
        instance = AsyncMock()
        instance.login = AsyncMock()
        instance.get_grades = AsyncMock(return_value=mock_grade_report)
        instance.close = AsyncMock()
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = instance

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            resp = await ac.post("/api/v1/grades", json={
                "username": "20241234",
                "password": "testpass",
            })

        assert resp.status_code == 200
        data = resp.json()
        assert data["student_name"] == "홍길동"
        assert data["total_gpa"] == 2.95


async def test_grades_endpoint_login_failed(app):
    with patch("sejong_auth.api.routes.SejongClient") as MockClient:
        instance = AsyncMock()
        instance.login = AsyncMock(side_effect=LoginFailedError("bad creds"))
        instance.close = AsyncMock()
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = instance

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            resp = await ac.post("/api/v1/grades", json={
                "username": "20241234",
                "password": "wrongpass",
            })

        assert resp.status_code == 401


async def test_grades_endpoint_network_error(app):
    with patch("sejong_auth.api.routes.SejongClient") as MockClient:
        instance = AsyncMock()
        instance.login = AsyncMock(side_effect=NetworkError("timeout"))
        instance.close = AsyncMock()
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = instance

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            resp = await ac.post("/api/v1/grades", json={
                "username": "20241234",
                "password": "testpass",
            })

        assert resp.status_code == 502
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_api.py -v`
Expected: FAIL

- [ ] **Step 3: Implement schemas**

```python
# src/sejong_auth/api/schemas.py
from pydantic import BaseModel


class GradeRequest(BaseModel):
    username: str
    password: str


class ErrorResponse(BaseModel):
    detail: str
```

- [ ] **Step 4: Implement routes**

```python
# src/sejong_auth/api/routes.py
from fastapi import APIRouter, HTTPException

from sejong_auth.client import SejongClient
from sejong_auth.exceptions import (
    LoginFailedError,
    NetworkError,
    ParseError,
    PortalError,
)
from sejong_auth.api.schemas import GradeRequest

router = APIRouter(prefix="/api/v1")


@router.post("/grades")
async def get_grades(req: GradeRequest):
    try:
        async with SejongClient() as client:
            await client.login(req.username, req.password)
            report = await client.get_grades()
            return report.model_dump()
    except LoginFailedError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except (NetworkError, PortalError) as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ParseError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 5: Implement app factory**

```python
# src/sejong_auth/api/app.py
from fastapi import FastAPI

from sejong_auth.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(title="Sejong Portal Auth API")
    app.include_router(router)
    return app


app = create_app()
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pytest tests/test_api.py -v`
Expected: 3 passed

- [ ] **Step 7: Commit**

```bash
git add src/sejong_auth/api/ tests/test_api.py
git commit -m "feat: add FastAPI server with grades endpoint"
```

---

### Task 9: Integration Test Against Real Portal

**Files:**
- Create: `tests/test_integration.py`

This test hits the real portal. Skip in CI, run manually.

- [ ] **Step 1: Write integration test**

```python
# tests/test_integration.py
import os
import pytest

from sejong_auth.client import SejongClient
from sejong_auth.models import GradeReport

pytestmark = pytest.mark.skipif(
    not os.environ.get("SEJONG_USERNAME"),
    reason="Set SEJONG_USERNAME and SEJONG_PASSWORD to run integration tests",
)


async def test_real_login_and_grades():
    """Integration test against the real Sejong portal."""
    username = os.environ["SEJONG_USERNAME"]
    password = os.environ["SEJONG_PASSWORD"]

    async with SejongClient() as client:
        await client.login(username, password)
        assert client._logged_in is True

        report = await client.get_grades()
        assert isinstance(report, GradeReport)
        assert report.student_id == username
        assert len(report.grades) > 0
        print(f"\n  Student: {report.student_name}")
        print(f"  Major: {report.major}")
        print(f"  GPA: {report.total_gpa}")
        print(f"  Grades: {len(report.grades)} courses")
```

- [ ] **Step 2: Run integration test**

Run: `SEJONG_USERNAME=20241234 SEJONG_PASSWORD='YourPassword123!' pytest tests/test_integration.py -v -s`

Expected: PASS (if portal is accessible) — this will likely require adjusting the JSON response keys in `_build_grade_report` based on the actual response structure.

- [ ] **Step 3: Fix JSON key mapping based on real response**

Adjust `client.py:_build_grade_report()` to match the actual portal JSON keys. This is expected — the mock keys are placeholders.

- [ ] **Step 4: Re-run all tests**

Run: `pytest tests/ -v`
Expected: All passed

- [ ] **Step 5: Commit**

```bash
git add tests/test_integration.py src/sejong_auth/client.py
git commit -m "feat: add integration test, fix JSON key mapping"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pytest tests/ -v --tb=short`
Expected: All unit tests pass (integration test skipped without env vars)

- [ ] **Step 2: Test the FastAPI server manually**

Run: `uvicorn sejong_auth.api.app:app --reload`

In another terminal:
```bash
curl -X POST http://localhost:8000/api/v1/grades \
  -H "Content-Type: application/json" \
  -d '{"username": "20241234", "password": "YourPassword123!"}'
```

Expected: JSON response with grade data

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final adjustments"
```
