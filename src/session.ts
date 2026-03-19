import axios, { AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import fs from "node:fs";
import path from "node:path";
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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SESSION_STORE_PATH = path.join(
  process.env.SEJONG_SESSION_DIR ?? process.cwd(),
  ".sejong-session.json",
);

export interface SessionInfo {
  userId: string;
  runningSejong: string;
  loginDt: string;
  http: AxiosInstance;
  jar: CookieJar;
}

export function makeAddParam(data: Record<string, string>): string {
  const json = JSON.stringify(data);
  return Buffer.from(encodeURIComponent(json)).toString("base64");
}

// ── Session Persistence ──

interface StoredSession {
  userId: string;
  runningSejong: string;
  loginDt: string;
  cookies: unknown;
  timestamp: number;
}

function loadStoredSession(): StoredSession | null {
  try {
    if (!fs.existsSync(SESSION_STORE_PATH)) return null;
    const raw = JSON.parse(fs.readFileSync(SESSION_STORE_PATH, "utf-8"));
    // Expire after 25 minutes (portal timeout is ~30min)
    if (Date.now() - raw.timestamp > 25 * 60 * 1000) return null;
    return raw;
  } catch {
    return null;
  }
}

function saveSession(session: SessionInfo): void {
  try {
    const stored: StoredSession = {
      userId: session.userId,
      runningSejong: session.runningSejong,
      loginDt: session.loginDt,
      cookies: session.jar.serializeSync(),
      timestamp: Date.now(),
    };
    fs.writeFileSync(SESSION_STORE_PATH, JSON.stringify(stored));
  } catch {
    // non-critical
  }
}

function createHttpClient(jar: CookieJar): AxiosInstance {
  return wrapper(
    axios.create({
      jar,
      headers: { ...BROWSER_HEADERS },
      maxRedirects: 10,
      timeout: 30000,
      validateStatus: () => true,
    }),
  );
}

// ── Session Creation / Restoration ──

/**
 * Try to restore a previous session. If valid, skip SSO login + WebSquare init.
 * This reuses the SAME JSESSIONID and RUNNING_SEJONG, so the portal sees
 * "the same browser session switching pages" — not a new concurrent session.
 */
export async function createSession(
  username: string,
  password: string,
): Promise<SessionInfo> {
  // Try restoring previous session
  const stored = loadStoredSession();
  if (stored && stored.userId === username) {
    const jar = CookieJar.deserializeSync(stored.cookies as string);
    const http = createHttpClient(jar);
    http.defaults.headers.common["Referer"] =
      `${SJPT}/main/view/Login/doSsoLogin.do?p=`;
    http.defaults.headers.common["Origin"] = SJPT;

    // Validate session is still alive with a lightweight call
    const resetAp = makeAddParam({
      processMessage: "",
      _runIntgUsrNo: stored.userId,
      _runPgLoginDt: stored.loginDt,
      _runningSejong: stored.runningSejong,
    });
    const check = await http.post(
      `${SJPT}/main/view/Main/doResetSessionTime.do`,
      null,
      { params: { addParam: resetAp }, headers: JSON_HEADERS },
    );
    if (!check.data._SUBMIT_ERROR_) {
      // Session still alive! Reuse it.
      return {
        userId: stored.userId,
        runningSejong: stored.runningSejong,
        loginDt: stored.loginDt,
        http,
        jar,
      };
    }
    // Session expired — fall through to fresh login
  }

  // Fresh login
  return freshLogin(username, password);
}

async function freshLogin(
  username: string,
  password: string,
): Promise<SessionInfo> {
  const jar = new CookieJar();
  const http = createHttpClient(jar);

  try {
    await http.get(PORTAL_LOGIN_PAGE);

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

    const body =
      typeof loginResp.data === "string"
        ? loginResp.data
        : JSON.stringify(loginResp.data);
    const resultMatch = body.match(/var result = '([^']+)'/);
    const resultVal = resultMatch?.[1] ?? "";

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

    const redirectMatch = body.match(/location\.replace\(['"]([^'"]+)['"]\)/);
    const redirectUrl =
      redirectMatch?.[1] ?? `${SJPT}/main/view/Login/doSsoLogin.do?p=`;
    await http.get(redirectUrl);

    http.defaults.headers.common["Referer"] =
      `${SJPT}/main/view/Login/doSsoLogin.do?p=`;
    http.defaults.headers.common["Origin"] = SJPT;

    return {
      userId: username,
      runningSejong: "",
      loginDt: "",
      http,
      jar,
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

// ── WebSquare Init (only called once per session) ──

export async function initWebSquare(session: SessionInfo): Promise<void> {
  // Skip if already initialized (restored session)
  if (session.runningSejong) return;

  const { http } = session;
  const emptyAp = makeAddParam({
    _runIntgUsrNo: "",
    _runPgLoginDt: "",
    _runningSejong: "",
  });

  try {
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

    await http.post(`${SJPT}/main/view/Menu/doListUserMyMenuList.do`, null, {
      params: { addParam: baseAp }, headers: JSON_HEADERS,
    });
    await http.post(`${SJPT}/sys/getRunTimeSystem.do`, null, {
      params: { addParam: baseAp }, headers: JSON_HEADERS,
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
      params: { addParam: baseAp }, headers: JSON_HEADERS,
    });
    await http.post(
      `${SJPT}/main/view/Menu/doListUserMenuListLeft.do`,
      menuBody,
      { params: { addParam: baseAp }, headers: JSON_HEADERS },
    );

    // Persist the full session (cookies + RUNNING_SEJONG)
    saveSession(session);
  } catch (e) {
    if (e instanceof PortalError || e instanceof LoginFailedError) throw e;
    throw new PortalError(`WebSquare init failed: ${e}`);
  }
}

// ── Page Init ──

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

  // initUserInfo with pgmKey — signals page transition to server
  await http.post(`${SJPT}/main/sys/UserInfo/initUserInfo.do`, null, {
    params: { addParam: pageAp }, headers: JSON_HEADERS,
  });

  await http.post(
    `${SJPT}/main/sys/UserRole/initUserRole.do`,
    {
      pbForceLog: "true",
      _runPgmKey: pgmKey,
      _runSysKey: "SCH",
      _runIntgUsrNo: userId,
      _runPgLoginDt: loginDt,
      _runningSejong: runningSejong,
    },
    { params: { addParam: pageAp }, headers: JSON_HEADERS },
  );

  // Session keepalive
  const resetAp = makeAddParam({
    processMessage: "",
    _runIntgUsrNo: userId,
    _runPgLoginDt: loginDt,
    _runningSejong: runningSejong,
  });
  await http.post(`${SJPT}/main/view/Main/doResetSessionTime.do`, null, {
    params: { addParam: resetAp }, headers: JSON_HEADERS,
  });

  // Persist after each page init
  saveSession(session);

  return pageAp;
}
