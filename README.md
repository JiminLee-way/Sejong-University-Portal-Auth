# Sejong University Portal Auth

세종대학교 포털 인증 및 학사 데이터 조회 TypeScript 라이브러리 + REST API 서버

> 모바일 앱(`sjapp.sejong.ac.kr`)과 동일한 JWT 인증 방식을 사용하여 브라우저 세션과 충돌하지 않습니다.

## Features

- **JWT 인증** — 세종대 모바일 앱과 동일한 인증 (`sjapp.sejong.ac.kr`)
- **기이수 성적 조회** — 전체 성적, GPA, 학점 현황
- **수강내역 조회** — 학기별 수강 과목 목록
- **장학이력 조회** — 장학금 수혜 이력 및 금액
- **시간표 조회** — 요일/교시별 시간표 + 그리드 변환 유틸리티
- **등록금 납부내역** — 학기별 등록금 고지/납부 상태
- **도서관 좌석 현황** — 열람실별 실시간 좌석 현황
- **도서관 좌석 배치도** — 개별 열람실 좌석 상태
- **좌석 예약/연장/반납** — 도서관 좌석 액션
- **나의 좌석 조회** — 현재 배정된 좌석 확인
- **시설 예약 현황** — 스터디룸, 시네마룸, S-Lounge
- **모바일 학생증** — 학생증 카드번호 조회
- **공지사항** — 세종대 공지사항 10개 카테고리 목록 + 상세
- **Pure HTTP** — 브라우저 의존성 없음 (Playwright/Selenium 불필요)
- **이중 인터페이스** — npm 라이브러리 또는 REST API로 사용 가능

## Quick Start

### 설치

```bash
npm install sejong-auth
```

### 라이브러리로 사용

```typescript
import { SejongClient } from "sejong-auth";

const client = new SejongClient();
await client.login("학번", "비밀번호");

// 성적 조회
const grades = await client.getGrades();
console.log(`GPA: ${grades.totalGpa}, ${grades.grades.length}과목`);

// 수강내역 조회
const enrollments = await client.getEnrollments();
console.log(`${enrollments.enrollments.length}과목, ${enrollments.totalCredits}학점`);

// 장학이력 조회
const scholarships = await client.getScholarships();
console.log(`장학금 총액: ${scholarships.totalAmount.toLocaleString()}원`);

// 시간표 조회
import { toTimetableGrid, Day } from "sejong-auth";
const timetable = await client.getTimetable();
const grid = toTimetableGrid(timetable.slots);
const mondayFirst = grid.get(Day.MON)?.get(1);

// 등록금 조회
const tuition = await client.getTuition();
console.log(`총 납부: ${tuition.totalPaid.toLocaleString()}원`);

// 도서관 좌석 현황
const rooms = await client.getLibraryRooms();
for (const room of rooms) {
  console.log(`${room.name}: ${room.usedSeats}/${room.totalSeats} (${room.occupancyRate}%)`);
}

// 공지사항
const notices = await client.getNotices({ category: "학사공지" });
const detail = await client.getNoticeDetail(notices.notices[0].noticeId, "학사공지");
```

### REST API로 사용

```bash
# 서버 실행
npx sejong-auth-server
# 또는
npm run dev

# 성적 조회
curl -X POST http://localhost:3000/api/v1/grades \
  -H "Content-Type: application/json" \
  -d '{"username": "학번", "password": "비밀번호"}'
```

---

## API Reference

### SejongClient Methods

