import { SessionExpiredError } from "./errors.js";
import {
  createSession,
  initWebSquare,
  initPage,
  type SessionInfo,
} from "./session.js";
import { fetchGrades } from "./api/grades.js";
import { fetchEnrollments } from "./api/enrollments.js";
import { fetchScholarships } from "./api/scholarships.js";
import type {
  GradeReport,
  EnrollmentReport,
  ScholarshipReport,
} from "./types.js";

const PGM_GRADES = "SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ";
const PGM_ENROLLMENT = "SELF_STUDSELF_SUB_30SELF_MENU_10SueReqLesnQ";
const PGM_SCHOLARSHIP = "SELF_STUDSELF_SUB_40SCH_SUB_STUDSubSchoMasterOneQ";

export class SejongClient {
  private username = "";
  private password = "";
  private session: SessionInfo | null = null;

  /**
   * SSO 로그인 + WebSquare 세션 초기화.
   * 1회만 호출하면 이후 모든 조회에 동일 세션 재사용.
   */
  async login(username: string, password: string): Promise<void> {
    this.username = username;
    this.password = password;
    this.session = await createSession(username, password);
    await initWebSquare(this.session);
  }

  /** 기이수 성적 조회 */
  async getGrades(): Promise<GradeReport> {
    const session = this.requireSession();
    const addParam = await initPage(session, PGM_GRADES);
    return fetchGrades(session, addParam);
  }

  /** 수강내역 조회 (year/semesterCode 미지정 시 최신 학기) */
  async getEnrollments(
    year?: string,
    semesterCode?: string,
  ): Promise<EnrollmentReport> {
    const session = this.requireSession();
    const addParam = await initPage(session, PGM_ENROLLMENT);
    return fetchEnrollments(session, addParam, year, semesterCode);
  }

  /** 장학이력 조회 */
  async getScholarships(): Promise<ScholarshipReport> {
    const session = this.requireSession();
    const addParam = await initPage(session, PGM_SCHOLARSHIP);
    return fetchScholarships(session, addParam);
  }

  private requireSession(): SessionInfo {
    if (!this.session) {
      throw new SessionExpiredError();
    }
    return this.session;
  }
}
