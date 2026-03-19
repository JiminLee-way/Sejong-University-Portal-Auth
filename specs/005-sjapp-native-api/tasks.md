# Tasks: sjapp 네이티브 REST API 전면 전환

**Input**: Design documents from `/specs/005-sjapp-native-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks omitted.

**Organization**: Tasks grouped by user story. US1-US8 correspond to spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup

**Purpose**: 새 인프라 구축 (기존 WebSquare 코드와 공존, 마지막에 제거)

- [x] T001 Define all sjapp response types (ApiResponse, PagedResponse, AuthToken, UserProfile, GradeSemester, GradeCourse, GradeOverallSummary, SemesterSummary, Notice, News, Feed, Schedule, QnA, QnACategory, Staff, Notification, NotificationSettings) in src/types.ts — 기존 타입은 유지하고 새 타입 추가
- [x] T002 Create HTTP client module with JWT Bearer interceptor, auto-refresh on 401, base URL config in src/http.ts

---

## Phase 2: User Story 8 - 인증 관리 (Priority: P1)

**Goal**: JWT 기반 login, logout, refresh, me

**Independent Test**: login → me → refresh → logout 흐름이 정상 동작하는지 확인

### Implementation

- [x] T003 [US8] Implement login(), logout(), refreshToken(), getProfile() in src/api/auth.ts — POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/me
- [x] T004 [US8] Add auth routes (POST /auth/login, GET /auth/me, POST /auth/refresh, POST /auth/logout) in src/server/routes.ts

**Checkpoint**: JWT 인증 흐름 완전 동작

---

## Phase 3: User Story 1 - 성적 조회 (Priority: P1)

**Goal**: 전체/당학기/학기별 성적을 sjapp JSON API로 조회

**Independent Test**: login 후 getGrades() 호출 시 학기별 성적과 GPA 반환

### Implementation

- [x] T005 [US1] Implement getAll(), getCurrent(), getSemester(year, smtCd) in src/api/grades.ts — GET /api/secureapi/grade-inquiry/all, /current, /semester
- [x] T006 [US1] Add grade routes (GET /grades, GET /grades/current, GET /grades/semester) in src/server/routes.ts

**Checkpoint**: 성적 조회 3종 정상 동작

---

## Phase 4: User Story 2 - 공지사항 (Priority: P1)

**Goal**: 8개 카테고리 공지 목록 + 상세 + 최신

**Independent Test**: getNotices('academic') 호출 시 학사공지 목록 반환

### Implementation

- [x] T007 [P] [US2] Implement getList(category, page, size), getDetail(category, id), getLatest(type, size) in src/api/notices.ts — GET /api/publicapi/university-notice/*
- [x] T008 [US2] Add notice routes (GET /notices/:category, GET /notices/:category/:id, GET /notices/latest) in src/server/routes.ts

**Checkpoint**: 공지사항 8개 카테고리 + 상세 + 최신 정상 동작

---

## Phase 5: User Story 3 - 세종뉴스 및 피드 (Priority: P2)

**Goal**: 뉴스 5종 + 피드 3종 목록/상세 조회

**Independent Test**: getNews('news') 호출 시 교내뉴스 목록 반환

### Implementation

- [x] T009 [P] [US3] Implement getNewsList(type, page, size), getNewsDetail(type, id) in src/api/news.ts — GET /api/publicapi/sejong-news/*
- [x] T010 [P] [US3] Implement getFeedList(type, page, size) in src/api/feeds.ts — GET /api/publicapi/feeds/*
- [x] T011 [US3] Add news and feed routes (GET /news/:type, GET /news/:type/:id, GET /feeds/:type) in src/server/routes.ts

**Checkpoint**: 뉴스 5종 + 피드 3종 정상 동작

---

## Phase 6: User Story 4 - 일정 관리 (Priority: P2)

**Goal**: 일정 CRUD + 카테고리/태그/반복일정

**Independent Test**: createSchedule → getSchedules → updateSchedule → deleteSchedule 흐름 정상 동작

### Implementation

- [x] T012 [P] [US4] Implement list(), create(), update(id), delete(id), complete(id), getCategories(), getTags(), createRecurring(), importBatch() in src/api/schedules.ts — /api/secureapi/schedules/*
- [x] T013 [US4] Add schedule routes (GET/POST /schedules, PUT/DELETE /schedules/:id, POST /schedules/:id/complete, GET /schedules/categories, GET /schedules/tags) in src/server/routes.ts

**Checkpoint**: 일정 CRUD 전체 흐름 정상 동작

---

## Phase 7: User Story 5 - 문의 QnA (Priority: P2)

**Goal**: 1:1 문의 CRUD + 카테고리 조회

**Independent Test**: createQnA → getMyQnAs → getQnADetail 흐름 정상 동작

### Implementation

- [x] T014 [P] [US5] Implement getCategories(), getMyList(), create(), getDetail(id), update(id), delete(id) in src/api/qna.ts — /api/secureapi/qna/*, /api/publicapi/qna/categories
- [x] T015 [US5] Add QnA routes (GET /qna/categories, GET /qna/my, POST /qna, GET/PUT/DELETE /qna/:id) in src/server/routes.ts

**Checkpoint**: 문의 CRUD + 카테고리 정상 동작

---

## Phase 8: User Story 6 - 교직원 검색 (Priority: P3)

**Goal**: 교직원 목록 검색

**Independent Test**: searchStaff() 호출 시 이름/학과/연락처 목록 반환

### Implementation

- [x] T016 [P] [US6] Implement search() in src/api/staff.ts — GET /api/secureapi/adm/staff
- [x] T017 [US6] Add staff route (GET /staff) in src/server/routes.ts

**Checkpoint**: 교직원 검색 정상 동작

---

## Phase 9: User Story 7 - 알림 UMS (Priority: P3)

**Goal**: 알림 수신함, 읽음 처리, 삭제, 설정 관리

**Independent Test**: getInbox → getUnreadCount → markAsRead 흐름 정상 동작

### Implementation

- [x] T018 [P] [US7] Implement getInbox(), getUnreadCount(), markAsRead(id), markAllAsRead(), deleteNotification(id), getSettings(), updateSettings() in src/api/notifications.ts — /api/v1/ums/*
- [x] T019 [US7] Add notification routes (GET /notifications, GET /notifications/unread-count, POST /notifications/:id/read, POST /notifications/read-all, DELETE /notifications/:id, GET/PUT /notifications/settings) in src/server/routes.ts

**Checkpoint**: 알림 전체 흐름 정상 동작

---

## Phase 10: 통합 - SejongClient 재작성

**Purpose**: 모든 API를 통합하는 SejongClient 재작성

- [x] T020 Rewrite SejongClient in src/client.ts — 모든 새 API 메서드 통합 (auth, grades, notices, news, feeds, schedules, qna, staff, notifications) + 기존 library 메서드 유지
- [x] T021 Update src/index.ts — 새 타입/메서드 export, 기존 WebSquare 전용 export 제거

**Checkpoint**: 라이브러리로 모든 기능 호출 가능

---

## Phase 11: Polish & Cleanup

**Purpose**: 기존 WebSquare 코드 제거, 정리

- [x] T022 Delete deprecated files — src/session.ts, src/api/enrollments.ts, src/api/scholarships.ts, src/api/tuition.ts, src/api/graduation.ts, src/api/calendar.ts, src/api/timetable.ts, src/api/studentcard.ts
- [x] T023 Remove unused dependencies — package.json에서 axios-cookiejar-support, tough-cookie 제거 (cheerio는 libseat에서 사용하므로 유지)
- [x] T024 Update README.md — sjapp 네이티브 API 기반으로 전체 재작성, 모든 응답 예시 포함

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (US8 인증)**: Depends on Phase 1 — 모든 보호 API의 전제 조건
- **Phase 3 (US1 성적)**: Depends on Phase 2
- **Phase 4 (US2 공지)**: Depends on Phase 1 only (공개 API, 인증 불필요)
- **Phase 5 (US3 뉴스/피드)**: Depends on Phase 1 only (공개 API)
- **Phase 6-9 (US4-US7)**: Depends on Phase 2
- **Phase 10 (통합)**: Depends on Phase 2-9
- **Phase 11 (정리)**: Depends on Phase 10

### Parallel Opportunities

- Phase 3 (성적) + Phase 4 (공지) + Phase 5 (뉴스/피드) — 병렬 가능
- Phase 6 (일정) + Phase 7 (문의) + Phase 8 (교직원) + Phase 9 (알림) — 병렬 가능
- T007, T009, T010, T012, T014, T016, T018 — 모두 다른 파일, 병렬 가능

---

## Parallel Example: P2-P3 기능 병렬 실행

```bash
# Phase 2 (인증) 완료 후, 모든 기능 병렬 구현:
Task: "T005 [US1] grades.ts"
Task: "T007 [US2] notices.ts"
Task: "T009 [US3] news.ts"
Task: "T010 [US3] feeds.ts"
Task: "T012 [US4] schedules.ts"
Task: "T014 [US5] qna.ts"
Task: "T016 [US6] staff.ts"
Task: "T018 [US7] notifications.ts"
```

---

## Implementation Strategy

### MVP First (US8 + US1)

1. Phase 1: Setup (T001-T002)
2. Phase 2: 인증 (T003-T004)
3. Phase 3: 성적 (T005-T006)
4. **STOP**: login + getGrades 동작 확인 → MVP

### Incremental Delivery

1. MVP (인증 + 성적) → 배포
2. 공지 + 뉴스/피드 추가 (공개 API) → 배포
3. 일정 + 문의 + 교직원 + 알림 추가 → 배포
4. 통합 + 정리 → 최종 배포

---

## Notes

- [P] tasks = different files, no dependencies
- 공개 API (notices, news, feeds)는 인증 없이 호출 가능 → Phase 1 완료 후 바로 구현 가능
- 기존 도서관 좌석 기능(library.ts, seatactions.ts)은 그대로 유지
- Phase 11에서 기존 WebSquare 코드를 삭제하므로, 그 전까지는 기존 코드와 공존
