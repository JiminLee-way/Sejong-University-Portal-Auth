# Data Model: 세종대 포털 추가 기능

기존 모델(Grade, Enrollment, Scholarship 등)에 추가되는 엔티티.

## Enums

### Day (시간표 요일)
| Value | Label | Code |
|-------|-------|------|
| `MON` | 월 | 1 |
| `TUE` | 화 | 2 |
| `WED` | 수 | 3 |
| `THU` | 목 | 4 |
| `FRI` | 금 | 5 |
| `SAT` | 토 | 6 |

### TuitionStatus (등록금 납부상태)
| Value | Label |
|-------|-------|
| `PAID` | 납부완료 |
| `UNPAID` | 미납 |
| `PARTIAL` | 분납 중 |

## Entities

### TimetableSlot
시간표 개별 시간 슬롯. 수강내역의 `CORS_SCHE_TIME` 파싱 결과.

| Field | Type | Source |
|-------|------|--------|
| courseName | string | Enrollment → CURI_NM |
| courseCode | string | Enrollment → CURI_NO |
| professor | string? | Enrollment → EMP_NM |
| day | Day | CORS_SCHE_TIME 파싱 |
| periods | number[] | CORS_SCHE_TIME 파싱 (1-교시 배열) |
| location | string? | CORS_SCHE_TIME 파싱 (장소) |

### TimetableReport
학기별 시간표 보고서.

| Field | Type | Description |
|-------|------|-------------|
| studentId | string | 학번 |
| year | number | 년도 |
| semester | Semester | 학기 |
| slots | TimetableSlot[] | 플랫 리스트 (기본) |

**유틸리티 함수**: `toGrid(slots)` → `Map<Day, Map<number, TimetableSlot>>` (요일×교시 그리드)

### TuitionRecord
학기별 등록금 납부 내역.

| Field | Type | Portal Key (추정) |
|-------|------|-------------------|
| year | number | YEAR |
| semester | Semester | SMT_CD |
| totalAmount | number | 등록금 총액 |
| scholarshipAmount | number | 장학금 감면액 |
| paidAmount | number | 실납부액 |
| status | TuitionStatus | 납부 상태 |

### TuitionReport
등록금 납부 이력 전체.

| Field | Type |
|-------|------|
| studentId | string |
| records | TuitionRecord[] |
| totalPaid | number |

### GraduationRequirement
졸업 요건 영역별 현황.

| Field | Type | Portal Key (추정) |
|-------|------|-------------------|
| category | string | 요건 영역명 (교양필수, 전공필수 등) |
| requiredCredits | number | 필요학점 |
| earnedCredits | number | 이수학점 |
| shortageCredits | number | 부족학점 |
| fulfilled | boolean | 충족여부 |

### GraduationReport
졸업요건 충족도 전체.

| Field | Type |
|-------|------|
| studentId | string |
| requirements | GraduationRequirement[] |
| totalRequired | number |
| totalEarned | number |
| totalShortage | number |
| graduationStatus | string |

### BookLoan
도서 대출 내역.

| Field | Type | Description |
|-------|------|-------------|
| bookTitle | string | 도서명 |
| loanDate | string | 대출일 (YYYY-MM-DD) |
| dueDate | string | 반납예정일 (YYYY-MM-DD) |
| isOverdue | boolean | 연체 여부 |
| overdueDays | number | 연체일수 (0이면 정상) |

### BookLoanReport
도서 대출 현황 전체.

| Field | Type |
|-------|------|
| studentId | string |
| loans | BookLoan[] |
| totalLoans | number |
| overdueCount | number |

### SeatActionResult
좌석 예약/연장/반납 결과.

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | 성공 여부 |
| action | string | "reserve" \| "extend" \| "return" |
| roomName | string? | 열람실명 |
| seatNumber | number? | 좌석번호 |
| message | string | 결과 메시지 |

### AcademicEvent
학사일정 항목.

| Field | Type | Portal Key (추정) |
|-------|------|-------------------|
| eventName | string | 일정명 |
| startDate | string | 시작일 (YYYY-MM-DD) |
| endDate | string | 종료일 (YYYY-MM-DD) |
| category | string? | 카테고리 |

### AcademicCalendar
학사일정 전체.

| Field | Type |
|-------|------|
| year | number |
| semester | Semester |
| events | AcademicEvent[] |

### Notice
공지사항 항목.

| Field | Type | Portal Key (추정) |
|-------|------|-------------------|
| noticeId | string | 공지 ID |
| title | string | 제목 |
| date | string | 작성일 (YYYY-MM-DD) |
| category | string? | 카테고리 |
| author | string? | 작성자 |

### NoticeDetail
공지사항 상세 (본문 포함).

| Field | Type |
|-------|------|
| noticeId | string |
| title | string |
| date | string |
| category | string? |
| author | string? |
| content | string |

### NoticeList
공지사항 목록 응답.

| Field | Type |
|-------|------|
| notices | Notice[] |
| totalCount | number |
| currentPage | number |

## Error Types (추가)

기존 에러 타입(LoginFailedError, NetworkError, PortalError, ParseError)을 재사용.

좌석 액션 실패 시 PortalError에 구체적 메시지 포함:
- "이미 좌석이 배정되어 있습니다"
- "연장 횟수 제한에 도달했습니다"
- "해당 좌석은 사용 중입니다"
