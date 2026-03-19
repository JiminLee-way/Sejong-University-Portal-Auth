# Library API Contract: Extended Features

기존 `SejongClient` 클래스에 추가되는 메서드.

## SejongClient (추가 메서드)

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();
await client.login('학번', '비밀번호');

// ── 시간표 ──
const timetable = await client.getTimetable();           // 현재 학기
const timetable2 = await client.getTimetable('2026', '10'); // 특정 학기
// Returns: TimetableReport

// ── 시간표 그리드 변환 ──
import { toTimetableGrid } from 'sejong-auth';
const grid = toTimetableGrid(timetable.slots);
// grid.get('MON')?.get(1) → TimetableSlot | undefined

// ── 등록금 ──
const tuition = await client.getTuition();
// Returns: TuitionReport

// ── 졸업요건 ──
const graduation = await client.getGraduationRequirements();
// Returns: GraduationReport

// ── 도서 대출 ──
const loans = await client.getBookLoans();
// Returns: BookLoanReport

// ── 좌석 액션 ──
const reserved = await client.reserveSeat(13, 42);   // roomNo, seatNo
const extended = await client.extendSeat();
const returned = await client.returnSeat();
// Returns: SeatActionResult

// ── 학사일정 ──
const calendar = await client.getAcademicCalendar();           // 현재 학기
const calendar2 = await client.getAcademicCalendar('2026', '10');
// Returns: AcademicCalendar

// ── 공지사항 ──
const notices = await client.getNotices();                     // 기본 (1페이지)
const notices2 = await client.getNotices({ category: '학사', page: 2 });
// Returns: NoticeList

const detail = await client.getNoticeDetail('12345');
// Returns: NoticeDetail
```

## Error Handling

```typescript
import { PortalError, ParseError } from 'sejong-auth';

try {
  await client.reserveSeat(13, 42);
} catch (e) {
  if (e instanceof PortalError) {
    // "이미 좌석이 배정되어 있습니다"
    // "해당 좌석은 사용 중입니다"
    // "연장 횟수 제한에 도달했습니다"
  }
}
```

## Notes

- 시간표(`getTimetable`)는 내부적으로 `getEnrollments`를 호출하고 `timeLocation` 필드를 파싱
- 등록금/졸업요건/학사일정/공지사항은 포털 WebSquare API (sjpt.sejong.ac.kr) 사용
- 도서 대출은 도서관 시스템 사용 (데이터 소스는 구현 시 확정)
- 좌석 액션은 기존 libseat 토큰을 재사용
- 모든 메서드는 기존 세션을 재사용하여 추가 로그인 불필요
