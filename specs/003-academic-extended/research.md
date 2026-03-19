# Research: 세종대 포털 추가 기능 확장

## R1: 시간표 데이터 소스 ✅ 구현 완료

**Decision**: 기존 수강내역 API의 `CORS_SCHE_TIME` 필드 파싱으로 시간표 생성.
**Status**: T003-T005 구현 완료.

## R2: 등록금 납부내역 API ✅ 확정

**Decision**: 포털 WebSquare API — `SucRgstMasterSelfQ` 컴포넌트

**Confirmed PGM Key**: `SELF_STUDSELF_SUB_40SCH_SUB_STUDSucRgstMasterSelfQ`
**XML Path**: `/sch/modules/suc/SucRgstMasterSelfGuideQ.xml`
**Menu Path**: 학부생학사정보 > 장학/등록 및 학생지원 > 장학이력 및 고지서출력 > 등록이력조회/고지서출력

**Endpoint Pattern**:
- `POST /sch/sch/suc/SucRgstMasterSelfQ/doOnload.do` (페이지 초기화)
- `POST /sch/sch/suc/SucRgstMasterSelfQ/doList.do` (데이터 조회)
- Body: `{ dm_search: { ORGN_CLSF_CD: "20", STUDENT_NO: userId } }`

**Note**: 리서치 시 `_SUBMIT_ERROR_` 반환은 이전 PGM과의 세션 충돌. 실제 사용 시 `initPage()`로 정상 전환 후 호출하면 정상 동작.

## R3: 졸업요건 충족도 API ✅ 확정

**Decision**: 포털 WebSquare API — `SuhJudgeSelf2Q` 컴포넌트

**Confirmed PGM Key**: `SELF_STUDSELF_SUB_20SCH_SUH_STUDSuhJudgeSelf2Q`
**XML Path**: `/sch/modules/suh/SuhJudgeSelf2Q.xml`
**Menu Path**: 학부생학사정보 > 학적/졸업 > 졸업요건자가진단 및 적부심사 > 졸업요건자가진단

**Endpoint Pattern**:
- `POST /sch/sch/suh/SuhJudgeSelf2Q/doOnload.do`
- `POST /sch/sch/suh/SuhJudgeSelf2Q/doList.do`
- Body: `{ dm_search: { ORGN_CLSF_CD: "20", STUDENT_NO: userId } }`

**Related**: 졸업인증/과목이수면제조회 (`SufGdtExamQ`) — `/sch/modules/suf/SufGdtExamQ.xml`

## R4: 도서 대출내역 ❌ 미확정

**Decision**: libseat 시스템에 도서 대출 API 없음 (loanList.php, myLoan.php 등 모두 404). 별도 도서관 시스템(lib.sejong.ac.kr) 필요하나, 이번 구현에서는 **스코프 제외**.

**Rationale**: libseat은 좌석 관리 전용 시스템. 도서 대출은 별도 OPAC/ILS 시스템으로 운영되며, SSO 연동 방식이 불확실. 추후 별도 리서치 필요.

## R5: 좌석 예약/연장/반납 API ✅ 확정

**Decision**: libseat 모바일 페이지의 JS 함수에서 POST 엔드포인트 및 파라미터 확인

**Confirmed Endpoints** (모두 `https://libseat.sejong.ac.kr/mobile/MA/`):

| Action | Endpoint | Parameters | Response |
|--------|----------|------------|----------|
| 좌석확정(예약) | `confirmSeat.php` | `userID`, `roomNo`, `seatNo` | XML `<root><item><resultCode/><resultMsg/></item></root>` |
| 좌석연장 | `extdSeat.php` | `userID`, `roomNo`, `seatNo` | XML 동일 형식 |
| 좌석반납 | `returnSeat.php` | `userID`, `roomNo`, `seatNo` | XML 동일 형식 |
| 스터디룸 취소 | `cancelSroom.php` | `userID`, `reserveNo` | XML 동일 형식 |

