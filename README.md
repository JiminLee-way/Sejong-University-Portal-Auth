# Sejong Portal Auth

세종대학교 통합 앱(`sjapp.sejong.ac.kr`) API 기반 TypeScript 라이브러리

> 공식 모바일 앱과 동일한 JWT 인증 + REST API를 사용합니다. 브라우저 세션 충돌 없음, HTML 파싱 없음, 순수 JSON.

## Features

- **JWT 인증** — 로그인, 로그아웃, 토큰 갱신, 프로필 조회
- **모바일 학생증 QR** — 공식 앱과 동일한 동적 QR 코드 생성 (59초 갱신)
- **시간표 조회** — 요일/교시별 시간표 + 수강 과목 + 학점 요약
- **성적 조회** — 전체/당학기/학기별 성적 + GPA
- **공지사항** — 8개 카테고리 목록 + 상세 (인증 불필요)
- **세종뉴스** — 교내뉴스, 언론속세종, 보도자료, 웹진 5종
- **소셜 피드** — 블로그, 유튜브, 최신 피드
- **일정 관리** — CRUD + 카테고리, 태그, 반복 일정
- **1:1 문의** — CRUD + 카테고리
- **교직원 검색** — 이름, 학과, 연락처
- **알림** — 수신함, 읽음 처리, 설정
- **도서관 좌석** — 열람실 현황, 좌석 배치도, 예약/연장/반납
- **Pure JSON** — HTML 파싱 없음, 모든 응답이 구조화된 JSON

## Quick Start

```bash
npm install sejong-auth
```

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();
await client.login('학번', '비밀번호');

// 성적 조회
const grades = await client.getGrades();
console.log(`GPA: ${grades.overallSummary.avgMrks}`);

// 모바일 학생증 QR 코드
const qr = await client.generateStudentQr();
fs.writeFileSync('qr.png', Buffer.from(qr.qrCodeImage, 'base64'));

// 시간표 조회
const semesters = await client.getAvailableSemesters();
const tt = await client.getTimetable('2026', '10');
tt.courses.forEach(c => console.log(`${c.curiNm} ${c.lesnTime} ${c.roomNmAlias}`));

// 수강 과목 + 학점
const enrolled = await client.getEnrolledCourses('2026', '10');
console.log(`${enrolled.creditSummary.totalCredits}학점 ${enrolled.creditSummary.totalCourses}과목`);

