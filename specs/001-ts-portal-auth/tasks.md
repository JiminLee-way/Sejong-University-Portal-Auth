# Tasks: Sejong Portal Auth (TypeScript)

**Input**: Design documents from `/specs/001-ts-portal-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted. Integration test included for validation.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)

---

## Phase 1: Setup

**Purpose**: Project initialization and TypeScript/Node.js tooling

- [x] T001 Initialize Node.js project with `npm init` and create `package.json` with name "sejong-auth", dependencies (axios, express, zod, tough-cookie, axios-cookiejar-support), devDependencies (typescript, vitest, @types/express, @types/tough-cookie, tsx)
- [x] T002 Create `tsconfig.json` with strict mode, ESM output, target ES2022, outDir dist/, rootDir src/
- [x] T003 [P] Create directory structure: `src/`, `src/api/`, `src/server/`, `tests/unit/`, `tests/integration/`, `tests/server/`
- [x] T004 [P] Add npm scripts to package.json: `build`, `dev`, `test`, `test:integration`, `start`

**Checkpoint**: `npm run build` compiles with no errors (empty project)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, errors, and session logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Define Semester enum and all data types (Grade, CreditSummary, GradeReport, Enrollment, EnrollmentReport, Scholarship, ScholarshipReport) in `src/types.ts` per data-model.md
- [x] T006 [P] Implement custom error classes (SejongAuthError, LoginFailedError, SessionExpiredError, NetworkError, PortalError, ParseError) in `src/errors.ts`
- [x] T007 Implement SSO login flow in `src/session.ts`: createSession() function that performs GET loginSSL.jsp → POST login_action.jsp → extract result code → follow JS redirect → return cookie jar. Include User-Agent/Referer headers, TLS bypass via https.Agent, login result code parsing (OK/erridpwd/pwdNeedChg) per research.md R1
- [x] T008 Implement WebSquare session initialization in `src/session.ts`: initWebSquare() function that performs the 7-step init sequence (initUserInfo → doListUserMyMenuList → getRunTimeSystem → doCoMessageList → doListUserMenuListTop → doNoticeCheck → doListUserMenuListLeft) and returns session metadata (userId, runningSejong, loginDt) per research.md R2
- [x] T009 Implement page initialization helper in `src/session.ts`: initPage() function that calls initUserInfo + initUserRole with pgmKey and returns addParam string. Include addParam encoding (base64(encodeURIComponent(JSON))) per research.md R4
- [x] T010 Implement SejongClient class skeleton in `src/client.ts`: constructor, login() method (stores credentials), getGrades/getEnrollments/getScholarships method stubs that throw SessionExpiredError if not logged in

**Checkpoint**: `SejongClient.login()` stores credentials, session.ts functions compile, error classes importable

---

## Phase 3: User Story 1 — 기이수 성적 조회 (Priority: P1) 🎯 MVP

**Goal**: 학번/비밀번호로 전체 기이수 성적 데이터(과목별 성적 + GPA + 학점 집계) 조회

**Independent Test**: `await client.getGrades()` 호출 시 GradeReport 반환 확인

### Implementation

- [x] T011 [US1] Implement grade API call in `src/api/grades.ts`: fetchGrades() function that calls SchStudentBaseInfo/doStudent.do (학생정보) and SugRecordQ/doList.do (성적목록) with correct request bodies and addParam per research.md R3
- [x] T012 [US1] Implement grade response parser in `src/api/grades.ts`: parseGradeResponse() that maps portal JSON keys (dl_main, dl_summary, CURI_NO, CURI_NM, GRADE, MRKS, AVG_MRKS, etc.) to GradeReport type per data-model.md field mappings
- [x] T013 [US1] Wire getGrades() in `src/client.ts`: create independent HTTP session → SSO login → WebSquare init → page init (pgmKey: SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ) → call fetchGrades → return GradeReport
- [x] T014 [US1] Add grade exports to `src/index.ts`: export SejongClient, all types, all errors

**Checkpoint**: `client.getGrades()` returns real GradeReport with 15+ courses and GPA

---

## Phase 4: User Story 2 — 수강내역 조회 (Priority: P2)

**Goal**: 특정 학기 또는 최신 학기의 수강 과목 목록 조회

**Independent Test**: `await client.getEnrollments()` 호출 시 EnrollmentReport 반환 확인

### Implementation

- [x] T015 [US2] Implement enrollment API call in `src/api/enrollments.ts`: fetchEnrollments() that calls SueReqLesnQ/doYearsmt.do (학기목록) and SueReqLesnQ/doList.do (수강목록) with year/semesterCode parameters
- [x] T016 [US2] Implement enrollment response parser in `src/api/enrollments.ts`: parseEnrollmentResponse() mapping dl_yearSmt and dl_main to EnrollmentReport
- [x] T017 [US2] Wire getEnrollments(year?, semesterCode?) in `src/client.ts`: independent session → login → init → page init (pgmKey: SELF_STUDSELF_SUB_30SELF_MENU_10SueReqLesnQ) → fetchEnrollments → return EnrollmentReport

**Checkpoint**: `client.getEnrollments()` returns current semester courses

---

## Phase 5: User Story 3 — 장학이력 조회 (Priority: P3)

**Goal**: 전체 장학금 수혜 이력 조회

**Independent Test**: `await client.getScholarships()` 호출 시 ScholarshipReport 반환 확인

### Implementation

- [x] T018 [US3] Implement scholarship API call in `src/api/scholarships.ts`: fetchScholarships() that calls SubSchoMasterOneQ/doList.do
- [x] T019 [US3] Implement scholarship response parser in `src/api/scholarships.ts`: parseScholarshipResponse() mapping dl_mainList to ScholarshipReport (handle null SCHO_CD_NM gracefully)
- [x] T020 [US3] Wire getScholarships() in `src/client.ts`: independent session → login → init → page init (pgmKey: SELF_STUDSELF_SUB_40SCH_SUB_STUDSubSchoMasterOneQ) → fetchScholarships → return ScholarshipReport

**Checkpoint**: `client.getScholarships()` returns scholarship list with amounts

---

## Phase 6: User Story 4 — REST API 서버 (Priority: P2)

**Goal**: Express REST API로 모든 기능을 HTTP로 제공

**Independent Test**: `curl -X POST localhost:3000/api/v1/grades` 호출 시 JSON 응답

### Implementation

- [x] T021 [P] [US4] Implement Express app setup in `src/server/app.ts`: create Express app with JSON body parser, CORS, error handler middleware
- [x] T022 [US4] Implement REST routes in `src/server/routes.ts`: POST /api/v1/grades, POST /api/v1/enrollments, POST /api/v1/scholarships per contracts/rest-api.md — each route creates SejongClient, calls login+getXxx, returns JSON or appropriate error status (401/500/502)
- [x] T023 [US4] Add server entry point in `src/server/app.ts`: listen on configurable port (default 3000), add `bin` field to package.json for `npx sejong-auth-server`

**Checkpoint**: `curl` to all 3 endpoints returns valid JSON responses

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, validation, documentation

- [x] T024 [P] Create integration test in `tests/integration/client.test.ts`: test all 3 features sequentially with real portal credentials (skip if SEJONG_USERNAME not set)
- [x] T025 [P] Update README.md with TypeScript examples, API docs, development instructions per quickstart.md
- [x] T026 Configure package.json for npm publish: main/types/exports fields, files whitelist, bin entry
- [x] T027 Run full validation: `npm run build` succeeds, integration test passes, REST server responds correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **User Stories (Phase 3-6)**: All depend on Phase 2 completion
  - US1 (grades), US2 (enrollments), US3 (scholarships) can proceed in parallel
  - US4 (REST API) depends on at least US1 being complete
- **Polish (Phase 7)**: Depends on all stories being complete

### User Story Dependencies

- **US1 (P1 — Grades)**: After Phase 2 — no other story dependencies
- **US2 (P2 — Enrollments)**: After Phase 2 — independent of US1
- **US3 (P3 — Scholarships)**: After Phase 2 — independent of US1/US2
- **US4 (P2 — REST API)**: After Phase 2 + at least US1 complete (needs working SejongClient methods)

### Within Each User Story

- API call function before response parser
- Parser before client wiring
- Client wiring completes the story

### Parallel Opportunities

- T003/T004 can run in parallel (setup)
- T005/T006 can run in parallel (types + errors)
- T011/T015/T018 can run in parallel across stories (after Phase 2)
- T021 can run in parallel with any US1-3 task

---

## Parallel Example: After Phase 2

```
# Agent A: User Story 1 (Grades)
Task: T011 — fetchGrades() in src/api/grades.ts
Task: T012 — parseGradeResponse() in src/api/grades.ts
Task: T013 — wire getGrades() in src/client.ts

# Agent B: User Story 3 (Scholarships) — can run simultaneously
Task: T018 — fetchScholarships() in src/api/scholarships.ts
Task: T019 — parseScholarshipResponse() in src/api/scholarships.ts
Task: T020 — wire getScholarships() in src/client.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup → `npm run build` works
2. Phase 2: Foundational → types, errors, session logic
3. Phase 3: US1 (Grades) → `client.getGrades()` returns real data
4. **STOP and VALIDATE**: Integration test with real credentials
5. This is a working, shippable MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. + US1 (Grades) → MVP! Test + deploy
3. + US2 (Enrollments) → Test independently
4. + US3 (Scholarships) → Test independently
5. + US4 (REST API) → Full product
6. + Polish → Production ready

---

## Notes

- Each `getXxx()` method creates its own HTTP session (portal constraint)
- TLS bypass required: use `https.Agent({ rejectUnauthorized: false })` per request
- Portal login rate limit: avoid rapid successive logins in tests
- addParam encoding: `base64(encodeURIComponent(JSON.stringify(data)))`
- Commit after each task or logical group