| Method | Description |
|--------|-------------|
| `login(username, password)` | JWT 인증 로그인 |
| `getGrades()` | 기이수 성적 조회 |
| `getEnrollments(year?, semesterCode?)` | 수강내역 조회 |
| `getScholarships()` | 장학이력 조회 |
| `getTimetable(year?, semesterCode?)` | 시간표 조회 |
| `getTuition()` | 등록금 납부내역 조회 |
| `getGraduationRequirements()` | 졸업요건 충족도 조회 |
| `getAcademicCalendar(year?, semesterCode?)` | 학사일정 조회 |
| `getLibraryRooms()` | 열람실 좌석 현황 |
| `getMySeat()` | 나의 좌석 조회 |
| `getSeatMap(roomNo)` | 좌석 배치도 (roomNo: 11-18) |
| `getFacilityRooms(type)` | 시설 예약 현황 |
| `reserveSeat(roomNo, seatNo)` | 좌석 예약 |
| `extendSeat()` | 좌석 연장 |
| `returnSeat()` | 좌석 반납 |
| `getStudentCard()` | 학생증 카드번호 |
| `getNotices(options?)` | 공지사항 목록 |
| `getNoticeDetail(noticeId, category?)` | 공지사항 상세 |

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/grades` | 기이수 성적 |
| POST | `/api/v1/enrollments` | 수강내역 |
| POST | `/api/v1/scholarships` | 장학이력 |
| POST | `/api/v1/timetable` | 시간표 |
| POST | `/api/v1/tuition` | 등록금 납부내역 |
| POST | `/api/v1/graduation` | 졸업요건 |
| POST | `/api/v1/academic-calendar` | 학사일정 |
| POST | `/api/v1/all` | 성적+수강+장학+시간표 일괄 |
| POST | `/api/v1/library/rooms` | 열람실 좌석 현황 |
| POST | `/api/v1/library/my-seat` | 나의 좌석 |
| POST | `/api/v1/library/seat-map` | 좌석 배치도 |
| POST | `/api/v1/library/facilities` | 시설 예약 현황 |
| POST | `/api/v1/library/reserve` | 좌석 예약 |
| POST | `/api/v1/library/extend` | 좌석 연장 |
| POST | `/api/v1/library/return` | 좌석 반납 |
| POST | `/api/v1/student-card` | 학생증 카드번호 |
| POST | `/api/v1/notices` | 공지사항 목록 |
| POST | `/api/v1/notices/detail` | 공지사항 상세 |

---

## Response Examples

> 모든 예시의 개인정보는 가명(홍길동)으로 대체되었습니다.

### 성적 조회 (`getGrades`)

```json
{
  "studentId": "20231234",
  "studentName": "홍길동",
  "major": "소프트웨어학과",
  "yearLevel": 2,
  "grades": [
    {
      "year": 2025,
      "semester": "2학기",
      "courseCode": "000304",
      "section": "004",
      "courseName": "공업수학1",
      "courseType": "전기",
      "graduationCourseType": "전기",
      "credit": 3,
      "grade": "A+",
      "gradePoint": 4.5,
      "evaluationType": "GRADE",
      "retake": false
    },
    {
      "year": 2025,
      "semester": "2학기",
      "courseCode": "001725",
      "section": "001",
      "courseName": "선형대수",
      "courseType": "전기",
      "graduationCourseType": "전기",
      "credit": 3,
      "grade": "B+",
      "gradePoint": 3.5,
      "evaluationType": "GRADE",
      "retake": false
    }
  ],
  "creditSummary": {
    "liberalRequired": 12,
    "majorRequired": 9,
    "majorElective": 6,
    "majorBasic": 3,
    "majorTotal": 18
  },
  "totalGpa": 3.82,
  "totalEarnedCredits": 42,
  "totalAttemptedCredits": 42,
  "liberalGpa": 3.95,
  "majorGpa": 3.72,
  "percentile": 85.4
}
```

### 수강내역 조회 (`getEnrollments`)

```json
{
  "studentId": "20231234",
  "year": 2026,
  "semester": "1학기",
  "enrollments": [
    {
      "year": 2026,
      "semester": "1학기",
      "courseCode": "011312",
      "section": "003",
      "courseName": "경영학",
      "courseType": "균필",
      "credit": 3
    },
    {
      "year": 2026,
      "semester": "1학기",
      "courseCode": "010227",
      "section": "001",
      "courseName": "컴퓨터구조및운영체제",
      "courseType": "전선",
      "credit": 3,
      "professor": "김교수",
      "timeLocation": "월3,4 수3,4 대양AI 301"
    }
  ],
  "totalCredits": 18
}
```

### 장학이력 조회 (`getScholarships`)

```json
{
  "studentId": "20231234",
  "scholarships": [
    {
      "year": 2025,
      "semester": "2학기",
      "scholarshipName": "성적우수장학금",
      "amount": 2463000
    },
    {
      "year": 2025,
      "semester": "1학기",
      "scholarshipName": "국가장학금",
      "amount": 2567000
    }
  ],
  "totalAmount": 5030000
}
```

### 시간표 조회 (`getTimetable`)

```json
{
  "studentId": "20231234",
  "year": 2026,
  "semester": "1학기",
  "slots": [
    {
      "courseName": "컴퓨터구조및운영체제",
      "courseCode": "010227",
      "professor": "김교수",
      "day": "MON",
      "periods": [3, 4],
      "location": "대양AI 301"
    },
    {
      "courseName": "컴퓨터구조및운영체제",
      "courseCode": "010227",
      "professor": "김교수",
      "day": "WED",
      "periods": [3, 4],
      "location": "대양AI 301"
    }
  ]
}
```

**그리드 변환 유틸리티**:

```typescript
import { toTimetableGrid, Day } from "sejong-auth";

