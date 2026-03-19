# Quickstart: sjapp JWT 인증 전환

## 사용법 (변경 없음)

인증 방식이 내부적으로 sjapp JWT로 전환되지만, 외부 API는 완전히 동일합니다.

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();
await client.login('학번', '비밀번호');  // 내부적으로 sjapp JWT 사용

// 모든 기존 API 그대로 동작
const grades = await client.getGrades();
const enrollments = await client.getEnrollments();
const timetable = await client.getTimetable();
```

## 차이점

| 항목 | 기존 (portal) | 새 방식 (sjapp) |
|------|--------------|----------------|
| 로그인 서버 | portal.sejong.ac.kr | sjapp.sejong.ac.kr |
| 인증 방식 | form POST + JS redirect | JWT + SSO redirect |
| 브라우저 충돌 | 발생 | 없음 |
| API 인터페이스 | 동일 | 동일 |

## 검증

```bash
# 브라우저에서 포털 로그인한 상태에서 테스트
SEJONG_USERNAME=학번 SEJONG_PASSWORD=비밀번호 npm run test:integration
```
