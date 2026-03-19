# Research: sjapp JWT 모바일 인증 전환

## R1: sjapp 인증 API 검증 ✅

**Decision**: `https://sjapp.sejong.ac.kr/api/auth/login` POST로 JWT accessToken 획득

**Verified**:
```
POST https://sjapp.sejong.ac.kr/api/auth/login
Body: { "username": "학번", "password": "비밀번호" }
Response: {
  "data": {
    "accessToken": "eyJhbG...",
    "tokenType": "Bearer",
    "expiresIn": 1800,
    "userId": "25012894",
    "username": "이지민",
    "departmentName": "사이버국방학과",
    "roles": ["STUDENT"],
    "studentYear": 2,
    "cardNo": "250128940"
  }
}
```

**Error Response** (잘못된 credentials):
```
{ "status": "error", "code": "VALIDATION_FAILED", "details": { "fieldErrors": [...] } }
```

**Rationale**: portal.sejong.ac.kr 대비 장점:
- JWT 기반 → 세션 관리 간편
- 브라우저 포털과 독립적 → 세션 충돌 없음
- 추가 학생 정보(학과, 학년, 카드번호) 로그인 시 즉시 제공

## R2: SSO External Link 검증 ✅

**Decision**: JWT 토큰으로 SSO redirect URL을 발급받아 sjpt 세션 생성

**Verified**:
```
POST https://sjapp.sejong.ac.kr/api/secureapi/sso/external-link
Headers: { Authorization: "Bearer {accessToken}" }
Body: { "targetUrl": "https://sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=" }
Response: {
  "data": {
    "redirectUrl": "http://sjapp.sejong.ac.kr/api/publicapi/sso/redirect/{uuid}"
  }
}
```

**Redirect 결과**: `ssotoken` 쿠키 발급 → `sejong.ac.kr` 도메인

## R3: SSO → sjpt 세션 전환 ✅

**Verified Flow**:
1. SSO redirect URL GET → `ssotoken` 쿠키 수신
2. `ssotoken`을 `portal.sejong.ac.kr`, `sjpt.sejong.ac.kr` 도메인에 설정
3. `GET https://sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=` → sjpt 세션 쿠키(JSESSIONID, ROT_ROUTEID) 수신
4. `POST initUserInfo.do` → userId, RUNNING_SEJONG, LOGIN_TIME 획득
5. WebSquare 초기화 → 기존 API 호출 가능

**핵심 발견**: 이 과정에서 portal.sejong.ac.kr을 거치지 않으므로 브라우저 세션과 독립적

## R4: 기존 freshLogin 대체 방안

**Decision**: `session.ts`의 `freshLogin()` 함수를 sjapp 인증 흐름으로 교체

**변경 범위**: `src/session.ts`만 수정
- `freshLogin()` → sjapp JWT login + SSO redirect + sjpt 세션
- `createSession()` → 기존 세션 복원 로직은 유지
- `initWebSquare()` → 변경 없음
- `initPage()` → 변경 없음

**기존 API 모듈 영향**: 없음 (SessionInfo 인터페이스 동일)

## R5: sjapp 서버 구성 정보

**Base URL**: `https://sjapp.sejong.ac.kr`
**API Prefix**:
- `/api/auth` — 인증 (login, logout, refresh, me)
- `/api/secureapi` — 인증 필요 API (SSO external link 등)
- `/api/publicapi` — 공개 API (SSO redirect, 메뉴, i18n)

**Tech Stack** (JS 번들 분석):
- Frontend: React SPA (Vite build)
- Auth: JWT (HS256), Bearer token
- Session: httpOnly cookie + JWT
- Tenant: SEJONG (multi-tenant 플랫폼)
