import { SessionExpiredError } from "./errors.js";
import { createSession, initWebSquare, initPage } from "./session.js";
import { fetchGrades } from "./api/grades.js";
import { fetchEnrollments } from "./api/enrollments.js";
import { fetchScholarships } from "./api/scholarships.js";
import type { GradeReport, EnrollmentReport, ScholarshipReport } from "./types.js";

const PGM_GRADES = "SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ";
const PGM_ENROLLMENT = "SELF_STUDSELF_SUB_30SELF_MENU_10SueReqLesnQ";
const PGM_SCHOLARSHIP = "SELF_STUDSELF_SUB_40SCH_SUB_STUDSubSchoMasterOneQ";

export class SejongClient {
  private username = "";
  private password = "";
  private loggedIn = false;

  async login(username: string, password: string): Promise<void> {
    this.username = username;
    this.password = password;
    this.loggedIn = true;
  }

  async getGrades(): Promise<GradeReport> {
    this.requireLogin();
    const session = await createSession(this.username, this.password);
    await initWebSquare(session);
    const addParam = await initPage(session, PGM_GRADES);
    return fetchGrades(session, addParam);
  }

  async getEnrollments(
    year?: string,
    semesterCode?: string,
  ): Promise<EnrollmentReport> {
    this.requireLogin();
    const session = await createSession(this.username, this.password);
    await initWebSquare(session);
    const addParam = await initPage(session, PGM_ENROLLMENT);
    return fetchEnrollments(session, addParam, year, semesterCode);
  }

  async getScholarships(): Promise<ScholarshipReport> {
    this.requireLogin();
    const session = await createSession(this.username, this.password);
    await initWebSquare(session);
    const addParam = await initPage(session, PGM_SCHOLARSHIP);
    return fetchScholarships(session, addParam);
  }

  private requireLogin(): void {
    if (!this.loggedIn) {
      throw new SessionExpiredError();
    }
  }
}
