# Implementation Plan: 세종대 포털 추가 기능 확장

**Branch**: `003-academic-extended` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-academic-extended/spec.md`

## Summary

기존 SejongClient에 7개 기능 추가: 시간표, 등록금, 졸업요건, 도서대출, 좌석액션, 학사일정, 공지사항. 기존 세션/인증 인프라를 재사용하며, 각 기능별로 API 모듈 + 타입 + REST 라우트를 추가하는 패턴. 일부 기능(등록금, 졸업요건, 학사일정, 공지사항)은 Playwright를 이용한 API 리서치가 선행되어야 함.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: axios, axios-cookiejar-support, tough-cookie, cheerio, express, zod
**Storage**: N/A (무상태, 포털 프록시)
**Testing**: vitest
**Target Platform**: Node.js 18+ (npm 패키지 + REST 서버)
**Project Type**: Library + REST API Server
**Performance Goals**: 각 조회 5초 이내, 좌석 액션 3초 이내
**Constraints**: 포털 동시 세션 제한, TLS 호환성, API 엔드포인트 미확정(리서치 필요)
**Scale/Scope**: 단일 사용자 동기 요청

## Constitution Check

*GATE: Constitution은 기본 템플릿 상태(미설정)로, 프로젝트 특화 제약 없음. PASS.*

## Project Structure

### Documentation (this feature)

```text
specs/003-academic-extended/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: API research
├── data-model.md        # Phase 1: Data model
├── quickstart.md        # Phase 1: Usage examples
├── contracts/
│   ├── library-api.md   # Phase 1: Library API contract
│   └── rest-api.md      # Phase 1: REST API contract
└── tasks.md             # Phase 2: Task list (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types.ts             # MODIFY: 새 타입/인터페이스 추가
├── client.ts            # MODIFY: 새 메서드 추가
├── index.ts             # MODIFY: 새 export 추가
├── errors.ts            # (변경 없음, 기존 에러 재사용)
├── session.ts           # (변경 없음)
├── api/
│   ├── timetable.ts     # NEW: 시간표 파싱 (enrollments 재사용)
│   ├── tuition.ts       # NEW: 등록금 조회
│   ├── graduation.ts    # NEW: 졸업요건 조회
│   ├── bookloans.ts     # NEW: 도서 대출 조회
│   ├── seatactions.ts   # NEW: 좌석 예약/연장/반납
│   ├── calendar.ts      # NEW: 학사일정 조회
│   ├── notices.ts       # NEW: 공지사항 조회
│   ├── library.ts       # (기존, 변경 없음)
│   ├── grades.ts        # (기존, 변경 없음)
│   ├── enrollments.ts   # (기존, 변경 없음)
│   ├── scholarships.ts  # (기존, 변경 없음)
│   └── studentcard.ts   # (기존, 변경 없음)
└── server/
    ├── app.ts           # (변경 없음)
    └── routes.ts        # MODIFY: 새 라우트 추가

tests/
└── (기존 테스트 + 새 테스트)
```

**Structure Decision**: 기존 프로젝트 구조 유지. `src/api/` 하위에 기능별 모듈 추가, `src/types.ts`에 타입 통합. 기존 패턴(SessionInfo + addParam → fetch 함수 → 파싱)을 동일하게 따름.

## Implementation Phases

### Phase A: 시간표 (P1, 리서치 불필요)

기존 enrollments API 재사용. `CORS_SCHE_TIME` 파싱 로직 + 그리드 변환 유틸리티.

**파일**: `src/api/timetable.ts`, `src/types.ts`, `src/client.ts`, `src/index.ts`, `src/server/routes.ts`

**핵심 로직**: `CORS_SCHE_TIME` 문자열 파싱
- 정규식: `/([월화수목금토])(\d+(?:,\d+)*)/g`
- 장소: 요일/교시 패턴 이후의 텍스트

### Phase B: 좌석 예약/연장/반납 (P2, Playwright 리서치)

기존 libseat 토큰 재사용. POST 엔드포인트 발견 필요.

**리서치**: Playwright로 libseat 모바일 페이지에서 예약/연장/반납 form action URL 캡처
**파일**: `src/api/seatactions.ts`, `src/types.ts`, `src/client.ts`, `src/server/routes.ts`

### Phase C: 등록금 + 졸업요건 (P1+P2, Playwright 리서치)

포털 WebSquare API. PGM 키 발견 필요.

**리서치**: Playwright로 포털의 등록금/졸업요건 메뉴 접속 → Network 캡처 → PGM 키/엔드포인트 확인
**파일**: `src/api/tuition.ts`, `src/api/graduation.ts`, `src/types.ts`, `src/client.ts`, `src/server/routes.ts`

### Phase D: 도서 대출 (P2, Playwright 리서치)

데이터 소스 확정 필요 (libseat vs lib.sejong.ac.kr).

**리서치**: libseat 하위 페이지 탐색 → 없으면 lib.sejong.ac.kr SSO 접근 시도
**파일**: `src/api/bookloans.ts`, `src/types.ts`, `src/client.ts`, `src/server/routes.ts`

### Phase E: 학사일정 + 공지사항 (P3, Playwright 리서치)

포털 WebSquare API. 공지사항은 목록 + 상세 2개 엔드포인트.

**리서치**: Playwright로 학사일정/공지사항 메뉴 접속 → Network 캡처
**파일**: `src/api/calendar.ts`, `src/api/notices.ts`, `src/types.ts`, `src/client.ts`, `src/server/routes.ts`

### Phase F: 통합 + export 정리

`src/index.ts` export 추가, REST 라우트 통합, `/all` 엔드포인트 확장.

## Complexity Tracking

> 위반 사항 없음. 기존 패턴을 충실히 따르며 새 추상화나 의존성 추가 없음.
