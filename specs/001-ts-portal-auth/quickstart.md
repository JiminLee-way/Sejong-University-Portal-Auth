# Quickstart: Sejong Portal Auth

## As Library

```bash
npm install sejong-auth
```

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();
await client.login('학번', '비밀번호');

// 성적 조회
const grades = await client.getGrades();
console.log(`GPA: ${grades.totalGpa}, 과목수: ${grades.grades.length}`);

// 수강내역 조회
const enrollments = await client.getEnrollments();
console.log(`수강: ${enrollments.enrollments.length}과목, ${enrollments.totalCredits}학점`);

// 장학이력 조회
const scholarships = await client.getScholarships();
console.log(`장학금 총액: ${scholarships.totalAmount.toLocaleString()}원`);
```

## As REST API Server

```bash
npx sejong-auth-server
# or
npm install sejong-auth && npx sejong-auth-server --port 3000
```

```bash
curl -X POST http://localhost:3000/api/v1/grades \
  -H "Content-Type: application/json" \
  -d '{"username":"학번","password":"비밀번호"}'
```

## Development

```bash
git clone <repo>
cd sejong_portal_auth
npm install
npm run build
npm test

# Integration test (requires real credentials)
SEJONG_USERNAME=학번 SEJONG_PASSWORD=비밀번호 npm run test:integration

# Start dev server
npm run dev
```
