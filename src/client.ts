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
import {
  acquireLibseatToken,
  fetchRoomList,
  fetchMySeat,
  fetchSeatMap,
  fetchFacilityRooms,
} from "./api/library.js";
import { fetchStudentCard } from "./api/studentcard.js";
import type {
  GradeReport,
  EnrollmentReport,
  ScholarshipReport,
  ReadingRoom,
  MySeat,
  SeatMapResponse,
  FacilityRoom,
  FacilityType,
  StudentCard,
} from "./types.js";

const PGM_GRADES = "SELF_STUDSELF_SUB_30SCH_SUG05_STUDSugRecordQ";
const PGM_ENROLLMENT = "SELF_STUDSELF_SUB_30SELF_MENU_10SueReqLesnQ";
const PGM_SCHOLARSHIP = "SELF_STUDSELF_SUB_40SCH_SUB_STUDSubSchoMasterOneQ";

export class SejongClient {
  private username = "";
  private password = "";
  private session: SessionInfo | null = null;
  private libseatToken: string | null = null;

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

  // ── 학사 정보 (sjpt.sejong.ac.kr) ──

  /** 기이수 성적 조회 */
  async getGrades(): Promise<GradeReport> {
    const session = this.requireSession();
    const addParam = await initPage(session, PGM_GRADES);
    return fetchGrades(session, addParam);
  }

  /** 수강내역 조회 */
  async getEnrollments(year?: string, semesterCode?: string): Promise<EnrollmentReport> {
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

  // ── 도서관 좌석 (libseat.sejong.ac.kr) ──

  /** 열람실 좌석 현황 */
  async getLibraryRooms(): Promise<ReadingRoom[]> {
    const { http, token } = await this.ensureLibseatToken();
    return fetchRoomList(http, token);
  }

  /** 나의 좌석 조회 */
  async getMySeat(): Promise<MySeat> {
    const { http, token } = await this.ensureLibseatToken();
    return fetchMySeat(http, token);
  }

  /** 특정 열람실 좌석 배치도 (roomNo: 11-18) */
  async getSeatMap(roomNo: number): Promise<SeatMapResponse> {
    const { http, token } = await this.ensureLibseatToken();
    return fetchSeatMap(http, token, roomNo);
  }

  /** 시설 예약 현황 */
  async getFacilityRooms(type: FacilityType): Promise<FacilityRoom[]> {
    const { http, token } = await this.ensureLibseatToken();
    return fetchFacilityRooms(http, token, type);
  }

  // ── 모바일 학생증 ──

  /** 학생증 카드번호 조회 */
  async getStudentCard(): Promise<StudentCard> {
    const session = this.requireSession();
    const addParam = await initPage(session, PGM_GRADES); // reuse grades pgm for student info
    return fetchStudentCard(session, addParam);
  }

  // ── Internal ──

  private requireSession(): SessionInfo {
    if (!this.session) throw new SessionExpiredError();
    return this.session;
  }

  private async ensureLibseatToken(): Promise<{ http: SessionInfo["http"]; token: string }> {
    const session = this.requireSession();
    if (!this.libseatToken) {
      this.libseatToken = await acquireLibseatToken(session.http);
    }
    return { http: session.http, token: this.libseatToken };
  }
}