**Result Codes**: `resultCode=0` 성공, `resultCode=1` 실패 (resultMsg에 사유)
**Content-Type**: `application/x-www-form-urlencoded`
**Auth**: libseat token (기존 `acquireLibseatToken()` 재사용)

**JS Function Signatures** (from mySeat.php):
```js
function returnSeat() { /* userID, roomNo, seatNo → POST returnSeat.php */ }
function extdSeat()    { /* userID, roomNo, seatNo → POST extdSeat.php */ }
function confirmSeat() { /* userID, roomNo, seatNo → POST confirmSeat.php */ }
```

**Note**: 연장/확정은 "도서관 내에서만 가능" 체크가 있으나, 이는 JS 클라이언트 측 검증이므로 API 직접 호출 시 서버에서 별도 검증할 수 있음.

## R6: 학사일정 API ✅ 확정

**Decision**: 포털 WebSquare API — `SudBaseScheSelfServQ` 컴포넌트

**Confirmed PGM Key**: `SELF_STUDSELF_SUB_20SELF_MENU_10SudBaseScheSelfServQ`
**XML Path**: `/sch/modules/sud/SudBaseScheSelfServQ.xml`
**Menu Path**: 학부생학사정보 > 학적/졸업 > 내정보관리 및 증명서신청 > 학사일정조회

**Endpoint Pattern**:
- `POST /sch/sch/sud/SudBaseScheSelfServQ/doOnload.do`
- `POST /sch/sch/sud/SudBaseScheSelfServQ/doList.do`
- Body: `{ dm_search: { ORGN_CLSF_CD: "20", YEAR: "2026", SMT_CD: "10", STUDENT_NO: userId } }`

## R7: 공지사항 API ✅ 확정

**Decision**: 세종대 공개 웹사이트(www.sejong.ac.kr) HTML 파싱. 포털 인증 불필요.

**Base URL**: `https://www.sejong.ac.kr/kor/intro/`

**10개 카테고리**:
| No | URL | 카테고리 |
|----|-----|---------|
| 1 | notice1.do | 일반공지 |
| 2 | notice2.do | 입학공지 |
| 3 | notice3.do | 학사공지 |
| 4 | notice4.do | 국제교류(KR) |
| 5 | notice5.do | 국제교류(EN) |
| 6 | notice6.do | 취업 |
| 7 | notice7.do | 장학 |
| 8 | notice8.do | 채용/모집 |
| 9 | notice9.do | 법무감사 |
| 10 | notice10.do | 입찰공고 |

**List URL**: `notice{N}.do?article.offset={offset}&articleLimit={limit}`
**Detail URL**: `notice{N}.do?mode=view&articleNo={id}`

**HTML Parsing**:
- 목록: `<a href="...mode=view&articleNo={id}..." title="{title}">` 패턴
- 상세 본문: `<div class="fr-view">` 내부 HTML
- 날짜: `YYYY.MM.DD` 또는 `YYYY-MM-DD` 형식
- 페이지네이션: `article.offset` (0-indexed), `articleLimit` (기본 10)

## R8: 포털 메뉴 전체 구조

**발견된 전체 PGM Key 매핑** (level 4 leaf 메뉴만):

학적/졸업:
- 학사일정조회 → `SudBaseScheSelfServQ` (`/sch/modules/sud/`)
- 졸업요건자가진단 → `SuhJudgeSelf2Q` (`/sch/modules/suh/`)
- 졸업인증/과목이수면제조회 → `SufGdtExamQ` (`/sch/modules/suf/`)

수업/성적:
- 수강내역조회 → `SueReqLesnQ` (`/sch/modules/sue/`)
- 기이수성적조회 → `SugRecordQ` (`/sch/modules/sug/`)

장학/등록:
- 장학이력조회 → `SubSchoMasterOneQ` (`/sch/modules/sub/`)
- 등록이력조회 → `SucRgstMasterSelfQ` (`/sch/modules/suc/`)