// 공지사항 (로그인 불필요)
const notices = await client.getNotices('academic', { page: 0, size: 5 });
```

---

## API Reference

### SejongClient Methods

| Method | Auth | Description |
|--------|:----:|-------------|
| `login(username, password)` | - | JWT 로그인 |
| `getProfile()` | O | 내 정보 (이름, 학과, 학년, 카드번호) |
| `refreshToken()` | O | 토큰 갱신 |
| `logout()` | O | 로그아웃 |
| `generateStudentQr(refreshKey?, size?)` | O | 모바일 학생증 QR 코드 생성 |
| `getAvailableSemesters()` | O | 조회 가능한 학기 목록 |
| `getTimetable(year, smtCd)` | O | 시간표 (요일/교시별) |
| `getEnrolledCourses(year, smtCd)` | O | 수강 과목 목록 + 학점 요약 |
| `getGrades()` | O | 전체 성적 |
| `getCurrentGrades()` | O | 당학기 성적 |
| `getSemesterGrades(year, smtCd)` | O | 특정 학기 성적 |
| `getNotices(category, {page, size})` | - | 공지사항 목록 |
| `getNoticeDetail(category, id)` | - | 공지사항 상세 |
| `getLatestNotices(type, size)` | - | 최신 공지 |
| `getNews(type, {page, size})` | - | 세종뉴스 목록 |
| `getNewsDetail(type, id)` | - | 세종뉴스 상세 |
| `getFeeds(type, {page, size})` | - | 소셜 피드 |
| `getSchedules()` | O | 일정 목록 |
| `createSchedule(data)` | O | 일정 생성 |
| `updateSchedule(id, data)` | O | 일정 수정 |
| `deleteSchedule(id)` | O | 일정 삭제 |
| `getScheduleCategories()` | O | 일정 카테고리 |
| `getQnACategories()` | - | 문의 카테고리 |
| `getMyQnAs({page, size})` | O | 내 문의 목록 |
| `createQnA(data)` | O | 문의 등록 |
| `searchStaff({page, size})` | O | 교직원 검색 |
| `getNotifications({page, size})` | O | 알림 수신함 |
| `getUnreadCount()` | O | 읽지 않은 알림 수 |
| `getNotificationSettings()` | O | 알림 설정 |
| `getLibraryRooms()` | O | 열람실 좌석 현황 |
| `getMySeat()` | O | 나의 좌석 |
| `getSeatMap(roomNo)` | O | 좌석 배치도 |
| `getFacilityRooms(type)` | O | 시설 현황 (studyroom/cinema/slounge) |
| `reserveSeat(roomNo, seatNo)` | O | 좌석 예약 |
| `confirmSeat(roomNo, seatNo)` | O | 좌석 발권확정 (게이트 통과 후) |
| `extendSeat()` | O | 좌석 연장 |
| `returnSeat()` | O | 좌석 반납 |
| `getStudyRoomReservation()` | O | 스터디룸 예약 가능 목록 |
| `reserveStudyRoom(roomNo, date, start, end)` | O | 스터디룸 예약 |
| `cancelStudyRoom(reserveNo)` | O | 스터디룸 예약 취소 |

**Auth 컬럼**: `O` = 로그인 필요, `-` = 로그인 불필요 (공개 API)

---

## Response Examples

> 개인정보는 가명(홍길동)으로 대체되었습니다.

### 로그인 (`login`)

```json
{
  "accessToken": "eyJhbGci...",
  "tokenType": "Bearer",
  "expiresIn": 1800,
  "userId": "20231234",
  "username": "홍길동",
  "email": "hong@example.com",
  "departmentName": "컴퓨터공학과",
  "roles": ["STUDENT"],
  "roleName": "재학생",
  "studentYear": 2,
  "cardNo": "202312340",
  "birthDate": "20040101"
}
```

### 모바일 학생증 QR (`generateStudentQr`)

```json
{
  "qrCodeImage": "iVBORw0KGgo...",
  "format": "PNG"
}
```

> `qrCodeImage`는 base64 인코딩된 PNG. 59초마다 `refreshKey`를 증가시켜 새 QR을 생성합니다.

```typescript
// 공식 앱과 동일한 59초 갱신 사이클
let refreshKey = 0;
setInterval(async () => {
  refreshKey++;
  const qr = await client.generateStudentQr(refreshKey);
  // qr.qrCodeImage를 화면에 표시
}, 59000);
```

### 시간표 조회 (`getTimetable`)

```json
{
  "year": "2026",
  "smtCd": "10",
  "courses": [
    {
      "dayCd": "1",
      "hourCd": "15",
      "timeSlot": "15:00",
      "curiNm": "알고리즘",
      "roomNmAlias": "센B105",
      "empNm": "홍교수 교수",
      "className": "001",
      "lesnTime": "월수15:00-16:30",
      "curiNo": "012169",
      "curiTypeCdNm": "전필"
    }
  ],
  "cyberLectures": ["경영학"]
}
```

> `dayCd`: 1=월, 2=화, 3=수, 4=목, 5=금, 6=토. 각 30분 슬롯별 1개 레코드.

### 수강 과목 (`getEnrolledCourses`)

```json
{
  "courses": [
    {
      "id": "012169-001",
      "name": "알고리즘",
      "category": "전필",
      "credits": 3,
      "building": "센B105",
      "professor": "홍교수"
    }
  ],
  "creditSummary": {
    "totalCourses": 5,
    "totalCredits": 15,
    "major": {
      "required": { "courses": 2, "credits": 6 },
      "elective": { "courses": 2, "credits": 6 }
    },
    "general": {
      "required": { "courses": 1, "credits": 3 },
      "elective": { "courses": 0, "credits": 0 }
    }
  }
}
```

### 성적 조회 (`getGrades`)

```json
{
  "overallSummary": {
    "reqCdt": 36,
    "appCdt": 35,
    "totMrks": 97.5,
    "gruCdt": 35,
    "avgMrks": 3.82,
    "sco": 85
  },
  "semesters": [
    {
      "yearSmtNm": "2025 / 2학기",
      "year": 2025,
      "smtCd": "20",
      "summary": { "reqCdt": 18, "appCdt": 18, "avgMrks": 3.72 },
      "courses": [
        {
          "curiNo": "000304",
          "curiNm": "공업수학1",
          "curiTypeCdNm": "전기",
          "cdt": 3,
          "grade": "A+",
          "mrks": 4.5
        }
      ]
    }
  ]
}
```

### 공지사항 (`getNotices`)

```json
{
  "content": [
    {
      "id": "344_864814",
      "categoryCode": "344",
      "categoryName": "학사공지",
      "categoryType": "academic",
      "title": "2026학년도 교직과정 이수 신청자 대상 안내",
      "writerName": "교직과",
      "writtenAt": "2026-03-18T10:30:00",
      "viewCount": 234,
      "hasAttachment": true,
      "isNew": true
    }
  ],
  "totalElements": 156,
  "totalPages": 16
}
```

**공지 카테고리**: `general`(일반), `academic`(학사), `scholarship`(장학), `employment`(취업), `international`(국제교류), `recruitment`(채용/모집), `engineering`(공학교육), `library`(학술정보원)

### 도서관 열람실 (`getLibraryRooms`)

```json
[
  { "roomNo": 11, "name": "제1열람실A", "usedSeats": 35, "totalSeats": 87, "occupancyRate": 40.2 },
  { "roomNo": 12, "name": "제1열람실B", "usedSeats": 40, "totalSeats": 102, "occupancyRate": 39.2 },
  { "roomNo": 13, "name": "제2열람실", "usedSeats": 76, "totalSeats": 111, "occupancyRate": 68.5 },
  { "roomNo": 14, "name": "제3열람실", "usedSeats": 66, "totalSeats": 107, "occupancyRate": 61.7 }
]
```

### 교직원 검색 (`searchStaff`)

```json
{
  "content": [
    {
      "id": 752939,
      "name": "홍교수",
      "department": "컴퓨터공학과",
      "phone": null,
      "mobile": "010-1234-5678",
      "email": "hong@sejong.ac.kr"
    }
  ],
  "totalElements": 1200,
  "totalPages": 60
}
```

### 스터디룸 예약 (`reserveStudyRoom`)

```typescript
// 스터디룸 예약 (roomNo, 날짜, 시작시간, 종료시간)
await client.reserveStudyRoom(1, '2026-04-01', 10, 12);

