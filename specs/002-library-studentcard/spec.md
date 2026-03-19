# Feature Specification: 도서관 좌석 + 모바일 학생증

**Feature Branch**: `002-library-studentcard`
**Created**: 2026-03-19
**Status**: Draft
**Input**: 도서관 좌석 현황/예약 + 모바일 학생증 카드번호 조회

## User Scenarios & Testing

### User Story 1 — 열람실 좌석 현황 조회 (Priority: P1)

개발자가 세종대 도서관의 열람실별 좌석 사용 현황(사용 중/전체)을 조회한다. 8개 열람실의 실시간 잔여 좌석 수를 확인할 수 있다.

**Why this priority**: 좌석 현황은 로그인 없이도 조회 가능하며, 가장 많이 사용되는 기능이다.

**Independent Test**: 함수 호출 시 8개 열람실의 이름, 사용 중 좌석 수, 전체 좌석 수를 반환하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 도서관 시스템이 정상 운영 중, **When** 좌석 현황을 요청하면, **Then** 열람실별 이름, 사용 좌석 수, 전체 좌석 수, 사용률을 반환한다
2. **Given** 도서관 시스템이 점검 중, **When** 좌석 현황을 요청하면, **Then** 접속 불가 오류를 반환한다

---

### User Story 2 — 나의 좌석 조회 (Priority: P1)

로그인한 학생이 현재 본인이 배정받은 좌석 정보(열람실, 좌석번호, 사용시간, 연장 횟수)를 조회한다.

**Why this priority**: 개인 좌석 확인은 도서관 이용 중 가장 빈번하게 사용되는 기능이다.

**Independent Test**: 로그인 후 호출 시 현재 배정된 좌석 정보를 반환하거나, 배정된 좌석이 없으면 빈 결과를 반환한다.

**Acceptance Scenarios**:

1. **Given** 좌석이 배정된 학생, **When** 나의 좌석을 조회하면, **Then** 열람실명, 좌석번호, 사용시간, 연장 횟수를 반환한다
2. **Given** 좌석이 배정되지 않은 학생, **When** 나의 좌석을 조회하면, **Then** 빈 결과를 반환한다

---

### User Story 3 — 개별 열람실 좌석 배치도 조회 (Priority: P2)

특정 열람실의 전체 좌석 배치도와 각 좌석의 상태(빈 좌석, 사용 중, 예약됨)를 조회한다.

**Why this priority**: 좌석 선택/예약 전에 어떤 좌석이 비어있는지 확인해야 한다.

**Independent Test**: 열람실 번호를 지정하여 호출 시 해당 열람실의 좌석 목록과 각 상태를 반환한다.

**Acceptance Scenarios**:

1. **Given** 유효한 열람실 번호 (11-18), **When** 좌석 배치도를 요청하면, **Then** 해당 열람실의 모든 좌석 번호와 상태를 반환한다

---

### User Story 4 — 시설 예약 현황 조회 (Priority: P3)

스터디룸, 시네마룸, S-Lounge의 예약 가능 현황을 조회한다.

**Why this priority**: 열람실 좌석 대비 사용 빈도가 낮지만, 그룹 학습에 필수적인 기능이다.

**Independent Test**: 시설 유형별 호출 시 예약 가능한 시간대와 방 목록을 반환한다.

**Acceptance Scenarios**:

1. **Given** 로그인한 학생, **When** 스터디룸 목록을 요청하면, **Then** 예약 가능한 스터디룸 목록을 반환한다

---

### User Story 5 — 모바일 학생증 카드번호 조회 (Priority: P2)

로그인한 학생의 모바일 학생증 카드번호를 조회한다. 이 번호는 NFC 출입이나 바코드 인증에 사용된다.

**Why this priority**: 학생증 카드번호는 출입 시스템, 도서 대출 등에 활용 가능하다.

**Independent Test**: 로그인 후 호출 시 학생의 카드번호를 반환한다.

**Acceptance Scenarios**:

1. **Given** 모바일 학생증이 발급된 학생, **When** 카드번호를 요청하면, **Then** 카드번호 문자열을 반환한다
2. **Given** 모바일 학생증이 미발급 학생, **When** 카드번호를 요청하면, **Then** 미발급 상태를 반환한다

---

### Edge Cases

- libseat.sejong.ac.kr 토큰 만료 시 재발급 필요
- 도서관 운영 시간 외 좌석 시스템 비활성화 가능
- 학생증 카드번호가 포털의 특정 페이지에서만 제공될 수 있음
- library.sejong.ac.kr → libseat.sejong.ac.kr 리다이렉트 시 토큰 파라미터 추출 필요

## Requirements

### Functional Requirements

- **FR-001**: 시스템은 도서관 열람실별 좌석 현황(사용 중/전체)을 조회할 수 있어야 한다
- **FR-002**: 시스템은 로그인한 학생의 현재 배정 좌석 정보를 조회할 수 있어야 한다
- **FR-003**: 시스템은 특정 열람실의 좌석 배치도와 개별 좌석 상태를 조회할 수 있어야 한다
- **FR-004**: 시스템은 스터디룸/시네마룸/S-Lounge 예약 현황을 조회할 수 있어야 한다
- **FR-005**: 시스템은 모바일 학생증 카드번호를 조회할 수 있어야 한다
- **FR-006**: 시스템은 library.sejong.ac.kr SSO 인증 후 libseat 토큰을 자동으로 획득해야 한다
- **FR-007**: 기존 SejongClient에 새 메서드를 추가하여 일관된 인터페이스를 유지해야 한다
- **FR-008**: REST API에 새 엔드포인트를 추가해야 한다

### Key Entities

- **ReadingRoom**: 열람실 정보 — 번호(11-18), 이름, 사용 좌석 수, 전체 좌석 수, 사용률
- **MySeat**: 나의 좌석 — 열람실명, 좌석번호, 사용시간, 연장 횟수
- **SeatMap**: 좌석 배치도 — 좌석번호, 상태(빈 좌석/사용 중/예약됨)
- **FacilityRoom**: 시설 예약 — 시설 유형, 방 이름, 예약 가능 시간대
- **StudentCard**: 모바일 학생증 — 카드번호, 발급 상태

## Success Criteria

### Measurable Outcomes

- **SC-001**: 좌석 현황 조회 시 3초 이내에 8개 열람실 데이터를 반환한다
- **SC-002**: 나의 좌석 조회 시 3초 이내에 결과를 반환한다
- **SC-003**: 기존 성적/수강/장학 기능과 동일한 SejongClient 인터페이스로 사용 가능하다
- **SC-004**: 모바일 학생증 카드번호 조회 시 5초 이내에 결과를 반환한다

## Assumptions

- libseat.sejong.ac.kr은 PHP 기반 서버사이드 렌더링 — HTML 파싱이 필요할 수 있음
- 좌석 토큰은 library.sejong.ac.kr SSO 로그인 후 리다이렉트 URL의 `token` 파라미터로 전달됨
- 열람실 room_no: 11(제1A), 12(제1B), 13(제2), 14(제3), 15(제4A), 16(제4B), 17(제5), 18(제6)
- 모바일 학생증 카드번호는 포털 웹 페이지의 JS bridge 호출(`setAccessControlCardNo`)을 통해 전달되므로, 해당 API 엔드포인트를 별도로 찾아야 함
- 좌석 현황 조회는 토큰 없이도 가능할 수 있음 (공개 정보)
