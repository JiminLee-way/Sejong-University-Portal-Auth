# Tasks: 도서관 좌석 + 모바일 학생증

## Phase 1: Setup

- [ ] T001 Install cheerio dependency: `npm install cheerio @types/cheerio`
- [ ] T002 Add new types to `src/types.ts`: ReadingRoom, MySeat, SeatStatus, SeatMapResponse, FacilityRoom, StudentCard

## Phase 2: Library Token + Room List (US1 MVP)

- [ ] T003 [US1] Implement library token acquisition in `src/api/library.ts`: SSO login → GET library.sejong.ac.kr/relation/seat → extract token from redirect URL
- [ ] T004 [US1] Implement room list parsing in `src/api/library.ts`: GET roomList.php?token=... → parse HTML with cheerio → extract room names and seat counts from `<h5>` tags
- [ ] T005 [US1] Wire `getLibraryRooms()` in `src/client.ts`
- [ ] T006 [US1] Add library exports to `src/index.ts`

## Phase 3: My Seat + Seat Map (US2, US3)

- [ ] T007 [US2] Implement my seat parsing in `src/api/library.ts`: GET seatMain.php?token=... → parse seat card area for room name, seat number, usage time, extension count
- [ ] T008 [US2] Wire `getMySeat()` in `src/client.ts`
- [ ] T009 [US3] Implement seat map parsing in `src/api/library.ts`: GET seatMap.php?param_room_no=N&token=... → parse seat elements, check `_over` CSS class for occupied status
- [ ] T010 [US3] Wire `getSeatMap(roomNo)` in `src/client.ts`

## Phase 4: Facilities + Student Card (US4, US5)

- [ ] T011 [US4] Implement facility room list in `src/api/library.ts`: GET sroomList/cinemaList/loungeList.php → parse HTML
- [ ] T012 [US4] Wire `getFacilityRooms(type)` in `src/client.ts`
- [ ] T013 [US5] Investigate student card API in `src/api/studentcard.ts`: dump doStudent.do full response to find card number fields, or explore portal pages for card API
- [ ] T014 [US5] Wire `getStudentCard()` in `src/client.ts`

## Phase 5: REST API + Polish

- [ ] T015 Add REST endpoints in `src/server/routes.ts`: POST /library/rooms, /library/my-seat, /library/seat-map, /student-card
- [ ] T016 Build + integration test
- [ ] T017 Commit + push to GitHub
