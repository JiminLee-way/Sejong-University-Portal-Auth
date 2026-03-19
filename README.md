# Sejong University Portal Auth

세종대학교 포털 SSO 인증 및 학사 데이터 조회 TypeScript 라이브러리 + REST API 서버

## Features

- **SSO 로그인** — 세종대 포털(`portal.sejong.ac.kr`) 통합 인증
- **기이수 성적 조회** — 전체 성적, GPA, 학점 현황
- **수강내역 조회** — 학기별 수강 과목 목록
- **장학이력 조회** — 장학금 수혜 이력 및 금액
- **도서관 좌석 현황** — 열람실별 실시간 좌석 현황
- **도서관 좌석 배치도** — 개별 열람실 좌석 상태
- **나의 좌석 조회** — 현재 배정된 좌석 확인
- **시설 예약 현황** — 스터디룸, 시네마룸, S-Lounge
- **모바일 학생증** — 학생증 카드번호 조회
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

// 도서관 좌석 현황
const rooms = await client.getLibraryRooms();
for (const room of rooms) {
  console.log(`${room.name}: ${room.usedSeats}/${room.totalSeats} (${room.occupancyRate}%)`);
}

// 좌석 배치도
const seatMap = await client.getSeatMap(13); // 제2열람실
const available = seatMap.seats.filter(s => s.status === "available");
console.log(`빈 좌석: ${available.length}석`);
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

# 도서관 좌석 현황
curl -X POST http://localhost:3000/api/v1/library/rooms \
  -H "Content-Type: application/json" \
  -d '{"username": "학번", "password": "비밀번호"}'
```

## API Reference

### SejongClient Methods

| Method | Description |
|--------|-------------|
| `login(username, password)` | SSO 로그인 |
| `getGrades()` | 기이수 성적 조회 |
| `getEnrollments(year?, semesterCode?)` | 수강내역 조회 |
| `getScholarships()` | 장학이력 조회 |
| `getLibraryRooms()` | 열람실 좌석 현황 |
| `getMySeat()` | 나의 좌석 조회 |
| `getSeatMap(roomNo)` | 좌석 배치도 (roomNo: 11-18) |
| `getFacilityRooms(type)` | 시설 예약 현황 |
| `getStudentCard()` | 학생증 카드번호 |

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/grades` | 기이수 성적 |
| POST | `/api/v1/enrollments` | 수강내역 |
| POST | `/api/v1/scholarships` | 장학이력 |
| POST | `/api/v1/all` | 성적+수강+장학 일괄 조회 |
| POST | `/api/v1/library/rooms` | 열람실 좌석 현황 |
| POST | `/api/v1/library/my-seat` | 나의 좌석 |
| POST | `/api/v1/library/seat-map` | 좌석 배치도 |
| POST | `/api/v1/library/facilities` | 시설 예약 현황 |
| POST | `/api/v1/student-card` | 학생증 카드번호 |

**Request** (모든 엔드포인트 공통):
```json
{ "username": "학번", "password": "비밀번호" }
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| `400` | username/password 누락 |
| `401` | 로그인 실패 (잘못된 학번 또는 비밀번호) |
| `500` | 파싱 실패 (포털 API 구조 변경) |
| `502` | 포털 접근 불가 (점검 중, 네트워크 오류) |

## Data Models

### GradeReport

```typescript
interface GradeReport {
  studentId: string;       // 학번
  studentName: string;     // 성명
  major: string;           // 학과
  yearLevel: number;       // 학년
  grades: Grade[];         // 전체 성적 목록
  creditSummary: CreditSummary;
  totalGpa: number;        // 전체 평점평균
  totalEarnedCredits: number;
  totalAttemptedCredits: number;
  liberalGpa: number;      // 교양 평점평균
  majorGpa: number;        // 전공 평점평균
  percentile: number;      // 백분위
}
```

### ReadingRoom

```typescript
interface ReadingRoom {
  roomNo: number;          // 열람실 번호 (11-18)
  name: string;            // 열람실명
  usedSeats: number;       // 사용 중 좌석
  totalSeats: number;      // 전체 좌석
  occupancyRate: number;   // 사용률 (%)
}
```

### SeatMapResponse

```typescript
interface SeatMapResponse {
  roomNo: number;
  roomName: string;
  seats: SeatStatus[];     // 각 좌석의 번호 + 상태
}

interface SeatStatus {
  seatNumber: number;
  status: "available" | "occupied" | "reserved";
}
```

### 열람실 번호

| roomNo | 이름 |
|--------|------|
| 11 | 제1열람실A |
| 12 | 제1열람실B |
| 13 | 제2열람실 |
| 14 | 제3열람실 |
| 15 | 제4열람실A |
| 16 | 제4열람실B |
| 17 | 제5열람실 |
| 18 | 제6열람실 |

## Error Handling

```typescript
import {
  SejongAuthError,     // 모든 예외의 베이스
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

## How It Works

### 학사 정보 (성적, 수강, 장학)

1. **SSO Login** — `portal.sejong.ac.kr`에 form POST → `ssotoken` 쿠키 획득
2. **Portal Access** — `sjpt.sejong.ac.kr`에 SSO 쿠키로 접속
3. **WebSquare Init** — 7단계 세션 초기화 (브라우저 동작 재현)
4. **JSON API** — 포털 내부 WebSquare JSON API로 데이터 조회

### 도서관 좌석

1. **Library SSO** — `library.sejong.ac.kr`에 SSO 쿠키로 접속
2. **Token** — `libseat.sejong.ac.kr`로 리다이렉트 시 토큰 획득
3. **HTML Parsing** — PHP SSR 페이지를 cheerio로 파싱

> 브라우저 없이 순수 HTTP 요청만 사용하므로 서버 환경에서 안정적으로 동작합니다.

## Project Structure

```
sejong-auth/
├── src/
│   ├── index.ts           # 라이브러리 공개 API
│   ├── client.ts          # SejongClient (모든 기능의 진입점)
│   ├── session.ts         # SSO 로그인 + WebSquare 세션 관리
│   ├── types.ts           # 타입 정의
│   ├── errors.ts          # 커스텀 에러 클래스
│   ├── api/
│   │   ├── grades.ts      # 성적 조회 API
│   │   ├── enrollments.ts # 수강내역 API
│   │   ├── scholarships.ts # 장학이력 API
│   │   ├── library.ts     # 도서관 좌석 API
│   │   └── studentcard.ts # 학생증 API
│   └── server/
│       ├── app.ts         # Express 서버
│       └── routes.ts      # REST API 라우트
├── tests/
├── package.json
└── tsconfig.json
```

## Tech Stack

- **TypeScript 5.x** / **Node.js 18+**
- **axios** + **tough-cookie** — HTTP 클라이언트 (쿠키 관리)
- **cheerio** — HTML 파싱 (도서관 좌석)
- **Express** — REST API 서버
- **vitest** — 테스트

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

# 통합 테스트 (실제 포털 접속)
SEJONG_USERNAME=학번 SEJONG_PASSWORD=비밀번호 npm run test:integration
```

## Known Limitations

- 세종대 포털은 동일 사용자의 동시 세션을 제한합니다
- 짧은 시간 내 다수 로그인 시 계정이 잠길 수 있습니다 (5회 이상)
- 포털 SSL/TLS 설정이 오래되어 `NODE_TLS_REJECT_UNAUTHORIZED=0` 필요
- 도서관 좌석 시스템은 HTML 파싱 기반이므로 UI 변경 시 업데이트 필요

## License

MIT
