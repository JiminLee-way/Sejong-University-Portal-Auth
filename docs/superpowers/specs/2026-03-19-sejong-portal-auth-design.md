# Sejong Portal Auth — Design Spec

## Overview

세종대학교 포털(sjpt.sejong.ac.kr) SSO 로그인 인증 및 기 이수 성적 조회 시스템.

**두 가지 형태로 제공:**
- **Python 라이브러리** — `pip install`해서 다른 프로젝트에서 import
- **REST API 서버** — FastAPI 기반, 외부 앱/서비스에서 호출

## Tech Stack

- **Python 3.11+**
- **httpx** — async HTTP client (SSO 로그인 + JSON API 호출)
- **FastAPI** — REST API 서버
- **Pydantic** — 데이터 모델 + API 스키마 검증

> BeautifulSoup 불필요 — 포털 내부 API가 JSON을 반환하므로 HTML 파싱 없음.

## Project Structure

```
sejong_portal_auth/
├── src/
│   └── sejong_auth/
│       ├── __init__.py          # 라이브러리 공개 API
│       ├── client.py            # SejongClient — 핵심 로직 (로그인 + 성적 조회)
│       ├── models.py            # Pydantic 모델 (Grade, Semester, GradeReport 등)
│       ├── exceptions.py        # 커스텀 예외
│       ├── credential.py        # CredentialProvider 추상 클래스 + 구현체
│       └── api/
│           ├── __init__.py
│           ├── app.py           # FastAPI app
│           ├── routes.py        # API 엔드포인트
│           └── schemas.py       # API request/response 스키마
├── tests/
├── pyproject.toml
└── .env.example
```

> `parser.py` 삭제 — JSON 응답이므로 별도 파싱 모듈 불필요.

## Verified SSO Login Flow

실제 브라우저 분석으로 확인된 로그인 프로세스:

### Step 1: SSO 로그인 (portal.sejong.ac.kr)

```
POST https://portal.sejong.ac.kr/jsp/login/login_action.jsp
Content-Type: application/x-www-form-urlencoded

id=20241234&password=***&mainLogin=Y&rtUrl=sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=
```

**응답:** 302 리다이렉트 체인 → 세션 쿠키 설정

### Step 2: sjpt 포털 접속

```
GET https://sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=
Cookie: WMONID=...; ssotoken=...; PO1_JSESSIONID=...; ROT_ROUTEID=...
```

이 요청으로 sjpt 포털에 SSO 인증이 완료되며, 이후 API 호출에 필요한 세션 쿠키가 설정됨.

### Step 3: 세션 정보 획득

```
POST https://sjpt.sejong.ac.kr/main/sys/UserInfo/initUserInfo.do
```

응답에서 `_runIntgUsrNo` (학번), `_runPgLoginDt` (로그인 일시), `_runningSejong` (세션 UUID) 획득.

### 핵심 쿠키
- `ssotoken` — SSO 인증 토큰
- `PO1_JSESSIONID` — sjpt 포털 세션 ID
- `ROT_ROUTEID` — 로드밸런서 라우팅

## Verified Grade API (JSON)

포털 내부 API는 **JSON** 프로토콜을 사용 (WebSquare 5 framework).

### 공통 헤더

```
Content-Type: application/json; charset="UTF-8"
Accept: application/json
```

### 공통 쿼리 파라미터

모든 API 호출에 `addParam` 쿼리 파라미터 포함:
```
addParam = base64(urlencode(JSON))
```

JSON 구조:
```json
{
  "_runPgmKey": "SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ",
  "_runSysKey": "SCH",
  "_runIntgUsrNo": "20241234",
  "_runPgLoginDt": "20260319130540",
  "_runningSejong": "c8fe4cfc-964a-4eb2-ae12-2e7f6162fda2"
}
```

### API 1: 학생 기본정보

```
POST https://sjpt.sejong.ac.kr/sch/sch/sys/SchStudentBaseInfo/doStudent.do?addParam=...
```