const grid = toTimetableGrid(timetable.slots);
// grid.get(Day.MON)?.get(3) → { courseName: "컴퓨터구조및운영체제", ... }
```

### 등록금 납부내역 (`getTuition`)

```json
{
  "studentId": "20231234",
  "records": [
    {
      "year": 2026,
      "semester": "1학기",
      "totalAmount": 4926000,
      "scholarshipAmount": 2463000,
      "paidAmount": 2463000,
      "status": "PAID"
    },
    {
      "year": 2025,
      "semester": "2학기",
      "totalAmount": 4926000,
      "scholarshipAmount": 2463000,
      "paidAmount": 2463000,
      "status": "PAID"
    }
  ],
  "totalPaid": 4926000
}
```

### 도서관 열람실 좌석 현황 (`getLibraryRooms`)

```json
[
  { "roomNo": 11, "name": "제1열람실A", "usedSeats": 35, "totalSeats": 87, "occupancyRate": 40.2 },
  { "roomNo": 12, "name": "제1열람실B", "usedSeats": 40, "totalSeats": 102, "occupancyRate": 39.2 },
  { "roomNo": 13, "name": "제2열람실", "usedSeats": 76, "totalSeats": 111, "occupancyRate": 68.5 },
  { "roomNo": 14, "name": "제3열람실", "usedSeats": 66, "totalSeats": 107, "occupancyRate": 61.7 },
  { "roomNo": 15, "name": "제4열람실A", "usedSeats": 58, "totalSeats": 146, "occupancyRate": 39.7 },
  { "roomNo": 16, "name": "제4열람실B", "usedSeats": 32, "totalSeats": 102, "occupancyRate": 31.4 },
  { "roomNo": 17, "name": "제5열람실", "usedSeats": 15, "totalSeats": 36, "occupancyRate": 41.7 },
  { "roomNo": 18, "name": "제6열람실", "usedSeats": 12, "totalSeats": 32, "occupancyRate": 37.5 }
]
```

### 좌석 배치도 (`getSeatMap`)

```json
{
  "roomNo": 13,
  "roomName": "제2열람실",
  "seats": [
    { "seatNumber": 1, "status": "available" },
    { "seatNumber": 2, "status": "available" },
    { "seatNumber": 3, "status": "occupied" },
    { "seatNumber": 4, "status": "occupied" },
    { "seatNumber": 5, "status": "occupied" },
    { "seatNumber": 8, "status": "available" }
  ]
}
```

### 나의 좌석 (`getMySeat`)

```json
{
  "roomName": "제2열람실",
  "seatNumber": "42",
  "usageTime": "14:00~22:00",
  "extensionCount": 1,
  "isAssigned": true
}
```

### 시설 예약 현황 (`getFacilityRooms`)

```json
[
  { "facilityType": "studyroom", "name": "스터디룸 12인실 01스터디룸", "available": true },
  { "facilityType": "studyroom", "name": "스터디룸 6인실 02스터디룸 ~ 04스터디룸", "available": true },
  { "facilityType": "studyroom", "name": "스터디룸 4인실 05스터디룸 ~ 12스터디룸", "available": false }
]
```

### 학생증 (`getStudentCard`)

```json
{
  "cardNo": "L80CknzINxlpmp78+o+Jww==",
  "isIssued": true
}
```

### 공지사항 목록 (`getNotices`)

```json
{
  "notices": [
    {
      "noticeId": "864353",
      "title": "2026-2학기 교수초빙(3월공고_정년제 전임교원) 안내",
      "date": "2026-03-11",
      "category": "일반공지"
    },
    {
      "noticeId": "863049",
      "title": "[2026-1] 학부 재학생 등록금 납부 안내",
      "date": "2026-02-10",
      "category": "일반공지"
    }
  ],
  "totalCount": 5,
  "currentPage": 1
}
```

**카테고리 목록** (category 파라미터):

| category | 설명 |
|----------|------|
| `일반공지` | 일반 공지사항 |
| `입학공지` | 입학 관련 |
| `학사공지` | 학사 관련 |
| `국제교류` | 국제교류(KR) |
| `취업` | 취업 정보 |
| `장학` | 장학 안내 |
| `채용/모집` | 채용/모집 공고 |

### 공지사항 상세 (`getNoticeDetail`)

```json
{
  "noticeId": "864353",
  "title": "2026-2학기 교수초빙(3월공고_정년제 전임교원) 안내",
  "date": "2026-03-11",
  "category": "일반공지",
  "content": "<p>1. 접수기간 : 2026.03.11.(수) ~ 2026.03.25.(수) 17:00까지</p>..."
}
```

---

## Error Handling

```typescript
import {
  LoginFailedError,    // 잘못된 credentials
  SessionExpiredError, // login() 미호출
  NetworkError,        // 연결 실패, 타임아웃
  PortalError,         // 포털 응답 이상
  ParseError,          // 응답 구조 변경
} from "sejong-auth";

