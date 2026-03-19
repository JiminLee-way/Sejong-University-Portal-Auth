# Implementation Plan: sjapp 네이티브 REST API 전면 전환

**Branch**: `005-sjapp-native-api` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)

## Summary

sjpt WebSquare 기반 코드를 전면 제거하고 sjapp.sejong.ac.kr의 네이티브 JSON REST API로 전체 재구축. 기존 세션 관리(session.ts), HTML 파싱(cheerio), WebSquare 초기화 코드를 모두 제거. 순수 axios + JWT 기반 HTTP 클라이언트로 단순화. 도서관 좌석(libseat)만 기존 유지.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: axios (HTTP), express (REST 서버) — tough-cookie/cheerio 제거 가능
**Storage**: N/A (무상태)
**Testing**: vitest
**Target Platform**: Node.js 18+ (npm 패키지 + REST 서버)
**Project Type**: Library + REST API Server
**Performance Goals**: 모든 API 2초 이내 (기존 5초 대비 60% 단축)
**Constraints**: sjapp.sejong.ac.kr 가용성 의존
**Scale/Scope**: 전체 재구축 (src/ 전체)

## Constitution Check

*GATE: Constitution 미설정. PASS.*

## Project Structure

### Source Code (새 구조)

```text
src/
├── index.ts              # REWRITE: 새 export
├── client.ts             # REWRITE: sjapp 기반 SejongClient
├── http.ts               # NEW: axios 인스턴스 + JWT 인터셉터
├── types.ts              # REWRITE: sjapp 응답 타입
├── errors.ts             # MODIFY: 에러 타입 유지/확장
├── api/
│   ├── auth.ts           # NEW: login, logout, refresh, me
│   ├── grades.ts         # REWRITE: sjapp grade-inquiry API
│   ├── notices.ts        # REWRITE: sjapp university-notice API
│   ├── news.ts           # NEW: sjapp sejong-news API
│   ├── feeds.ts          # NEW: sjapp feeds API
│   ├── schedules.ts      # NEW: sjapp schedules CRUD
│   ├── qna.ts            # NEW: sjapp qna CRUD
│   ├── staff.ts          # NEW: sjapp adm/staff API
│   ├── notifications.ts  # NEW: sjapp UMS API
│   └── library.ts        # KEEP: 기존 libseat 유지
├── server/
│   ├── app.ts            # KEEP: Express 서버
│   └── routes.ts         # REWRITE: 새 라우트
├── session.ts            # DELETE: WebSquare 세션 불필요
├── api/enrollments.ts    # DELETE: sjapp에 없음 (성적에 포함)
├── api/scholarships.ts   # DELETE: sjapp에 없음
├── api/tuition.ts        # DELETE: sjapp에 없음
├── api/graduation.ts     # DELETE: sjapp에 없음
├── api/calendar.ts       # DELETE: sjapp에 없음
├── api/timetable.ts      # DELETE: sjapp에 없음
├── api/studentcard.ts    # DELETE: login 응답에 포함
└── api/seatactions.ts    # KEEP: 기존 libseat 좌석 액션 유지
```

**제거되는 의존성**: `axios-cookiejar-support`, `tough-cookie` (세션 쿠키 불필요)
**유지되는 의존성**: `axios`, `express`, `cheerio` (libseat HTML 파싱), `vitest`

## Implementation Phases

### Phase 1: 핵심 인프라 (http.ts + auth + types)
- `http.ts`: axios 인스턴스 생성, JWT Bearer 인터셉터, 토큰 자동 갱신
- `api/auth.ts`: login, logout, refresh, me
- `types.ts`: sjapp 응답 타입 전체 정의
- `errors.ts`: 기존 에러 타입 유지

### Phase 2: 성적 + 공지 (P1)
- `api/grades.ts`: all, current, semester
- `api/notices.ts`: list, detail, latest (8 카테고리)

### Phase 3: 뉴스 + 피드 + 일정 + 문의 + 교직원 + 알림 (P2-P3)
- `api/news.ts`, `api/feeds.ts`, `api/schedules.ts`, `api/qna.ts`, `api/staff.ts`, `api/notifications.ts`

### Phase 4: SejongClient + Routes 재작성
- `client.ts`: 모든 API 메서드 통합
- `server/routes.ts`: 새 REST 라우트
- `index.ts`: 새 export

### Phase 5: 정리
- 기존 WebSquare 코드 삭제
- 불필요한 의존성 제거
- README 업데이트

## Complexity Tracking

> 전면 재작성이지만, 각 모듈이 단순한 HTTP GET/POST → 타입 변환이므로 개별 복잡도는 낮음.