Request body:
```json
{
  "dm_reqKey": {
    "keyOrgnClsfCd": "20",
    "keyStudentNo": "20241234",
    "keyStudentImagPath": "",
    "keyYear": "",
    "keySmtCd": ""
  }
}
```

Response: 학번, 성명, 학과, 학년, 입학일자 등

### API 2: 년도/학기 목록

```
POST https://sjpt.sejong.ac.kr/sch/sch/sug/SugRecordQ/doYearsmt.do?addParam=...
```

Request body:
```json
{
  "dm_search": {
    "RECORD_YN": "Y",
    "YEAR_SMT": "",
    "ORGN_CLSF_CD": "20",
    "STUDENT_NO": "20241234"
  }
}
```

### API 3: 성적 목록 (핵심)

```
POST https://sjpt.sejong.ac.kr/sch/sch/sug/SugRecordQ/doList.do?addParam=...
```

Request body:
```json
{
  "dm_search": {
    "ORGN_CLSF_CD": "20",
    "YEAR": "",
    "SMT_CD": "",
    "RECORD_YN": "Y",
    "STUDENT_NO": "20241234",
    "STUDENT_NM": "",
    "YEAR_SMT": ""
  }
}
```

Response: 과목별 성적 목록 (년도, 학기, 학수번호, 분반, 교과목명, 이수구분, 학점, 등급, 평점, 재수강 여부 등)

### 확인된 성적 데이터 컬럼

순번, 년도, 학기, 학수번호, 분반, 교과목명, 이수구분, 졸업심사용 이수구분, 교직영역, 선택영역, 학점, 평가방식, 등급, 평점, 재수강, 선수과목, 인정구분, 이수처명, 비인정(성적)과목, 졸업학점 제외유형

### 확인된 집계 정보

- 취득학점 분류: 교양필수/중핵필수, 교양합계, 전공필수, 전공선택, 전공기초, 전공합계, 부전공, 복수전공, 교직, 기타, 편입생인정
- 집계정보: 신청학점, 취득학점, 졸업인정학점, 평점합계, 평점평균, 백분위
- 교양평점평균, 전공평점평균, 학사경고연속횟수

## Core Component: SejongClient

```python
class SejongClient:
    """세종대 포털 인증 + 데이터 조회 클라이언트"""

    def __init__(self, credential_provider: CredentialProvider | None = None):
        self._http = httpx.AsyncClient(follow_redirects=True)
        self._credential_provider = credential_provider

    async def login(self, username: str | None = None, password: str | None = None) -> None:
        """로그인. 실패 시 LoginFailedError 발생.

        Credential 우선순위:
        1. username과 password 둘 다 전달 시 해당 값 사용
        2. 하나만 전달된 경우 ValueError 발생 (부분 override 불허)
        3. 둘 다 None이면 credential_provider에서 가져옴
        4. provider도 None이면 ValueError 발생

        내부 동작:
        1. POST portal.sejong.ac.kr/jsp/login/login_action.jsp (form login)
        2. GET sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p= (SSO redirect)
        3. POST initUserInfo.do → _runningSejong, _runPgLoginDt 획득
        """

    async def get_grades(self) -> GradeReport:
        """전체 이수 성적 조회. login() 호출 전이면 SessionExpiredError 발생.

        내부 동작:
        1. POST SchStudentBaseInfo/doStudent.do → 학생 기본정보
        2. POST SugRecordQ/doList.do → 성적 목록 (JSON)
        3. JSON 응답을 GradeReport 모델로 변환
        """

    async def close(self):
        """세션 정리"""

    async def __aenter__(self): ...
    async def __aexit__(self, *args): ...
```

### Usage (Library)

```python
async with SejongClient() as client:
    await client.login("학번", "비밀번호")
    report = await client.get_grades()
    print(report.total_gpa)
```

### CredentialProvider Pattern

