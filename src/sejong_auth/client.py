from __future__ import annotations

import base64
import json
import re
import ssl
from urllib.parse import quote

import httpx

from sejong_auth.credential import CredentialProvider
from sejong_auth.exceptions import (
    LoginFailedError,
    NetworkError,
    ParseError,
    PortalError,
    SessionExpiredError,
)
from sejong_auth.models import (
    CreditSummary,
    Enrollment,
    EnrollmentReport,
    Grade,
    GradeReport,
    Scholarship,
    ScholarshipReport,
    Semester,
)

# ── URLs ──

_PORTAL_LOGIN_PAGE = (
    "https://portal.sejong.ac.kr/jsp/login/loginSSL.jsp"
    "?rtUrl=sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p="
)
_PORTAL_LOGIN_ACTION = "https://portal.sejong.ac.kr/jsp/login/login_action.jsp"
_SJPT = "https://sjpt.sejong.ac.kr"

_JSON_HEADERS = {
    "Content-Type": 'application/json; charset="UTF-8"',
    "Accept": "application/json",
}

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/146.0.0.0 Safari/537.36"
    ),
    "Referer": "https://portal.sejong.ac.kr/jsp/login/loginSSL.jsp",
    "Origin": "https://portal.sejong.ac.kr",
}

# ── pgmKeys (verified from portal menu API) ──

_PGM_GRADES = "SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ"
_PGM_ENROLLMENT = "SELF_STUDSELF_SUB_30SELF_MENU_10SueReqLesnQ"
_PGM_SCHOLARSHIP = "SELF_STUDSELF_SUB_40SCH_SUB_STUDSubSchoMasterOneQ"

# ── Semester mapping ──

_SMT_CODE_TO_ENUM = {
    "10": Semester.FIRST,
    "20": Semester.SECOND,
    "11": Semester.SUMMER,
    "21": Semester.WINTER,
}
_SMT_NAME_TO_ENUM = {s.value: s for s in Semester}


def _parse_semester(value: str) -> Semester:
    r = _SMT_NAME_TO_ENUM.get(value) or _SMT_CODE_TO_ENUM.get(value)
    if r is None:
        raise ParseError(f"Unknown semester value: {value!r}")
    return r


def _make_add_param(data: dict) -> str:
    j = json.dumps(data, separators=(",", ":"))
    return base64.b64encode(quote(j, safe="").encode()).decode()


def _make_ssl_ctx() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


