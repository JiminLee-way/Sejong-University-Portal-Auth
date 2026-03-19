# Data Model: Sejong Portal Auth

## Enums

### Semester
| Value | Label |
|-------|-------|
| `FIRST` | 1학기 |
| `SECOND` | 2학기 |
| `SUMMER` | 여름학기 |
| `WINTER` | 겨울학기 |

**Mapping from portal**: SMT_CD `10`→FIRST, `20`→SECOND, `11`→SUMMER, `21`→WINTER

## Entities

### Grade
개별 과목 성적.

| Field | Type | Description |
|-------|------|-------------|
| year | number | 수강년도 |
| semester | Semester | 학기 |
| courseCode | string | 학수번호 (CURI_NO) |
| section | string | 분반 (CLASS) |
| courseName | string | 교과목명 (CURI_NM) |
| courseType | string | 이수구분 (CURI_TYPE_CD_NM) |
| graduationCourseType | string | 졸업심사용 이수구분 (SUH_CURI_TYPE_CD_NM) |
| credit | number | 학점 (CDT) |
| grade | string | 등급 (GRADE) — A+, B0, P, F 등 |
| gradePoint | number | 평점 (MRKS) — 0.0~4.5 |
| evaluationType | string | 평가방식 (GRADE_TYPE_CD_NM) — GRADE, P/NP |
| retake | boolean | 재수강 여부 (RE_YEAR 존재 시 true) |
| electiveArea | string? | 선택영역 (SLT_DOMAIN_CD_NM) |
| teachingArea | string? | 교직영역 (DOMAIN_CD_NM) |

### CreditSummary
취득학점 분류별 합계.

| Field | Type | Portal Key |
|-------|------|------------|
| liberalRequired | number | CUL_CDT |
| majorRequired | number | MAJ_CDT |
| majorElective | number | MAJ_SEL |
| majorBasic | number | MAJ_BAS |
| majorTotal | number | MAJ_TOT |

### GradeReport
전체 성적 보고서.

| Field | Type | Source |
|-------|------|--------|
| studentId | string | login username |
| studentName | string | Student API → NM |
| major | string | Student API → DEPT_ALIAS |
| yearLevel | number | Student API → STUDENT_YEAR |
| grades | Grade[] | Grade API → dl_main |
| creditSummary | CreditSummary | Grade API → dl_summary[0] |
| totalGpa | number | dl_summary → AVG_MRKS |
| totalEarnedCredits | number | dl_summary → APP_CDT |
| totalAttemptedCredits | number | dl_summary → REQ_CDT |
| liberalGpa | number | dl_summary → CUL_AVG_MRKS |
| majorGpa | number | dl_summary → MAJ_AVG_MRKS |
| percentile | number | dl_summary → TOT_MRKS |

### Enrollment
개별 수강 과목.

| Field | Type | Portal Key |
|-------|------|------------|
| year | number | YEAR |
| semester | Semester | SMT_CD |
| courseCode | string | CURI_NO |
| section | string | CLASS |
| courseName | string | CURI_NM |
| courseType | string | CURI_TYPE_CD_NM |
| credit | number | CDT |
| professor | string? | EMP_NM |
| timeLocation | string? | CORS_SCHE_TIME |

### EnrollmentReport
학기별 수강내역.

| Field | Type |
|-------|------|
| studentId | string |
| year | number |
| semester | Semester |
| enrollments | Enrollment[] |
| totalCredits | number |

### Scholarship
개별 장학금.

| Field | Type | Portal Key |
|-------|------|------------|
| year | number | YEAR |
| semester | Semester | SMT_CD |
| scholarshipName | string | SCHO_CD_NM |
| amount | number | TOT_SCHO_AMT |

### ScholarshipReport
장학금 이력.

| Field | Type |
|-------|------|
| studentId | string |
| scholarships | Scholarship[] |
| totalAmount | number |

## Error Types

| Error Class | HTTP Status | When |
|-------------|-------------|------|
| LoginFailedError | 401 | 잘못된 credentials 또는 계정 잠금 |
| SessionExpiredError | — | login() 미호출 상태에서 데이터 조회 |
| NetworkError | 502 | 연결 실패, 타임아웃 |
| PortalError | 502 | 포털 비정상 응답, 점검 중 |
| ParseError | 500 | JSON 응답 구조 변경 |
