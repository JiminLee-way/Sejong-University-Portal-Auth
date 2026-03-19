# REST API Contract: Extended Features

Base URL: `http://localhost:3000/api/v1`

기존 엔드포인트(grades, enrollments, scholarships, library/*, student-card)에 추가.

## POST /timetable

시간표 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호", "year": "2026", "semesterCode": "10" }
```
`year`, `semesterCode`는 optional. 미지정 시 현재 학기.

**Response 200**: `TimetableReport` JSON
**Response 401**: `{ "error": "아이디 또는 비밀번호가 올바르지 않습니다" }`

## POST /tuition

등록금 납부내역 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `TuitionReport` JSON

## POST /graduation

졸업요건 충족도 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `GraduationReport` JSON

## POST /library/loans

도서 대출내역 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `BookLoanReport` JSON

## POST /library/reserve

좌석 예약.

**Request**:
```json
{ "username": "학번", "password": "비밀번호", "roomNo": 13, "seatNo": 42 }
```

**Response 200**: `SeatActionResult` JSON
**Response 400**: `{ "error": "roomNo and seatNo required" }`

## POST /library/extend

좌석 연장.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `SeatActionResult` JSON

## POST /library/return

좌석 반납.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `SeatActionResult` JSON

## POST /academic-calendar

학사일정 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호", "year": "2026", "semesterCode": "10" }
```
`year`, `semesterCode`는 optional.

**Response 200**: `AcademicCalendar` JSON

## POST /notices

공지사항 목록 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호", "category": "학사", "page": 1 }
```
`category`, `page`는 optional.

**Response 200**: `NoticeList` JSON

## POST /notices/detail

공지사항 상세 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호", "noticeId": "12345" }
```

**Response 200**: `NoticeDetail` JSON
**Response 400**: `{ "error": "noticeId required" }`

## Common Error Responses

모든 엔드포인트 공통:
- **401**: 로그인 실패
- **502**: 포털/도서관 접속 불가
- **500**: 응답 파싱 실패