try {
  await client.getGrades();
} catch (e) {
  if (e instanceof LoginFailedError) { /* 로그인 실패 */ }
  if (e instanceof NetworkError) { /* 네트워크 오류 */ }
  if (e instanceof PortalError) { /* 포털 점검 중 */ }
  if (e instanceof ParseError) { /* API 변경됨 */ }
}
```

| Error | REST Status | 원인 |
|-------|-------------|------|
| `LoginFailedError` | 401 | 잘못된 학번 또는 비밀번호 |
| `NetworkError` | 502 | 연결 실패, 타임아웃 |
| `PortalError` | 502 | 포털 비정상 응답, 점검 중 |
| `ParseError` | 500 | 응답 구조 변경 |

---

## How It Works

### 인증 흐름 (모바일 앱 방식)

```
1. POST sjapp.sejong.ac.kr/api/auth/login  → JWT accessToken
2. POST sjapp.sejong.ac.kr/api/secureapi/sso/external-link  → SSO redirect URL
3. GET  redirect URL  → ssotoken 쿠키
4. GET  sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do  → 포털 세션
5. WebSquare 초기화  → 학사 데이터 API 호출 가능
```

> portal.sejong.ac.kr을 거치지 않으므로 브라우저 세션과 충돌하지 않습니다.

### 도서관 좌석

```
1. GET  library.sejong.ac.kr/relation/seat  → libseat 토큰
2. GET  libseat.sejong.ac.kr/mobile/MA/*.php  → HTML 파싱
3. POST libseat.sejong.ac.kr/mobile/MA/confirmSeat.php  → 좌석 예약
```

### 공지사항

```
GET www.sejong.ac.kr/kor/intro/notice{1-10}.do  → HTML 파싱 (인증 불필요)
```

---

## Project Structure

```
src/
├── index.ts              # 라이브러리 공개 API
├── client.ts             # SejongClient (모든 기능의 진입점)
├── session.ts            # sjapp JWT 인증 + WebSquare 세션 관리
├── types.ts              # 타입 정의
├── errors.ts             # 커스텀 에러 클래스
├── api/
│   ├── grades.ts         # 성적 조회
│   ├── enrollments.ts    # 수강내역
│   ├── scholarships.ts   # 장학이력
│   ├── timetable.ts      # 시간표 (파싱 + 그리드)
│   ├── tuition.ts        # 등록금
│   ├── graduation.ts     # 졸업요건
│   ├── calendar.ts       # 학사일정
│   ├── notices.ts        # 공지사항 (HTML 파싱)
│   ├── library.ts        # 도서관 좌석 조회
│   ├── seatactions.ts    # 좌석 예약/연장/반납
│   └── studentcard.ts    # 학생증
└── server/
    ├── app.ts            # Express 서버
    └── routes.ts         # REST API 라우트
```

## Development

```bash
git clone https://github.com/JiminLee-way/Sejong-University-Portal-Auth.git
cd Sejong-University-Portal-Auth
npm install
npm run build

# 개발 서버
npm run dev

# 테스트
npm test
```

## Known Limitations

- 짧은 시간 내 다수 로그인 시 계정이 잠길 수 있습니다 (5회 이상)
- 포털 SSL/TLS 설정이 오래되어 `NODE_TLS_REJECT_UNAUTHORIZED=0` 필요
- 도서관 좌석 시스템은 HTML 파싱 기반이므로 UI 변경 시 업데이트 필요
- 졸업요건/학사일정 API는 포털 엔드포인트 추가 검증 필요

## License

MIT
