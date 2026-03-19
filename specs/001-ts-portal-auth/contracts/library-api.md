# Library API Contract

## SejongClient

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();

// Login (stores credentials, validates on first data call)
await client.login('학번', '비밀번호');

// Grades
const grades = await client.getGrades();
// Returns: GradeReport

// Enrollments (optional: year, semesterCode)
const enrollments = await client.getEnrollments();
const enrollments2 = await client.getEnrollments('2025', '20');
// Returns: EnrollmentReport

// Scholarships
const scholarships = await client.getScholarships();
// Returns: ScholarshipReport
```

## Error Handling

```typescript
import { LoginFailedError, NetworkError, PortalError, ParseError } from 'sejong-auth';

try {
  await client.getGrades();
} catch (e) {
  if (e instanceof LoginFailedError) { /* 잘못된 credentials */ }
  if (e instanceof NetworkError) { /* 연결 실패 */ }
  if (e instanceof PortalError) { /* 포털 응답 이상 */ }
  if (e instanceof ParseError) { /* JSON 구조 변경 */ }
}
```

## Notes

- 각 `getXxx()` 호출은 내부적으로 독립된 HTTP 세션을 생성 (포털 동시 세션 제한 때문)
- `login()`은 credentials를 저장만 하고, 실제 SSO 인증은 데이터 호출 시 수행
- 모든 메서드는 async/await 기반
