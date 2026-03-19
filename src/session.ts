import axios, { AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import {
  LoginFailedError,
  NetworkError,
  PortalError,
} from "./errors.js";

const PORTAL_LOGIN_PAGE =
  "https://portal.sejong.ac.kr/jsp/login/loginSSL.jsp?rtUrl=sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=";
const PORTAL_LOGIN_ACTION =
  "https://portal.sejong.ac.kr/jsp/login/login_action.jsp";
const SJPT = "https://sjpt.sejong.ac.kr";

const JSON_HEADERS = {
  "Content-Type": 'application/json; charset="UTF-8"',
  Accept: "application/json",
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  Referer: "https://portal.sejong.ac.kr/jsp/login/loginSSL.jsp",
  Origin: "https://portal.sejong.ac.kr",
};

// TLS bypass for portal's legacy SSL config
// axios-cookiejar-support doesn't support custom httpsAgent,
// so we use the environment variable approach
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export interface SessionInfo {
  userId: string;
  runningSejong: string;
  loginDt: string;
  http: AxiosInstance;
}

export function makeAddParam(data: Record<string, string>): string {
  const json = JSON.stringify(data);
  const encoded = encodeURIComponent(json);
  return Buffer.from(encoded).toString("base64");
}

function createHttpClient(): AxiosInstance {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      headers: { ...BROWSER_HEADERS },
      maxRedirects: 10,
      timeout: 30000,
      validateStatus: () => true,
    }),
  );
  return client;
}

