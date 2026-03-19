# Research: 도서관 좌석 + 모바일 학생증

## R1: libseat.sejong.ac.kr 인증 Flow

**Verified Flow**:
1. SSO 로그인 (기존 portal.sejong.ac.kr flow)
2. `GET library.sejong.ac.kr/relation/seat` — SSO 쿠키로 접근
3. 서버가 `libseat.sejong.ac.kr/mobile/MA/seatMain.php?token=...`으로 리다이렉트
4. `token` 파라미터가 이후 모든 API 호출에 필요

**Token**: Base64 인코딩된 문자열 (예: `YRIvn89KejEFefQpQYeUwAbSNj6CyhnRU8czs5pHhCY=`)
**Token 획득**: library SSO 리다이렉트 URL에서 추출

## R2: libseat API 엔드포인트

**Base URL**: `https://libseat.sejong.ac.kr/mobile/MA/`
**인증**: 모든 URL에 `?token=...` 쿼리 필수

| Endpoint | Method | Description |
|----------|--------|-------------|
| `seatMain.php?token=...` | GET | 메인 (나의 좌석 포함) |
| `mySeat.php?token=...` | GET | 나의 좌석 상세 |
| `roomList.php?token=...` | GET | 열람실 목록 + 좌석 현황 |
| `seatMap.php?param_room_no=N&token=...` | GET | 좌석 배치도 (N=11~18) |
| `setSeat.php` | POST | 좌석 예약/배정 |
| `sroomList.php?token=...` | GET | 스터디룸 목록 |
| `cinemaList.php?token=...` | GET | 시네마룸 목록 |
| `loungeList.php?token=...` | GET | S-Lounge 목록 |

## R3: 열람실 목록 응답 구조

**URL**: `roomList.php?token=...`
**응답**: HTML (서버 사이드 렌더링)

열람실 목록은 `<a>` 태그로 구성:
```html
<a href="./seatMap.php?param_room_no=11&token=...">
  <h5>제1열람실A 39 / 87</h5>
</a>
```

**파싱**: `<h5>` 텍스트에서 정규식으로 추출
- Pattern: `(.+)\s+(\d+)\s*/\s*(\d+)`
- Groups: 열람실명, 사용 좌석, 전체 좌석

**Room Numbers**:
| room_no | 이름 |
|---------|------|
| 11 | 제1열람실A |
| 12 | 제1열람실B |
| 13 | 제2열람실 |
| 14 | 제3열람실 |
| 15 | 제4열람실A |
| 16 | 제4열람실B |
| 17 | 제5열람실 |
| 18 | 제6열람실 |

## R4: 좌석 배치도 구조

**URL**: `seatMap.php?param_room_no=N&token=...`
**응답**: HTML with iframe containing seat map tables

좌석은 `<td>` 셀로 표현, 각 셀에 숫자 ID:
- 좌석 번호: element ID (1, 2, 3, ...)
- 사용 중 좌석: CSS class에 `_over` suffix 추가됨
- 좌석 배정: `setSeat.php`에 POST

**Script Pattern** (사용 중 좌석 표시):
```javascript
if(document.getElementById('1')){
  var clsName = document.getElementById('1').className;
  document.getElementById('1').setAttribute("class", clsName + "_over");
}
```

## R5: 나의 좌석 구조

**URL**: `mySeat.php?token=...` 또는 `seatMain.php?token=...`
**데이터**: 열람실명, 좌석번호, 사용시간, 연장 횟수
**표시 위치**: seatMain.php 상단 카드 영역

## R6: 모바일 학생증 (APK 분석 결과)

**구현 방식**: NFC Host Card Emulation (HCE)
**카드번호 설정 경로**: 포털 WebView → JS Bridge `setAccessControlCardNo(JSON)` → SharedPreferences

**우리 시스템에서의 접근**:
- 카드번호 자체는 포털의 특정 페이지에서 JS bridge로 전달됨
- HTTP API로 직접 가져오려면 해당 페이지/API 식별 필요
- 가능한 접근: sjpt 포털의 학생 정보 API에서 카드번호 포함 여부 확인
- `SchStudentBaseInfo/doStudent.do` 응답에 카드번호 관련 필드가 있을 수 있음 (이미 방대한 필드 목록 확인됨)

**Decision**: 구현 Phase에서 doStudent.do 응답의 전체 필드를 덤프하여 카드번호 필드 식별. 없으면 별도 API 탐색.

## R7: HTML 파싱 라이브러리

**Decision**: cheerio 사용
**Rationale**: Node.js에서 가장 널리 사용되는 서버사이드 HTML 파서, jQuery-like API
**Alternative**: node-html-parser — 가볍지만 API가 cheerio보다 제한적