```python
class CredentialProvider(ABC):
    @abstractmethod
    async def get_credentials(self) -> tuple[str, str]: ...

# 기본 제공
class EnvCredentialProvider(CredentialProvider):    # 환경변수에서 로드
class StaticCredentialProvider(CredentialProvider): # 직접 전달

# 사용자 확장 예시
class AndroidKeystoreProvider(CredentialProvider): ...
class MacOSKeychainProvider(CredentialProvider): ...
```

## Data Models

```python
class Semester(str, Enum):
    FIRST = "1학기"
    SECOND = "2학기"
    SUMMER = "여름학기"
    WINTER = "겨울학기"

class Grade(BaseModel):
    year: int                    # 수강년도
    semester: Semester            # 학기
    course_code: str             # 학수번호
    section: str                 # 분반
    course_name: str             # 교과목명
    course_type: str             # 이수구분 (전기, 전선, 교선, 공필, 기필 등)
    graduation_course_type: str  # 졸업심사용 이수구분
    credit: float                # 학점
    grade: str                   # 등급 (A+, B0, P 등)
    grade_point: float           # 평점 (4.5, 3.0 등)
    evaluation_type: str         # 평가방식 (GRADE, P/NP)
    retake: bool                 # 재수강 여부
    elective_area: str | None    # 선택영역
    teaching_area: str | None    # 교직영역

class CreditSummary(BaseModel):
    """취득학점 분류별 합계"""
    liberal_required: float      # 교양필수/중핵필수
    liberal_total: float         # 교양합계
    major_required: float        # 전공필수
    major_elective: float        # 전공선택
    major_basic: float           # 전공기초
    major_total: float           # 전공합계

class GradeReport(BaseModel):
    student_id: str              # 학번
    student_name: str            # 성명
    major: str                   # 학과
    year_level: int              # 학년
    grades: list[Grade]          # 전체 성적 목록
    credit_summary: CreditSummary  # 취득학점 분류
    total_gpa: float             # 평점평균
    total_earned_credits: float  # 취득학점
    total_attempted_credits: float  # 신청학점
    graduation_credits: float    # 졸업인정학점
    liberal_gpa: float           # 교양평점평균
    major_gpa: float             # 전공평점평균
    percentile: float            # 백분위
```

> SemesterSummary 삭제 — 포털 API가 학기별 요약을 별도 제공하지 않음. 집계정보는 전체 기준으로만 제공됨.

## API Design

### Endpoint

```
POST /api/v1/grades
```

Stateless — 로그인 → 성적 조회 → 세션 폐기를 한 요청에서 처리.
API route는 요청마다 `async with SejongClient() as client:` 로 새 인스턴스를 생성하여 cleanup을 보장한다.

### Request

```json
{
  "username": "학번",
  "password": "비밀번호"
}
```

### Response (200)

GradeReport 모델을 JSON으로 직렬화.

### Error Responses

- `401` — 로그인 실패 (잘못된 credentials)
- `502` — 포털 접근 불가 (점검 중, 연결 실패, 타임아웃)
- `500` — 응답 파싱 실패 (포털 API 변경)

## Error Handling

```python
class SejongAuthError(Exception): ...        # 베이스
class LoginFailedError(SejongAuthError): ...  # 잘못된 credentials
class SessionExpiredError(SejongAuthError): ... # 세션 만료 또는 login() 미호출
class NetworkError(SejongAuthError): ...     # 연결 실패, 타임아웃 등 transport 레벨
class PortalError(SejongAuthError): ...       # 포털 응답 이상/점검 중 (HTTP 레벨)
class ParseError(SejongAuthError): ...        # JSON 응답 구조 변경됨
```

## Constraints & Assumptions

- HTTPS 전제 — credentials가 request body에 포함되므로 TLS 필수
- Pure HTTP 방식 — Playwright/브라우저 의존성 없음, 백엔드 서버에서 안전하게 사용 가능
- 포털 내부 API가 JSON을 반환하므로 BeautifulSoup 불필요
- Rate limiting 없이 시작, 필요 시 추가
- 포털 JSON API 구조 변경 시 client.py의 요청/응답 처리만 수정하면 됨
