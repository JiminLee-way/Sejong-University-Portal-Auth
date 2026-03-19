# Implementation Plan: Sejong Portal Auth (TypeScript)

**Branch**: `001-ts-portal-auth` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ts-portal-auth/spec.md`

## Summary

세종대학교 포털 SSO 인증 및 학사 데이터(성적, 수강내역, 장학이력) 조회를 위한 TypeScript 라이브러리 + Express REST API 서버. Python 프로토타입에서 검증된 WebSquare 세션 초기화 시퀀스 및 JSON API 엔드포인트를 그대로 이식한다. 각 데이터 조회는 포털의 동시 세션 제한 때문에 독립된 HTTP 세션에서 수행한다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: axios (HTTP client), express (REST server), zod (validation)
**Storage**: N/A (stateless — 데이터 저장 없음)
**Testing**: vitest
**Target Platform**: Node.js server
**Project Type**: library + web-service (dual: npm package + Express server)
**Performance Goals**: 각 API 호출 5초 이내 응답
**Constraints**: 포털 동시 세션 제한 → 기능별 독립 로그인 세션 필수, TLS SECLEVEL=1 필요
**Scale/Scope**: 단일 사용자 요청 처리 (동시 다수 사용자 각각 독립 세션)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution은 프로젝트 특정 규칙이 정의되지 않은 빈 템플릿 상태입니다. 위반 사항 없음, 게이트 통과.

## Project Structure

### Documentation (this feature)

```text
specs/001-ts-portal-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST API)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types.ts             # 타입 정의 (Grade, GradeReport, Enrollment 등)
├── errors.ts            # 커스텀 에러 클래스
├── client.ts            # SejongClient 핵심 클래스
├── session.ts           # SSO 로그인 + WebSquare 세션 초기화
├── api/
│   ├── grades.ts        # 성적 조회 API 호출 + 응답 파싱
│   ├── enrollments.ts   # 수강내역 조회
│   └── scholarships.ts  # 장학이력 조회
├── server/
│   ├── app.ts           # Express app 설정
│   └── routes.ts        # REST API 라우트
└── index.ts             # 라이브러리 공개 API (exports)

tests/
├── unit/
│   ├── types.test.ts
│   ├── errors.test.ts
│   └── session.test.ts
├── integration/
│   └── client.test.ts   # 실제 포털 연동 테스트
└── server/
    └── routes.test.ts   # Express 엔드포인트 테스트
```

**Structure Decision**: Single project, dual entry point. `src/index.ts`가 라이브러리 진입점, `src/server/app.ts`가 REST 서버 진입점. npm package로 배포 시 library만, 서버 실행 시 express 포함.

## Complexity Tracking

> No constitution violations to justify.
