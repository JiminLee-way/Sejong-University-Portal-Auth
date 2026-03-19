# Quickstart: sjapp Native API

## 라이브러리

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();
await client.login('학번', '비밀번호');

// 성적
const grades = await client.getGrades();
console.log(`GPA: ${grades.overallSummary.avgMrks}`);

// 공지사항 (로그인 불필요)
const notices = await client.getNotices('academic', { page: 0, size: 5 });
notices.content.forEach(n => console.log(`${n.writtenAt} ${n.title}`));

// 일정 생성
await client.createSchedule({ title: '중간고사', startAt: '2026-04-14T09:00', endAt: '2026-04-18T18:00' });

// 도서관 좌석 (기존 그대로)
const rooms = await client.getLibraryRooms();
```

## REST API

```bash
# 로그인
TOKEN=$(curl -s http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"학번","password":"비밀번호"}' | jq -r '.accessToken')

# 성적 조회
curl http://localhost:3000/api/v1/grades -H "Authorization: Bearer $TOKEN"

# 공지사항 (토큰 불필요)
curl "http://localhost:3000/api/v1/notices/academic?page=0&size=5"

# 교직원 검색
curl http://localhost:3000/api/v1/staff -H "Authorization: Bearer $TOKEN"
```
