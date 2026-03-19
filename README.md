# Sejong University Portal Auth

세종대학교 포털 SSO 인증 및 기이수 성적 조회를 위한 Python 라이브러리 + REST API 서버

## Features

- **SSO 로그인** — 세종대 포털(`portal.sejong.ac.kr`) 통합 인증
- **성적 조회** — 기이수 성적, 학점 현황, GPA 등 전체 성적 데이터 조회
- **Pure HTTP** — 브라우저 의존성 없음 (Playwright/Selenium 불필요)
- **Async** — `httpx` 기반 비동기 처리
- **이중 인터페이스** — Python 라이브러리 또는 REST API로 사용 가능
- **Credential Provider** — 환경변수, 직접 전달, 또는 커스텀 저장소(Android Keystore 등) 지원

## Quick Start

### 설치

```bash
pip install -e .
```

### 라이브러리로 사용

```python
import asyncio
from sejong_auth import SejongClient

async def main():
    async with SejongClient() as client:
        await client.login("학번", "비밀번호")
        report = await client.get_grades()

        print(f"이름: {report.student_name}")
        print(f"학과: {report.major}")
        print(f"평점평균: {report.total_gpa}")
        print(f"취득학점: {report.total_earned_credits}")

        for grade in report.grades:
            print(f"  {grade.year} {grade.semester.value} | {grade.course_name} | {grade.grade} ({grade.grade_point})")

asyncio.run(main())
```

### REST API로 사용

```bash
# 서버 실행
uvicorn sejong_auth.api.app:app --host 0.0.0.0 --port 8000

# 성적 조회
curl -X POST http://localhost:8000/api/v1/grades \
  -H "Content-Type: application/json" \
  -d '{"username": "학번", "password": "비밀번호"}'
```

### CredentialProvider 사용

```python
from sejong_auth import SejongClient, EnvCredentialProvider

# 환경변수에서 자동으로 로드 (SEJONG_USERNAME, SEJONG_PASSWORD)
async with SejongClient(credential_provider=EnvCredentialProvider()) as client:
    await client.login()  # 인자 없이 호출
    report = await client.get_grades()
```

커스텀 Provider를 구현하면 Android Keystore, macOS Keychain 등 원하는 저장소에서 credentials를 불러올 수 있습니다:

```python
from sejong_auth import CredentialProvider

class MyKeystoreProvider(CredentialProvider):
    async def get_credentials(self) -> tuple[str, str]:
        username = await my_keystore.get("sejong_id")
        password = await my_keystore.get("sejong_pw")
        return username, password
```

## API Reference

### `SejongClient`

| Method | Description |
|--------|-------------|
| `login(username?, password?)` | SSO 로그인. credentials 직접 전달 또는 CredentialProvider 사용 |
| `get_grades()` | 기이수 성적 조회. `login()` 호출 필수 |
| `close()` | 세션 정리 |

`async with` 구문 지원 — `close()` 자동 호출.

### REST API

```
POST /api/v1/grades
```

**Request:**
```json
{
  "username": "학번",
  "password": "비밀번호"
}
```

