# Research: Sejong Portal Auth (TypeScript)

## R1: SSO Login Flow

**Decision**: portal.sejong.ac.kr에 form POST 로그인 후 JS redirect를 따라가 sjpt.sejong.ac.kr 세션 설정

**Rationale**: Python 프로토타입에서 실제 검증 완료. 브라우저 헤더(User-Agent, Referer) 필수, loginSSL.jsp GET 선행 필요.

**Verified Flow**:
1. `GET portal.sejong.ac.kr/jsp/login/loginSSL.jsp?rtUrl=...` → 세션 쿠키 획득
2. `POST portal.sejong.ac.kr/jsp/login/login_action.jsp` → `ssotoken` 쿠키 설정, body에서 `var result = 'OK'` 확인
3. JS `location.replace(...)` URL 추출 후 `GET` → sjpt 포털 접속

**Login Result Codes**:
- `OK` → 성공
- `erridpwd` → 아이디/비밀번호 오류
- `pwdNeedChg` → 계정 잠금 (비밀번호 재설정 필요)

## R2: WebSquare Session Initialization

**Decision**: 7단계 초기화 시퀀스를 정확히 재현해야 데이터 API 호출 가능

**Rationale**: WebSquare 5 framework는 서버사이드 세션을 JS 클라이언트와 연동. 초기화 없이 API 호출 시 `_SUBMIT_ERROR_` 반환.

**Verified Sequence** (모든 POST, Content-Type: `application/json; charset="UTF-8"`):
1. `initUserInfo.do` (addParam: 빈 세션) → `INTG_USR_NO`, `RUNNING_SEJONG`, `LOGIN_TIME` 획득
2. `doListUserMyMenuList.do` (body: null)
3. `getRunTimeSystem.do` (body: null)
4. `doCoMessageList.do` (body: `{"dm_CoMessage":{"MULTI_LANG_DIV":"KOR"}}`)
5. `doListUserMenuListTop.do` (body: `{"dm_CoMessage":{"MULTI_LANG_DIV":"KOR"}}`)
6. `doNoticeCheck.do` (body: `{"dm_ReqLeftMenu":{"MENU_SYS_ID":"SELF_STUD","SYSTEM_DIV":"SCH","MENU_SYS_NM":"학부생학사정보"}}`)
7. `doListUserMenuListLeft.do` (body: 동일)

**Page Init** (각 기능별):
- `initUserInfo.do` with pgmKey addParam
- `initUserRole.do` with pgmKey addParam + body에 세션 파라미터 포함

## R3: Data API Endpoints

**Decision**: 검증된 JSON API 엔드포인트와 정확한 pgmKey 사용

### 성적 (Grades)
- **pgmKey**: `SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ`
- **Student Info**: `POST /sch/sch/sys/SchStudentBaseInfo/doStudent.do`
- **Grade List**: `POST /sch/sch/sug/SugRecordQ/doList.do`
- **Response Keys**: `dl_main` (과목 목록), `dl_summary` (집계)
- **Grade Fields**: `YEAR`, `SMT_CD_NM`, `CURI_NO`, `CLASS`, `CURI_NM`, `CURI_TYPE_CD_NM`, `CDT`, `GRADE`, `MRKS`, `GRADE_TYPE_CD_NM`, `RE_YEAR`
- **Summary Fields**: `AVG_MRKS`, `APP_CDT`, `REQ_CDT`, `CUL_AVG_MRKS`, `MAJ_AVG_MRKS`, `TOT_MRKS`, `MAJ_BAS`, `MAJ_TOT`, `CUL_CDT`

### 수강내역 (Enrollments)
- **pgmKey**: `SELF_STUDSELF_SUB_30SELF_MENU_10SueReqLesnQ`
- **Semester List**: `POST /sch/sch/sue/SueReqLesnQ/doYearsmt.do` → `dl_yearSmt`
- **Enrollment List**: `POST /sch/sch/sue/SueReqLesnQ/doList.do` → `dl_main`

### 장학이력 (Scholarships)
- **pgmKey**: `SELF_STUDSELF_SUB_40SCH_SUB_STUDSubSchoMasterOneQ`
- **Scholarship List**: `POST /sch/sch/sub/SubSchoMasterOneQ/doList.do` → `dl_mainList`
- **Fields**: `YEAR`, `SMT_CD`, `SCHO_CD_NM`, `TOT_SCHO_AMT`

## R4: addParam Encoding

**Decision**: `base64(urlencode(JSON))` 형식

**Example**:
```
data = {"_runPgmKey":"...","_runSysKey":"SCH","_runIntgUsrNo":"학번","_runPgLoginDt":"YYYYMMDDHHmmss","_runningSejong":"uuid"}
addParam = base64(encodeURIComponent(JSON.stringify(data)))
```

## R5: TLS Compatibility

**Decision**: Node.js에서 `NODE_TLS_REJECT_UNAUTHORIZED=0` 또는 커스텀 https agent로 TLS 검증 비활성화

**Rationale**: 세종대 포털 서버가 오래된 TLS 설정 사용. Python에서는 `ssl.CERT_NONE` + `SECLEVEL=1`로 해결.

**Alternatives Considered**:
- `NODE_TLS_REJECT_UNAUTHORIZED=0` (환경변수) — 간단하지만 전역 적용
- `https.Agent({ rejectUnauthorized: false })` — axios에 per-request 적용 가능 ← **선택**

## R6: Session Constraint

**Decision**: 각 데이터 조회 메서드마다 독립된 HTTP 클라이언트(쿠키 jar) 생성

**Rationale**: 포털은 동일 사용자가 동시에 다른 프로그램(pgmKey)을 사용하면 이전 세션을 종료시킴. Python에서 검증됨.

## R7: HTTP Client Choice

**Decision**: axios 사용

**Rationale**: Node.js 생태계에서 가장 널리 사용, cookie jar 지원 (`tough-cookie` + `axios-cookiejar-support`), redirect follow 지원.

**Alternatives Considered**:
- `node-fetch` — cookie jar 미지원
- `got` — 가능하지만 axios 대비 생태계 작음
- `undici` (Node built-in) — 저수준, cookie 관리 수동
