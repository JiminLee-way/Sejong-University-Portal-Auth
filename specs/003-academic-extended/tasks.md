# Tasks: 세종대 포털 추가 기능 확장

**Input**: Design documents from `/specs/003-academic-extended/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks omitted.

**Organization**: Tasks are grouped by user story. US1-US7 correspond to spec.md user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Add shared types and enums used across multiple user stories

- [x] T001 Add Day enum, TuitionStatus enum, and all new interfaces (TimetableSlot, TimetableReport, TuitionRecord, TuitionReport, GraduationRequirement, GraduationReport, BookLoan, BookLoanReport, SeatActionResult, AcademicEvent, AcademicCalendar, Notice, NoticeDetail, NoticeList) to src/types.ts
- [x] T002 Add new type exports (Day, TimetableSlot, TimetableReport, TuitionRecord, TuitionReport, GraduationRequirement, GraduationReport, BookLoan, BookLoanReport, SeatActionResult, AcademicEvent, AcademicCalendar, Notice, NoticeDetail, NoticeList, TuitionStatus) and toTimetableGrid to src/index.ts

---

## Phase 2: User Story 1 - 시간표 조회 (Priority: P1) MVP

**Goal**: 수강내역의 CORS_SCHE_TIME 필드를 파싱하여 과목별 플랫 리스트 + 요일×교시 그리드 변환 유틸리티 제공

**Independent Test**: `client.getTimetable()` 호출 시 TimetableReport 반환, `toTimetableGrid(slots)` 호출 시 요일×교시 맵 반환

### Implementation for User Story 1

- [x] T003 [US1] Create timetable parsing module — parseTimeLocation() regex parser and toTimetableGrid() utility in src/api/timetable.ts
- [x] T004 [US1] Add getTimetable(year?, semesterCode?) method to SejongClient in src/client.ts — internally calls getEnrollments then parses timeLocation fields
- [x] T005 [US1] Add POST /timetable route in src/server/routes.ts

**Checkpoint**: 시간표 조회가 라이브러리 + REST API로 동작. 기존 수강내역 API만 사용하므로 리서치 불필요.

---

## Phase 3: User Story 2 - 등록금 납부내역 조회 (Priority: P1)

**Goal**: 학기별 등록금 고지액, 장학금 감면액, 실납부액, 납부상태 조회

**Independent Test**: `client.getTuition()` 호출 시 TuitionReport 반환

### Implementation for User Story 2

- [x] T006 [US2] Playwright API 리서치 — 포털에서 등록금 메뉴 접속, Network 탭에서 PGM 키 + 엔드포인트 URL + 요청/응답 JSON 구조 캡처. 결과를 specs/003-academic-extended/research.md R2 섹션에 업데이트
- [x] T007 [US2] Implement fetchTuition() in src/api/tuition.ts — doOnload + doList 패턴, 응답 파싱하여 TuitionReport 반환
- [x] T008 [US2] Add getTuition() method to SejongClient in src/client.ts — initPage with discovered PGM key
- [x] T009 [US2] Add POST /tuition route in src/server/routes.ts

**Checkpoint**: 등록금 조회가 라이브러리 + REST API로 동작.

---

## Phase 4: User Story 3 - 졸업요건 충족도 조회 (Priority: P2)

**Goal**: 영역별(교양필수, 전공필수 등) 필요/이수/부족 학점 + 졸업 충족 상태 조회

**Independent Test**: `client.getGraduationRequirements()` 호출 시 GraduationReport 반환

### Implementation for User Story 3

- [x] T010 [US3] Playwright API 리서치 — 포털에서 졸업요건/졸업심사 메뉴 접속, Network 캡처로 PGM 키 + 엔드포인트 + 응답 구조 확인. 비학점 요건(외국어인증 등) 포함 여부 확인. 결과를 research.md R3 섹션에 업데이트
- [x] T011 [US3] Implement fetchGraduation() in src/api/graduation.ts — 포털 API 응답을 GraduationReport로 파싱
- [x] T012 [US3] Add getGraduationRequirements() method to SejongClient in src/client.ts
- [x] T013 [US3] Add POST /graduation route in src/server/routes.ts

**Checkpoint**: 졸업요건 조회가 라이브러리 + REST API로 동작.

---

## Phase 5: User Story 4 - 도서 대출내역 조회 (Priority: P2)

**Goal**: 현재 대출 중인 도서 목록(도서명, 대출일, 반납예정일, 연체여부) 조회

**Independent Test**: `client.getBookLoans()` 호출 시 BookLoanReport 반환

### Implementation for User Story 4

- [ ] T014 [US4] Playwright API 리서치 — (1) libseat.sejong.ac.kr에 대출 관련 페이지 존재 여부 확인 (2) 없으면 lib.sejong.ac.kr에 SSO 쿠키로 접근하여 대출 API 탐색 (3) 데이터 소스와 인증 방식 확정. 결과를 research.md R4 섹션에 업데이트
- [ ] T015 [US4] Implement fetchBookLoans() in src/api/bookloans.ts — 확정된 데이터 소스에서 대출 목록 가져와 BookLoanReport로 파싱
- [ ] T016 [US4] Add getBookLoans() method to SejongClient in src/client.ts — libseat 토큰 또는 새 인증 방식 사용
- [ ] T017 [US4] Add POST /library/loans route in src/server/routes.ts

**Checkpoint**: 도서 대출내역 조회가 라이브러리 + REST API로 동작.

---

## Phase 6: User Story 5 - 도서관 좌석 예약/연장/반납 (Priority: P2)

**Goal**: 프로그래밍 방식으로 좌석 예약, 사용시간 연장, 좌석 반납 수행

**Independent Test**: `client.reserveSeat(roomNo, seatNo)`, `client.extendSeat()`, `client.returnSeat()` 호출 시 SeatActionResult 반환

### Implementation for User Story 5

- [x] T018 [US5] Playwright API 리서치 — libseat 모바일 페이지에서 예약/연장/반납 버튼 클릭 시 form action URL, POST 파라미터, 응답 구조 캡처. 결과를 research.md R5 섹션에 업데이트
- [x] T019 [US5] Implement reserveSeat(), extendSeat(), returnSeat() in src/api/seatactions.ts — libseat POST 요청, 결과를 SeatActionResult로 파싱, 실패 시 구체적 에러 메시지 포함
- [x] T020 [US5] Add reserveSeat(roomNo, seatNo), extendSeat(), returnSeat() methods to SejongClient in src/client.ts — ensureLibseatToken() 재사용
- [x] T021 [P] [US5] Add POST /library/reserve, /library/extend, /library/return routes in src/server/routes.ts

**Checkpoint**: 좌석 예약/연장/반납이 라이브러리 + REST API로 동작.

---

## Phase 7: User Story 6 - 학사일정 조회 (Priority: P3)

**Goal**: 학기별 주요 학사일정(수강신청, 시험기간, 개강일 등) 목록 조회

**Independent Test**: `client.getAcademicCalendar()` 호출 시 AcademicCalendar 반환

### Implementation for User Story 6

- [x] T022 [US6] Playwright API 리서치 — 포털에서 학사일정 메뉴 접속, Network 캡처로 엔드포인트 + 응답 구조 확인. 결과를 research.md R6 섹션에 업데이트
- [x] T023 [US6] Implement fetchAcademicCalendar() in src/api/calendar.ts — 포털 API 응답을 AcademicCalendar로 파싱
- [x] T024 [US6] Add getAcademicCalendar(year?, semesterCode?) method to SejongClient in src/client.ts
- [x] T025 [US6] Add POST /academic-calendar route in src/server/routes.ts

**Checkpoint**: 학사일정 조회가 라이브러리 + REST API로 동작.

---

## Phase 8: User Story 7 - 공지사항 조회 (Priority: P3)

**Goal**: 공지사항 목록(카테고리 필터, 페이지네이션) + 개별 공지 본문 상세 조회

**Independent Test**: `client.getNotices()` 호출 시 NoticeList 반환, `client.getNoticeDetail(id)` 호출 시 NoticeDetail 반환

### Implementation for User Story 7

- [x] T026 [US7] Playwright API 리서치 — 포털에서 공지사항 메뉴 접속, 목록 + 상세 페이지의 Network 요청 캡처. 카테고리 코드, 페이지네이션 파라미터, 상세 조회 엔드포인트 확인. 결과를 research.md R7 섹션에 업데이트
- [x] T027 [US7] Implement fetchNotices() and fetchNoticeDetail() in src/api/notices.ts — 목록(카테고리 필터, 페이지) + 상세(본문) 2개 함수
- [x] T028 [US7] Add getNotices(options?) and getNoticeDetail(noticeId) methods to SejongClient in src/client.ts
- [x] T029 [US7] Add POST /notices and POST /notices/detail routes in src/server/routes.ts

**Checkpoint**: 공지사항 목록 + 상세 조회가 라이브러리 + REST API로 동작.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 통합 정리 및 전체 기능 검증

- [x] T030 Update src/index.ts — verify all new types, enums, toTimetableGrid, SejongClient methods are properly exported
- [x] T031 Extend POST /all route in src/server/routes.ts — 기존 grades+enrollments+scholarships에 timetable 추가
- [ ] T032 Run quickstart.md validation — specs/003-academic-extended/quickstart.md의 모든 코드 예시가 정상 동작하는지 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 시간표)**: Depends on Phase 1 — no Playwright 리서치 필요
- **Phase 3-8 (US2-US7)**: Each depends on Phase 1. 각 Phase 내 리서치 태스크가 구현에 선행
- **Phase 9 (Polish)**: Depends on all implemented user stories

### User Story Dependencies

- **US1 (시간표)**: Phase 1 완료 후 즉시 시작 가능. 다른 US에 의존 없음.
- **US2 (등록금)**: Phase 1 완료 후 시작 가능. US1과 병렬 가능.
- **US3 (졸업요건)**: Phase 1 완료 후 시작 가능. US1/US2와 병렬 가능.
- **US4 (도서대출)**: Phase 1 완료 후 시작 가능. 다른 US와 병렬 가능.
- **US5 (좌석액션)**: Phase 1 완료 후 시작 가능. 다른 US와 병렬 가능.
- **US6 (학사일정)**: Phase 1 완료 후 시작 가능. 다른 US와 병렬 가능.
- **US7 (공지사항)**: Phase 1 완료 후 시작 가능. 다른 US와 병렬 가능.

### Within Each User Story

- Playwright 리서치 → API 구현 → Client 메서드 → REST 라우트 (순차)
- US1만 리서치 불필요 (기존 API 재사용)

### Parallel Opportunities

- Phase 1의 T001, T002는 순차 (T002가 T001의 타입에 의존)
- US1은 리서치 없이 바로 구현 → 먼저 완료 가능
- US2-US7의 Playwright 리서치 태스크(T006, T010, T014, T018, T022, T026)는 모두 병렬 가능
- 각 US의 구현 태스크는 해당 US의 리서치 완료 후 순차 진행

---

## Parallel Example: Playwright 리서치 병렬 실행

```bash
# Phase 1 완료 후, 모든 Playwright 리서치를 병렬로 실행:
Task: "T006 [US2] Playwright 등록금 API 리서치"
Task: "T010 [US3] Playwright 졸업요건 API 리서치"
Task: "T014 [US4] Playwright 도서대출 API 리서치"
Task: "T018 [US5] Playwright 좌석액션 API 리서치"
Task: "T022 [US6] Playwright 학사일정 API 리서치"
Task: "T026 [US7] Playwright 공지사항 API 리서치"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: US1 시간표 (T003-T005)
3. **STOP and VALIDATE**: getTimetable() + toTimetableGrid() 동작 확인
4. 이 시점에서 이미 유용한 기능 제공

### Incremental Delivery

1. Phase 1 → Phase 2 (시간표) → MVP 완료
2. Playwright 리서치 일괄 실행 (T006, T010, T014, T018, T022, T026 병렬)
3. 리서치 결과에 따라 US2-US7 순차 또는 병렬 구현
4. 각 US 완료 시마다 독립적으로 검증 가능

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 각 US의 Playwright 리서치는 실제 포털 계정 필요 (SEJONG_USERNAME, SEJONG_PASSWORD 환경변수)
- US1(시간표)만 리서치 없이 즉시 구현 가능 — MVP로 적합
- 포털 API 응답 구조가 예상과 다를 경우 data-model.md의 해당 엔티티 필드를 실제 응답에 맞게 조정
- 모든 구현은 기존 패턴 따름: SessionInfo + addParam → fetch함수 → 파싱 → 타입 반환
