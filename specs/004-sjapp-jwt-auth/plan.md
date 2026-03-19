# Implementation Plan: sjapp JWT 모바일 인증 전환

**Branch**: `004-sjapp-jwt-auth` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-sjapp-jwt-auth/spec.md`

## Summary

`session.ts`의 `freshLogin()` 함수를 sjapp.sejong.ac.kr JWT 인증 → SSO redirect → sjpt 세션 방식으로 교체. 기존 SessionInfo 인터페이스와 모든 API 코드는 변경 없이 유지. 핵심 변경은 `freshLogin()` 하나뿐.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: axios, axios-cookiejar-support, tough-cookie (기존 의존성 그대로)
**Storage**: .sejong-session.json (기존 세션 파일 호환)
**Testing**: vitest
**Target Platform**: Node.js 18+ (npm 패키지 + REST 서버)
**Project Type**: Library + REST API Server
**Performance Goals**: 로그인~데이터 반환 5초 이내
**Constraints**: sjapp.sejong.ac.kr 가용성에 의존
**Scale/Scope**: session.ts 1개 파일 수정

## Constitution Check

*GATE: Constitution 미설정. PASS.*

## Project Structure

### Source Code Changes

```text
src/
├── session.ts           # MODIFY: freshLogin() 교체 (sjapp JWT → SSO → sjpt)
├── client.ts            # (변경 없음)
├── types.ts             # (변경 없음)
├── errors.ts            # (변경 없음)
├── index.ts             # (변경 없음)
├── api/                 # (전체 변경 없음)
└── server/              # (전체 변경 없음)
```

**Structure Decision**: session.ts의 `freshLogin()` 함수만 교체. SessionInfo 인터페이스 동일 유지로 다운스트림 코드 영향 0.

## Implementation: freshLogin() 교체

**기존 흐름** (portal.sejong.ac.kr):
```
GET portal.sejong.ac.kr/jsp/login/loginSSL.jsp → 쿠키
POST portal.sejong.ac.kr/jsp/login/login_action.jsp → ssotoken
GET sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do → sjpt 세션
```

**새 흐름** (sjapp.sejong.ac.kr):
```
POST sjapp.sejong.ac.kr/api/auth/login → JWT accessToken
POST sjapp.sejong.ac.kr/api/secureapi/sso/external-link → redirect URL
GET redirect URL → ssotoken 쿠키
GET sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do → sjpt 세션
```

**변경 포인트**: `freshLogin()` 함수 본문만 교체. 반환 타입(SessionInfo) 동일.

## Complexity Tracking

> 위반 사항 없음. 1개 함수 교체.