export async function createSession(
  username: string,
  password: string,
): Promise<SessionInfo> {
  const http = createHttpClient();

  try {
    // Step 1: GET login page → session cookies
    await http.get(PORTAL_LOGIN_PAGE);

    // Step 2: POST SSO login
    const loginResp = await http.post(
      PORTAL_LOGIN_ACTION,
      new URLSearchParams({
        id: username,
        password: password,
        mainLogin: "Y",
        rtUrl: "sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const body = typeof loginResp.data === "string"
      ? loginResp.data
      : JSON.stringify(loginResp.data);
    const resultMatch = body.match(/var result = '([^']+)'/);
    const resultVal = resultMatch?.[1] ?? "";

    // Debug: remove after verification
    if (!resultMatch) {
      console.error("[session] Login response type:", typeof loginResp.data, "first 200:", body.substring(0, 200));
    }

    if (resultVal === "erridpwd") {
      throw new LoginFailedError("아이디 또는 비밀번호가 올바르지 않습니다");
    }
    if (resultVal === "pwdNeedChg") {
      throw new LoginFailedError(
        "계정이 잠겼습니다. 비밀번호 찾기에서 재설정해주세요",
      );
    }
    if (resultVal !== "OK" && resultVal !== "") {
      throw new LoginFailedError(`로그인 실패: ${resultVal}`);
    }

    // Step 3: Follow JS redirect to sjpt portal
    const redirectMatch = body.match(/location\.replace\(['"]([^'"]+)['"]\)/);
    const redirectUrl =
      redirectMatch?.[1] ?? `${SJPT}/main/view/Login/doSsoLogin.do?p=`;
    await http.get(redirectUrl);

    // Update headers for sjpt domain
    http.defaults.headers.common["Referer"] =
      `${SJPT}/main/view/Login/doSsoLogin.do?p=`;
    http.defaults.headers.common["Origin"] = SJPT;

    return {
      userId: username,
      runningSejong: "",
      loginDt: "",
      http,
    };
  } catch (e) {
    if (e instanceof LoginFailedError) throw e;
    if (axios.isAxiosError(e)) {
      if (e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") {
        throw new NetworkError(`Connection timed out: ${e.message}`);
      }
      throw new NetworkError(`Connection failed: ${e.message}`);
    }
    throw new PortalError(`Login error: ${e}`);
  }
}

export async function initWebSquare(session: SessionInfo): Promise<void> {
  const { http } = session;
  const emptyAp = makeAddParam({
    _runIntgUsrNo: "",
    _runPgLoginDt: "",
    _runningSejong: "",
  });

  try {
    // Step 1: initUserInfo (empty session)
    const infoResp = await http.post(
      `${SJPT}/main/sys/UserInfo/initUserInfo.do`,
      null,
      { params: { addParam: emptyAp }, headers: JSON_HEADERS },
    );
    const info = infoResp.data;
    if (info._SUBMIT_ERROR_) {
      throw new PortalError(
        `initUserInfo failed: ${info._SUBMIT_ERROR_.ERRMSG ?? "Unknown"}`,
      );
    }

    session.userId = info.dm_UserInfo.INTG_USR_NO;
    session.runningSejong = info.dm_UserInfo.RUNNING_SEJONG;
    session.loginDt = (info.dm_UserInfoGam.LOGIN_TIME as string)
      .replace(/-/g, "")
      .replace(/ /g, "")
      .replace(/:/g, "");

    const baseAp = makeAddParam({
      _runIntgUsrNo: session.userId,
      _runPgLoginDt: session.loginDt,
      _runningSejong: session.runningSejong,
    });

    // Steps 2-7: WebSquare init sequence
    await http.post(`${SJPT}/main/view/Menu/doListUserMyMenuList.do`, null, {
      params: { addParam: baseAp },
      headers: JSON_HEADERS,
    });
    await http.post(`${SJPT}/sys/getRunTimeSystem.do`, null, {
      params: { addParam: baseAp },
      headers: JSON_HEADERS,
    });
    await http.post(
      `${SJPT}/main/view/Main/doCoMessageList.do`,
      { dm_CoMessage: { MULTI_LANG_DIV: "KOR" } },
      { params: { addParam: baseAp }, headers: JSON_HEADERS },
    );
    await http.post(
      `${SJPT}/main/view/Menu/doListUserMenuListTop.do`,
      { dm_CoMessage: { MULTI_LANG_DIV: "KOR" } },
      { params: { addParam: baseAp }, headers: JSON_HEADERS },
    );

    const menuBody = {
      dm_ReqLeftMenu: {
        MENU_SYS_ID: "SELF_STUD",
        SYSTEM_DIV: "SCH",
        MENU_SYS_NM: "학부생학사정보",
      },
    };
    await http.post(`${SJPT}/main/view/Main/doNoticeCheck.do`, menuBody, {
      params: { addParam: baseAp },
      headers: JSON_HEADERS,
    });
    await http.post(
      `${SJPT}/main/view/Menu/doListUserMenuListLeft.do`,
      menuBody,
      { params: { addParam: baseAp }, headers: JSON_HEADERS },
    );
  } catch (e) {
    if (e instanceof PortalError || e instanceof LoginFailedError) throw e;
    throw new PortalError(`WebSquare init failed: ${e}`);
  }
}

export async function initPage(
  session: SessionInfo,
  pgmKey: string,
): Promise<string> {
  const { http, userId, loginDt, runningSejong } = session;
  const pageAp = makeAddParam({
    _runPgmKey: pgmKey,
    _runSysKey: "SCH",
    _runIntgUsrNo: userId,
    _runPgLoginDt: loginDt,
    _runningSejong: runningSejong,
  });

  await http.post(`${SJPT}/main/sys/UserInfo/initUserInfo.do`, null, {
    params: { addParam: pageAp },
    headers: JSON_HEADERS,
  });
  await http.post(
    `${SJPT}/main/sys/UserRole/initUserRole.do`,
    {
      pbForceLog: "false",
      _runPgmKey: pgmKey,
      _runSysKey: "SCH",
      _runIntgUsrNo: userId,
      _runPgLoginDt: loginDt,
      _runningSejong: runningSejong,
    },
    { params: { addParam: pageAp }, headers: JSON_HEADERS },
  );

  return pageAp;
}