// 스터디룸 예약 취소
await client.cancelStudyRoom('12345');
```

---

## Error Handling

```typescript
import { LoginFailedError, NetworkError, PortalError } from 'sejong-auth';

try {
  await client.login('wrong', 'credentials');
} catch (e) {
  if (e instanceof LoginFailedError) { /* 로그인 실패 */ }
  if (e instanceof NetworkError) { /* 서버 접속 불가 */ }
}
```

---

## How It Works

```
1. POST sjapp.sejong.ac.kr/api/auth/login  →  JWT accessToken
2. GET  sjapp.sejong.ac.kr/api/secureapi/*  →  JSON 데이터 (Bearer token)
3. GET  sjapp.sejong.ac.kr/api/publicapi/*  →  JSON 데이터 (토큰 불필요)
```

> `sjapp.sejong.ac.kr`는 세종대 공식 모바일 앱의 백엔드입니다. portal.sejong.ac.kr의 WebSquare가 아닌 순수 REST API를 사용하므로 브라우저 세션 충돌이 없습니다.

## NFC 출입 (S1Pass) 프로토콜 분석

> 이 라이브러리에서는 NFC 기능을 제공하지 않지만, APK 분석으로 프로토콜을 완전히 해독하였으므로 기록합니다.

세종대 모바일 학생증의 NFC 출입(S1Pass)은 Android HCE(Host Card Emulation)로 동작합니다.

```
AID: FF737070736A67 (ASCII: \xFFsppsjg)
Service: android.nfc.cardemulation.HostApduService
저장소: EncryptedSharedPreferences (AES256-GCM)
```

**통신 흐름:**

```
출입 리더기                          학생 스마트폰 (S1PassManager)
    │                                        │
    │──── SELECT APDU (AID: FF737070736A67) ──►│
    │                                        │ cardNo = S1PassConfig.getCardNo()
    │                                        │ response = cardNo.getBytes(UTF-8) + SELECT_OK_SW
    │◄── [cardNo bytes] + [0x90, 0x00] ──────│
    │                                        │
    │  (서버에서 cardNo 검증)                   │
    ▼                                        ▼
   출입 허용/거부
```

**APDU 응답 구조:**

```
cardNo = "250128940"
응답 = [0x32, 0x35, 0x30, 0x31, 0x32, 0x38, 0x39, 0x34, 0x30, 0x90, 0x00]
        \___________________ cardNo UTF-8 __________________/  \_ OK SW _/
```

- `cardNo`는 로그인 응답의 `cardNo` 필드와 동일 (Android), iOS는 `cardNoIos` 사용
- 암호화 없이 cardNo 평문을 전송 (리더기-서버 간에서 검증)
- `requireDeviceUnlock="false"`, `requireDeviceScreenOn="false"` — 잠금 해제 불필요

**재현 방법:** Android 앱에서 `HostApduService`를 구현하고, 위 AID와 cardNo 응답 로직을 적용하면 됩니다. Node.js에서는 물리적 NFC 하드웨어가 없으므로 불가능합니다.

---

## Project Structure

```
src/
├── index.ts              # 공개 API
├── client.ts             # SejongClient
├── http.ts               # JWT HTTP 클라이언트
├── types.ts              # 타입 정의
├── errors.ts             # 에러 클래스
├── api/
│   ├── auth.ts           # 인증
│   ├── qr.ts             # 학생증 QR 코드
│   ├── timetable.ts      # 시간표 + 수강 과목
│   ├── grades.ts         # 성적
│   ├── notices.ts        # 공지사항
│   ├── news.ts           # 세종뉴스
│   ├── feeds.ts          # 소셜 피드
│   ├── schedules.ts      # 일정
│   ├── qna.ts            # 문의
│   ├── staff.ts          # 교직원
│   ├── notifications.ts  # 알림
│   ├── library.ts        # 도서관 좌석
│   └── seatactions.ts    # 좌석 예약/연장/반납
└── server/
    ├── app.ts            # Express 서버
    └── routes.ts         # REST API 라우트
```

## Known Issues

- **수강 학점 합산 오류**: `getEnrolledCourses()`의 `creditSummary.totalCredits`가 전공 학점만 합산하고 균필/교양 학점을 누락하는 서버 버그가 있습니다. 정확한 학점은 `courses`를 직접 합산하세요:
  ```typescript
  const enrolled = await client.getEnrolledCourses('2026', '10');
  const realCredits = enrolled.courses.reduce((sum, c) => sum + c.credits, 0);
  ```
- **좌석 예약/발권확정**: 도서관 게이트 통과 후(도서관 내부)에서만 가능합니다
- **좌석 연장**: 도서관 내부 Wi-Fi/비콘 검증이 필요하여 외부에서 호출 시 실패합니다

## Development

```bash
git clone https://github.com/JiminLee-way/Sejong-University-Portal-Auth.git
cd Sejong-University-Portal-Auth
npm install
npm run build
npm run dev  # 개발 서버
npm test     # 테스트
```

## License

MIT
