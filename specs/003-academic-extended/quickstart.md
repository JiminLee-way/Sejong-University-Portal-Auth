# Quickstart: Extended Features

## As Library

```typescript
import { SejongClient, toTimetableGrid } from 'sejong-auth';

const client = new SejongClient();
await client.login('학번', '비밀번호');

// 시간표 조회 + 그리드 변환
const timetable = await client.getTimetable();
console.log(`${timetable.slots.length}개 시간 슬롯`);
const grid = toTimetableGrid(timetable.slots);
const mondayFirst = grid.get('MON')?.get(1);
if (mondayFirst) console.log(`월요일 1교시: ${mondayFirst.courseName}`);

// 등록금 납부내역
const tuition = await client.getTuition();
console.log(`총 납부액: ${tuition.totalPaid.toLocaleString()}원`);

// 졸업요건 충족도
const grad = await client.getGraduationRequirements();
console.log(`졸업 상태: ${grad.graduationStatus}`);
grad.requirements.forEach(r => {
  console.log(`  ${r.category}: ${r.earnedCredits}/${r.requiredCredits} (부족: ${r.shortageCredits})`);
});

// 도서 대출내역
const loans = await client.getBookLoans();
console.log(`대출 중: ${loans.totalLoans}권, 연체: ${loans.overdueCount}권`);

// 좌석 예약/연장/반납
const result = await client.reserveSeat(13, 42);
console.log(result.message); // "좌석이 배정되었습니다"
await client.extendSeat();
await client.returnSeat();

// 학사일정
const cal = await client.getAcademicCalendar();
cal.events.forEach(e => console.log(`${e.startDate} ~ ${e.endDate}: ${e.eventName}`));

// 공지사항
const notices = await client.getNotices({ page: 1 });
const detail = await client.getNoticeDetail(notices.notices[0].noticeId);
console.log(detail.content);
```

## As REST API

```bash
# 시간표
curl -X POST http://localhost:3000/api/v1/timetable \
  -H "Content-Type: application/json" \
  -d '{"username":"학번","password":"비밀번호"}'

# 등록금
curl -X POST http://localhost:3000/api/v1/tuition \
  -H "Content-Type: application/json" \
  -d '{"username":"학번","password":"비밀번호"}'

# 좌석 예약
curl -X POST http://localhost:3000/api/v1/library/reserve \
  -H "Content-Type: application/json" \
  -d '{"username":"학번","password":"비밀번호","roomNo":13,"seatNo":42}'

# 공지사항 상세
curl -X POST http://localhost:3000/api/v1/notices/detail \
  -H "Content-Type: application/json" \
  -d '{"username":"학번","password":"비밀번호","noticeId":"12345"}'
```