class SejongClient:
    """세종대 포털 인증 + 데이터 조회 클라이언트.

    **중요**: 세종대 포털은 동일 사용자의 동시 프로그램 사용을 거부합니다.
    각 데이터 조회 메서드(get_grades, get_enrollments, get_scholarships)는
    내부적으로 독립된 HTTP 세션을 생성하여 호출합니다.
    """

    def __init__(self, credential_provider: CredentialProvider | None = None) -> None:
        self._credential_provider = credential_provider
        self._username: str = ""
        self._password: str = ""
        self._logged_in = False

    async def login(
        self,
        username: str | None = None,
        password: str | None = None,
    ) -> None:
        """로그인. credentials를 저장합니다. 실제 SSO 인증은 데이터 호출 시 수행됩니다."""
        self._username, self._password = await self._resolve_credentials(
            username, password
        )
        self._logged_in = True

    async def get_grades(self) -> GradeReport:
        """기이수 성적 조회."""
        self._require_login()
        async with self._new_http() as http:
            session = await self._do_sso_login(http)
            await self._init_websquare(http, session)
            pap = await self._init_page(http, session, _PGM_GRADES)

            # Student info
            sr = await http.post(
                f"{_SJPT}/sch/sch/sys/SchStudentBaseInfo/doStudent.do",
                params={"addParam": pap},
                headers=_JSON_HEADERS,
                json={
                    "dm_reqKey": {
                        "keyOrgnClsfCd": "20",
                        "keyStudentNo": session["user_id"],
                        "keyStudentImagPath": "",
                        "keyYear": "",
                        "keySmtCd": "",
                    }
                },
            )
            student = sr.json()

            # Grades
            gr = await http.post(
                f"{_SJPT}/sch/sch/sug/SugRecordQ/doList.do",
                params={"addParam": pap},
                headers=_JSON_HEADERS,
                json={
                    "dm_search": {
                        "ORGN_CLSF_CD": "20",
                        "YEAR": "",
                        "SMT_CD": "",
                        "RECORD_YN": "Y",
                        "STUDENT_NO": session["user_id"],
                        "STUDENT_NM": "",
                        "YEAR_SMT": "",
                    }
                },
            )
            grades = gr.json()
            self._check_error(grades, "grades")
            return self._build_grade_report(student, grades, session["user_id"])

    async def get_enrollments(
        self, year: str = "", semester_code: str = ""
    ) -> EnrollmentReport:
        """수강내역 조회. year/semester_code 미지정 시 최신 학기."""
        self._require_login()
        async with self._new_http() as http:
            session = await self._do_sso_login(http)
            await self._init_websquare(http, session)
            pap = await self._init_page(http, session, _PGM_ENROLLMENT)

            # Get available semesters
            ys = await http.post(
                f"{_SJPT}/sch/sch/sue/SueReqLesnQ/doYearsmt.do",
                params={"addParam": pap},
                headers=_JSON_HEADERS,
                json={
                    "dm_search": {
                        "ORGN_CLSF_CD": "20",
                        "STUDENT_NO": session["user_id"],
                        "YEAR_SMT": "",
                        "REQ_LOG_CD": "",
                        "CDT": "",
                        "CNT": "",
                        "YEAR": "",
                        "SMT_CD": "",
                        "SMT_CD_NM": "",
                    }
                },
            )
            ys_data = ys.json()
            semesters = ys_data.get("dl_yearSmt", [])

            if not year and semesters:
                latest = semesters[0]
                year = latest["YEAR"]
                semester_code = latest["SMT_CD"]

            year = year or "2026"
            semester_code = semester_code or "10"
            year_smt = f"{year}{semester_code}"

            er = await http.post(
                f"{_SJPT}/sch/sch/sue/SueReqLesnQ/doList.do",
                params={"addParam": pap},
                headers=_JSON_HEADERS,
                json={
                    "dm_search": {
                        "ORGN_CLSF_CD": "20",
                        "STUDENT_NO": session["user_id"],
                        "YEAR_SMT": year_smt,
                        "REQ_LOG_CD": "",
                        "CDT": "",
                        "CNT": "",
                        "YEAR": year,
                        "SMT_CD": semester_code,
                        "SMT_CD_NM": "",
                    }
                },
            )
            enroll = er.json()
            self._check_error(enroll, "enrollments")
            return self._build_enrollment_report(
                enroll, semesters, int(year), semester_code, session["user_id"]
            )

    async def get_scholarships(self) -> ScholarshipReport:
        """장학이력 조회."""
        self._require_login()
        async with self._new_http() as http:
            session = await self._do_sso_login(http)
            await self._init_websquare(http, session)
            pap = await self._init_page(http, session, _PGM_SCHOLARSHIP)

            sr = await http.post(
                f"{_SJPT}/sch/sch/sub/SubSchoMasterOneQ/doList.do",
                params={"addParam": pap},
                headers=_JSON_HEADERS,
                json={
                    "dm_search": {
                        "ORGN_CLSF_CD": "",
                        "STUDENT_NO": session["user_id"],
                    }
                },
            )
            data = sr.json()
            self._check_error(data, "scholarships")
            return self._build_scholarship_report(data, session["user_id"])

    # ── Lifecycle ──

    async def close(self) -> None:
        pass  # stateless — nothing to close

    async def __aenter__(self) -> SejongClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    # ── Internal: HTTP & Login ──

    def _new_http(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            follow_redirects=True,
            timeout=30.0,
            verify=_make_ssl_ctx(),
            headers=dict(_BROWSER_HEADERS),
        )

    async def _do_sso_login(self, http: httpx.AsyncClient) -> dict:
        """SSO 로그인 후 세션 메타데이터를 반환합니다."""
        try:
            await http.get(_PORTAL_LOGIN_PAGE)

            resp = await http.post(
                _PORTAL_LOGIN_ACTION,
                data={
                    "id": self._username,
                    "password": self._password,
                    "mainLogin": "Y",
                    "rtUrl": "sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=",
                },
            )
            body = resp.text
            result_match = re.search(r"var result = '([^']+)'", body)
            result_val = result_match.group(1) if result_match else ""

            if result_val not in ("OK", ""):
                raise LoginFailedError(f"로그인 실패 (result={result_val})")
            if result_val == "pwdNeedChg":
                raise LoginFailedError(
                    "계정이 잠겼습니다. 비밀번호 찾기에서 재설정해주세요: "
                    "https://portal.sejong.ac.kr/jsp/inquiry/pwinquiry.jsp"
                )
            if result_val not in ("OK", ""):
                raise LoginFailedError(f"로그인 실패: {result_val}")

            match = re.search(r"location\.replace\(['\"]([^'\"]+)['\"]\)", body)
            redirect_url = match.group(1) if match else f"{_SJPT}/main/view/Login/doSsoLogin.do?p="
            await http.get(redirect_url)

            http.headers["Referer"] = f"{_SJPT}/main/view/Login/doSsoLogin.do?p="
            http.headers["Origin"] = _SJPT

            return {"user_id": self._username, "login_dt": "", "running_sejong": ""}

        except LoginFailedError:
            raise
        except httpx.TimeoutException as e:
            raise NetworkError(f"Connection timed out: {e}") from e
        except httpx.ConnectError as e:
            raise NetworkError(f"Connection failed: {e}") from e
        except Exception as e:
            if isinstance(e, (NetworkError, LoginFailedError)):
                raise
            raise PortalError(f"Login error: {e}") from e

    # ── Internal: WebSquare Init ──

    async def _init_websquare(self, http: httpx.AsyncClient, session: dict) -> None:
        """WebSquare 세션을 초기화합니다 (정확한 브라우저 시퀀스 재현)."""
        try:
            eap = _make_add_param(
                {"_runIntgUsrNo": "", "_runPgLoginDt": "", "_runningSejong": ""}
            )
            r = await http.post(
                f"{_SJPT}/main/sys/UserInfo/initUserInfo.do",
                params={"addParam": eap},
                headers=_JSON_HEADERS,
            )
            info = r.json()
            if "_SUBMIT_ERROR_" in info:
                raise PortalError(
                    f"initUserInfo failed: {info['_SUBMIT_ERROR_'].get('ERRMSG', '')}"
                )

            session["user_id"] = info["dm_UserInfo"]["INTG_USR_NO"]
            session["running_sejong"] = info["dm_UserInfo"]["RUNNING_SEJONG"]
            session["login_dt"] = (
                info["dm_UserInfoGam"]["LOGIN_TIME"]
                .replace("-", "")
                .replace(" ", "")
                .replace(":", "")
            )

            bap = _make_add_param(
                {
                    "_runIntgUsrNo": session["user_id"],
                    "_runPgLoginDt": session["login_dt"],
                    "_runningSejong": session["running_sejong"],
                }
            )

            await http.post(
                f"{_SJPT}/main/view/Menu/doListUserMyMenuList.do",
                params={"addParam": bap},
                headers=_JSON_HEADERS,
            )
            await http.post(
                f"{_SJPT}/sys/getRunTimeSystem.do",
                params={"addParam": bap},
                headers=_JSON_HEADERS,
            )
            await http.post(
                f"{_SJPT}/main/view/Main/doCoMessageList.do",
                params={"addParam": bap},
                headers=_JSON_HEADERS,
                json={"dm_CoMessage": {"MULTI_LANG_DIV": "KOR"}},
            )
            await http.post(
                f"{_SJPT}/main/view/Menu/doListUserMenuListTop.do",
                params={"addParam": bap},
                headers=_JSON_HEADERS,
                json={"dm_CoMessage": {"MULTI_LANG_DIV": "KOR"}},
            )

            menu_body = {
                "dm_ReqLeftMenu": {
                    "MENU_SYS_ID": "SELF_STUD",
                    "SYSTEM_DIV": "SCH",
                    "MENU_SYS_NM": "학부생학사정보",
                }
            }
            await http.post(
                f"{_SJPT}/main/view/Main/doNoticeCheck.do",
                params={"addParam": bap},
                headers=_JSON_HEADERS,
                json=menu_body,
            )
            await http.post(
                f"{_SJPT}/main/view/Menu/doListUserMenuListLeft.do",
                params={"addParam": bap},
                headers=_JSON_HEADERS,
                json=menu_body,
            )
        except (LoginFailedError, NetworkError, PortalError):
            raise
        except Exception as e:
            raise PortalError(f"WebSquare init failed: {e}") from e

    async def _init_page(
        self, http: httpx.AsyncClient, session: dict, pgm_key: str
    ) -> str:
        """특정 페이지(프로그램)를 초기화하고 addParam을 반환합니다."""
        pap = _make_add_param(
            {
                "_runPgmKey": pgm_key,
                "_runSysKey": "SCH",
                "_runIntgUsrNo": session["user_id"],
                "_runPgLoginDt": session["login_dt"],
                "_runningSejong": session["running_sejong"],
            }
        )
        await http.post(
            f"{_SJPT}/main/sys/UserInfo/initUserInfo.do",
            params={"addParam": pap},
            headers=_JSON_HEADERS,
        )
        await http.post(
            f"{_SJPT}/main/sys/UserRole/initUserRole.do",
            params={"addParam": pap},
            headers=_JSON_HEADERS,
            json={
                "pbForceLog": "false",
                "_runPgmKey": pgm_key,
                "_runSysKey": "SCH",
                "_runIntgUsrNo": session["user_id"],
                "_runPgLoginDt": session["login_dt"],
                "_runningSejong": session["running_sejong"],
            },
        )
        return pap

    # ── Internal: Credential Resolution ──

    async def _resolve_credentials(
        self, username: str | None, password: str | None
    ) -> tuple[str, str]:
        both = username is not None and password is not None
        neither = username is None and password is None
        if both:
            return username, password  # type: ignore[return-value]
        if not neither:
            raise ValueError("Provide both username and password, or neither")
        if self._credential_provider is None:
            raise ValueError("No credentials and no credential_provider")
        return await self._credential_provider.get_credentials()

    def _require_login(self) -> None:
        if not self._logged_in:
            raise SessionExpiredError("Not logged in. Call login() first.")

    @staticmethod
    def _check_error(data: dict, context: str) -> None:
        err = data.get("_SUBMIT_ERROR_")
        if err:
            msg = err.get("ERRMSG", "Unknown error")
            raise PortalError(f"[{context}] {msg}")

    # ── Builders ──

    def _build_grade_report(
        self, student_data: dict, grade_data: dict, user_id: str
    ) -> GradeReport:
        s_info = student_data.get("dl_main", [{}])[0] if student_data.get("dl_main") else {}
        raw = grade_data.get("dl_main", [])
        summary = grade_data.get("dl_summary", [{}])[0] if grade_data.get("dl_summary") else {}

        grades = []
        for r in raw:
            smt = r.get("SMT_CD_NM") or r.get("SMT_CD", "")
            grades.append(
                Grade(
                    year=int(r.get("YEAR", 0)),
                    semester=_parse_semester(smt),
                    course_code=r.get("CURI_NO", ""),
                    section=r.get("CLASS", r.get("CURI_CLASS", "")),
                    course_name=r.get("CURI_NM", ""),
                    course_type=r.get("CURI_TYPE_CD_NM", ""),
                    graduation_course_type=r.get("SUH_CURI_TYPE_CD_NM", ""),
                    credit=float(r.get("CDT", 0)),
                    grade=r.get("GRADE", ""),
                    grade_point=float(r.get("MRKS", 0)),
                    evaluation_type=r.get("GRADE_TYPE_CD_NM", ""),
                    retake=bool(r.get("RE_YEAR")),
                    elective_area=r.get("SLT_DOMAIN_CD_NM") or None,
                    teaching_area=r.get("DOMAIN_CD_NM") or None,
                )
            )

        return GradeReport(
            student_id=user_id,
            student_name=s_info.get("NM", ""),
            major=s_info.get("DEPT_ALIAS", ""),
            year_level=int(s_info.get("STUDENT_YEAR", 0)),
            grades=grades,
            credit_summary=CreditSummary(
                liberal_required=float(summary.get("CUL_CDT", 0)),
                liberal_total=float(summary.get("CUL_CDT", 0)),
                major_required=float(summary.get("MAJ_CDT", 0)),
                major_elective=float(summary.get("MAJ_SEL", 0)),
                major_basic=float(summary.get("MAJ_BAS", 0)),
                major_total=float(summary.get("MAJ_TOT", 0)),
            ),
            total_gpa=float(summary.get("AVG_MRKS", 0)),
            total_earned_credits=float(summary.get("APP_CDT", 0)),
            total_attempted_credits=float(summary.get("REQ_CDT", 0)),
            graduation_credits=float(summary.get("APP_CDT", 0)),
            liberal_gpa=float(summary.get("CUL_AVG_MRKS", 0)),
            major_gpa=float(summary.get("MAJ_AVG_MRKS", 0)),
            percentile=float(summary.get("TOT_MRKS", 0)),
        )

    def _build_enrollment_report(
        self,
        data: dict,
        semesters: list[dict],
        year: int,
        semester_code: str,
        user_id: str,
    ) -> EnrollmentReport:
        raw = data.get("dl_main", [])
        enrollments = []
        total = 0.0
        for r in raw:
            cdt = float(r.get("CDT", 0))
            total += cdt
            enrollments.append(
                Enrollment(
                    year=year,
                    semester=_parse_semester(semester_code),
                    course_code=r.get("CURI_NO", ""),
                    section=r.get("CLASS", ""),
                    course_name=r.get("CURI_NM", ""),
                    course_type=r.get("CURI_TYPE_CD_NM", ""),
                    credit=cdt,
                    professor=r.get("EMP_NM") or None,
                    time_location=r.get("CORS_SCHE_TIME") or None,
                )
            )

        # If the API returned 0 items, use the count from semesters
        if not enrollments and semesters:
            for s in semesters:
                if s.get("YEAR") == str(year) and s.get("SMT_CD") == semester_code:
                    total = float(s.get("TOT_CDT", 0))
                    break

        return EnrollmentReport(
            student_id=user_id,
            year=year,
            semester=_parse_semester(semester_code),
            enrollments=enrollments,
            total_credits=total,
        )

    def _build_scholarship_report(
        self, data: dict, user_id: str
    ) -> ScholarshipReport:
        raw = data.get("dl_mainList", [])
        scholarships = []
        total = 0
        for r in raw:
            smt = r.get("SMT_CD", "10")
            amt = int(r.get("TOT_SCHO_AMT", 0))
            total += amt
            scholarships.append(
                Scholarship(
                    year=int(r.get("YEAR", 0)) if r.get("YEAR") else 0,
                    semester=_parse_semester(smt),
                    scholarship_name=r.get("SCHO_CD_NM") or r.get("FIX_SCHO_CD_NM") or "",
                    amount=amt,
                )
            )

        return ScholarshipReport(
            student_id=user_id,
            scholarships=scholarships,
            total_amount=total,
        )