**Response (200):**
```json
{
  "student_id": "20241234",
  "student_name": "홍길동",
  "major": "컴퓨터공학과",
  "year_level": 2,
  "total_gpa": 3.85,
  "total_earned_credits": 120.0,
  "total_attempted_credits": 126.0,
  "graduation_credits": 120.0,
  "liberal_gpa": 3.90,
  "major_gpa": 3.80,
  "percentile": 90.5,
  "credit_summary": {
    "liberal_required": 15,
    "liberal_total": 45,
    "major_required": 30,
    "major_elective": 15,
    "major_basic": 12,
    "major_total": 57
  },
  "grades": [
    {
      "year": 2024,
      "semester": "1학기",
      "course_code": "001357",
      "section": "008",
      "course_name": "미적분학1",
      "course_type": "기필",
      "graduation_course_type": "기필",
      "credit": 3.0,
      "grade": "A+",
      "grade_point": 4.5,
      "evaluation_type": "GRADE",
      "retake": false,
      "elective_area": null,
      "teaching_area": null
    }
  ]
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| `401` | 로그인 실패 (잘못된 학번 또는 비밀번호) |
| `500` | 파싱 실패 (포털 API 구조 변경) |
| `502` | 포털 접근 불가 (점검 중, 네트워크 오류) |

## Data Models

### Grade (개별 과목 성적)

| Field | Type | Description |
|-------|------|-------------|
| `year` | `int` | 수강년도 |
| `semester` | `Semester` | 학기 (1학기, 2학기, 여름학기, 겨울학기) |
| `course_code` | `str` | 학수번호 |
| `section` | `str` | 분반 |
| `course_name` | `str` | 교과목명 |
| `course_type` | `str` | 이수구분 (전기, 전선, 교선, 공필, 기필 등) |
| `graduation_course_type` | `str` | 졸업심사용 이수구분 |
| `credit` | `float` | 학점 |
| `grade` | `str` | 등급 (A+, A0, B+, B0, C+, C0, D+, D0, F, P) |
| `grade_point` | `float` | 평점 (4.5 ~ 0.0) |
| `evaluation_type` | `str` | 평가방식 (GRADE, P/NP) |
| `retake` | `bool` | 재수강 여부 |
| `elective_area` | `str?` | 선택영역 |
| `teaching_area` | `str?` | 교직영역 |

### GradeReport (전체 성적 보고서)

| Field | Type | Description |
|-------|------|-------------|
| `student_id` | `str` | 학번 |
| `student_name` | `str` | 성명 |
| `major` | `str` | 학과 |
| `year_level` | `int` | 학년 |
| `grades` | `list[Grade]` | 전체 성적 목록 |
| `credit_summary` | `CreditSummary` | 취득학점 분류별 합계 |
| `total_gpa` | `float` | 전체 평점평균 |
| `total_earned_credits` | `float` | 총 취득학점 |
| `total_attempted_credits` | `float` | 총 신청학점 |
| `graduation_credits` | `float` | 졸업인정학점 |
| `liberal_gpa` | `float` | 교양 평점평균 |
| `major_gpa` | `float` | 전공 평점평균 |
| `percentile` | `float` | 백분위 |

## Exception Handling

```python
from sejong_auth import (
    SejongAuthError,     # 모든 예외의 베이스
    LoginFailedError,    # 잘못된 credentials
    SessionExpiredError, # 세션 만료 또는 login() 미호출
    NetworkError,        # 연결 실패, 타임아웃
    PortalError,         # 포털 응답 이상
    ParseError,          # JSON 응답 구조 변경
)

async with SejongClient() as client:
    try:
        await client.login("학번", "비밀번호")
        report = await client.get_grades()
    except LoginFailedError:
        print("아이디 또는 비밀번호가 올바르지 않습니다")
    except NetworkError:
        print("포털에 연결할 수 없습니다")
    except PortalError:
        print("포털이 점검 중이거나 응답이 비정상입니다")
    except ParseError:
        print("포털 응답 구조가 변경되었습니다")
```

## Project Structure

```
sejong_portal_auth/
├── src/
│   └── sejong_auth/
│       ├── __init__.py        # Public API
│       ├── client.py          # SejongClient (SSO + grade fetching)
│       ├── models.py          # Pydantic data models
│       ├── exceptions.py      # Exception hierarchy
│       ├── credential.py      # CredentialProvider pattern
│       └── api/
│           ├── app.py         # FastAPI application
│           ├── routes.py      # API endpoints
│           └── schemas.py     # Request/Response schemas
├── tests/
├── docs/
├── pyproject.toml
└── .env.example
```

## How It Works

1. **SSO Login** — `portal.sejong.ac.kr`에 form POST로 로그인하여 세션 쿠키 획득
2. **Portal Access** — `sjpt.sejong.ac.kr`에 SSO 쿠키로 접속하여 포털 세션 설정
3. **JSON API** — 포털 내부 WebSquare JSON API로 성적 데이터 조회
4. **Data Mapping** — JSON 응답을 Pydantic 모델로 변환하여 반환

> 브라우저 없이 순수 HTTP 요청만 사용하므로 서버 환경에서 안정적으로 동작합니다.

## Tech Stack

- **Python 3.11+**
- **httpx** — Async HTTP client
- **FastAPI** — REST API framework
- **Pydantic** — Data validation & serialization
- **pytest** — Testing

## Development

```bash
# 의존성 설치
pip install -e ".[dev]"

# 테스트 실행
pytest tests/ -v

# 통합 테스트 (실제 포털 접속)
SEJONG_USERNAME=학번 SEJONG_PASSWORD=비밀번호 pytest tests/test_integration.py -v -s

# API 서버 실행
uvicorn sejong_auth.api.app:app --reload
```

## License

MIT
