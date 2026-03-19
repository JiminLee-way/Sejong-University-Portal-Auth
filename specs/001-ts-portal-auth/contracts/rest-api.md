# REST API Contract

Base URL: `http://localhost:3000/api/v1`

## POST /grades

성적 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `GradeReport` JSON
**Response 401**: `{ "error": "아이디 또는 비밀번호가 올바르지 않습니다" }`
**Response 502**: `{ "error": "포털 접속 불가" }`
**Response 500**: `{ "error": "응답 파싱 실패" }`

## POST /enrollments

수강내역 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호", "year": "2026", "semesterCode": "10" }
```
`year`, `semesterCode`는 optional. 미지정 시 최신 학기.

**Response 200**: `EnrollmentReport` JSON

## POST /scholarships

장학이력 조회.

**Request**:
```json
{ "username": "학번", "password": "비밀번호" }
```

**Response 200**: `ScholarshipReport` JSON
