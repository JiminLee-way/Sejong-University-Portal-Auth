import * as auth from "./api/auth.js";
import * as grades from "./api/grades.js";
import * as notices from "./api/notices.js";
import * as news from "./api/news.js";
import * as feeds from "./api/feeds.js";
import * as schedules from "./api/schedules.js";
import * as qna from "./api/qna.js";
import * as staff from "./api/staff.js";
import * as notifs from "./api/notifications.js";
import { generateQr, type QrCodeResult } from "./api/qr.js";
import { getProfilePhoto } from "./api/photo.js";
import * as scholarship from "./api/scholarship.js";
import * as food from "./api/food.js";
import type { Building, Place, MenuItem, MealType } from "./api/food.js";
import type { ScholarshipListResponse, ScholarshipItem } from "./api/scholarship.js";
import * as tuition from "./api/tuition.js";
import type { TuitionNoticeResponse, TuitionPaymentResponse } from "./api/tuition.js";
import * as timetable from "./api/timetable.js";
import type { AvailableSemester, TimetableResponse, EnrolledCoursesResponse } from "./api/timetable.js";
import {
  acquireLibseatToken,
  fetchRoomList,
  fetchMySeat,
  fetchSeatMap,
  fetchSeatLayout,
  fetchSeatCoords,
  fetchFacilityRooms,
  fetchStudyRoomReservation,
} from "./api/library.js";
import {
  setSeat as doSetSeat,
  confirmSeat as doConfirmSeat,
  extendSeat as doExtendSeat,
  returnSeat as doReturnSeat,
  reserveStudyRoom as doReserveStudyRoom,
  cancelStudyRoom as doCancelStudyRoom,
} from "./api/seatactions.js";
import { LoginFailedError, SessionExpiredError, NetworkError, PortalError } from "./errors.js";
import { createSjappClient } from "./http.js";
import type {
  AuthToken, UserProfile,
  GradeAllResponse, GradeCurrentResponse, GradeSemester,
  NoticeCategory, PagedData, Notice,
  NewsType, News as NewsItem,
  FeedType, Feed, FeedLatestResponse,
  Schedule, ScheduleCategory, ScheduleTag, CreateScheduleRequest,
  QnA, QnACategory, CreateQnARequest,
  Staff as StaffItem,
  Notification, UnreadCount, NotificationSettings,
} from "./types.js";
import type { ReadingRoom, MySeat, SeatMapResponse, FacilityRoom, FacilityType, SeatActionResult } from "./types.js";
import axios from "axios";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export class SejongClient {
  private accessToken = "";
  private userId = "";
  private username = "";
  private libseatToken: string | null = null;
  private libseatHttp: ReturnType<typeof createSjappClient> | null = null;

  // ── Auth ──

  async login(id: string, password: string): Promise<AuthToken> {
    try {
      const token = await auth.login(id, password);
      this.accessToken = token.accessToken;
      this.userId = token.userId;
      this.username = token.username;
      return token;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 400 || e.response?.status === 401) {
          const msg = e.response.data?.details?.fieldErrors?.[0]?.message
            ?? e.response.data?.message
            ?? "아이디 또는 비밀번호가 올바르지 않습니다";
          throw new LoginFailedError(msg);
        }
        throw new NetworkError(`Connection failed: ${e.message}`);
      }
      throw e;
    }
  }

  async getProfile(): Promise<UserProfile> {
    this.requireAuth();
    return auth.getProfile(this.accessToken);
  }

  async refreshToken(): Promise<AuthToken> {
    this.requireAuth();
    const token = await auth.refreshToken(this.accessToken);
    this.accessToken = token.accessToken;
    return token;
  }

  async logout(): Promise<void> {
    if (this.accessToken) {
      try {
        await auth.logout(this.accessToken);
      } catch {
        // Ignore logout errors
      }
      this.accessToken = "";
      this.userId = "";
      this.username = "";
    }
  }

  // ── Profile Photo ──

  /** 증명사진 (JPEG Buffer) */
  async getProfilePhoto(): Promise<Buffer> {
    this.requireAuth();
    return getProfilePhoto(this.accessToken);
  }

  // ── Student QR Code ──

  /** 모바일 학생증 QR 코드 생성 (59초마다 갱신 필요) */
  async generateStudentQr(refreshKey = 0, size = 200): Promise<QrCodeResult> {
    this.requireAuth();
    const data = JSON.stringify({
      userId: this.userId,
      name: this.username,
      role: "STUDENT",
      timestamp: Date.now(),
      refreshKey,
    });
    return generateQr(this.accessToken, data, size);
  }

  // ── Food / Cafeteria (인증 불필요) ──

  /** 학식 건물 목록 (군자관, 진관홀, 학생회관) */
  async getFoodBuildings(): Promise<Building[]> {
    return food.getBuildings();
  }

  /** 건물별 식당 목록 */
  async getFoodPlaces(buildingId: number): Promise<Place[]> {
    return food.getPlaces(buildingId);
  }

  /** 식당별 메뉴 */
  async getFoodMenus(placeId: number): Promise<MenuItem[]> {
    return food.getMenus(placeId);
  }

  /** 식당별 식사 유형 (조식/중식/석식 + 가격) */
  async getFoodMealTypes(placeId: number): Promise<MealType[]> {
    return food.getMealTypes(placeId);
  }

  // ── Scholarship ──

  /** 장학금 조회 가능 학기 */
  async getScholarshipOptions(): Promise<{ year: string; smtCd: string }[]> {
    this.requireAuth();
    return scholarship.getYearSemesterOptions(this.accessToken);
  }

  /** 장학금 목록 */
  async getScholarships(year: string, smtCd: string): Promise<ScholarshipListResponse> {
    this.requireAuth();
    return scholarship.getList(this.accessToken, year, smtCd);
  }

  // ── Tuition ──

  /** 등록금 고지 조회 가능 학기 */
  async getTuitionNoticeOptions(): Promise<{ year: string; smtCd: string }[]> {
    this.requireAuth();
    return tuition.getNoticeOptions(this.accessToken);
  }

  /** 등록금 고지서 */
  async getTuitionNotice(year: string, smtCd: string): Promise<TuitionNoticeResponse> {
    this.requireAuth();
    return tuition.getNotice(this.accessToken, year, smtCd);
  }

  /** 등록금 납부 내역 */
  async getTuitionPayment(year: string, smtCd: string): Promise<TuitionPaymentResponse> {
    this.requireAuth();
    return tuition.getPayment(this.accessToken, year, smtCd);
  }

  // ── Timetable ──

  /** 조회 가능한 학기 목록 */
  async getAvailableSemesters(): Promise<AvailableSemester[]> {
    this.requireAuth();
    return timetable.getAvailableSemesters(this.accessToken);
  }

  /** 시간표 조회 (요일/교시별) */
  async getTimetable(year: string, smtCd: string): Promise<TimetableResponse> {
    this.requireAuth();
    return timetable.getTimetable(this.accessToken, year, smtCd);
  }

  /** 수강 과목 목록 + 학점 요약 */
  async getEnrolledCourses(year: string, smtCd: string): Promise<EnrolledCoursesResponse> {
    this.requireAuth();
    return timetable.getEnrolledCourses(this.accessToken, year, smtCd);
  }

  // ── Grades ──

  async getGrades(): Promise<GradeAllResponse> {
    this.requireAuth();
    return grades.getAll(this.accessToken);
  }

  async getCurrentGrades(): Promise<GradeCurrentResponse> {
    this.requireAuth();
    return grades.getCurrent(this.accessToken);
  }

  async getSemesterGrades(year: string, smtCd: string): Promise<GradeSemester> {
    this.requireAuth();
    return grades.getSemester(this.accessToken, year, smtCd);
  }

  // ── Notices (no auth required) ──

  async getNotices(category: NoticeCategory, opts?: { page?: number; size?: number }): Promise<PagedData<Notice>> {
    return notices.getList(category, opts?.page, opts?.size);
  }

  async getNoticeDetail(category: NoticeCategory, id: string): Promise<Notice> {
    return notices.getDetail(category, id);
  }

  async getLatestNotices(type: NoticeCategory, size?: number): Promise<Notice[]> {
    return notices.getLatest(type, size);
  }

  // ── News (no auth required) ──

  async getNews(type: NewsType, opts?: { page?: number; size?: number }): Promise<PagedData<NewsItem>> {
    return news.getNewsList(type, opts?.page, opts?.size);
  }

  async getNewsDetail(type: NewsType, id: string): Promise<NewsItem> {
    return news.getNewsDetail(type, id);
  }

  // ── Feeds (no auth required) ──

  async getFeeds(type: FeedType, opts?: { page?: number; size?: number }): Promise<PagedData<Feed> | FeedLatestResponse> {
    return feeds.getFeedList(type, opts?.page, opts?.size);
  }

  // ── Schedules ──

  async getSchedules(): Promise<Schedule[]> {
    this.requireAuth();
    return schedules.list(this.accessToken);
  }

  async createSchedule(data: CreateScheduleRequest): Promise<Schedule> {
    this.requireAuth();
    return schedules.create(this.accessToken, data);
  }

  async updateSchedule(id: number, data: Partial<CreateScheduleRequest>): Promise<Schedule> {
    this.requireAuth();
    return schedules.update(this.accessToken, id, data);
  }

  async deleteSchedule(id: number): Promise<void> {
    this.requireAuth();
    return schedules.remove(this.accessToken, id);
  }

  async completeSchedule(id: number): Promise<Schedule> {
    this.requireAuth();
    return schedules.complete(this.accessToken, id);
  }

  async getScheduleCategories(): Promise<ScheduleCategory[]> {
    this.requireAuth();
    return schedules.getCategories(this.accessToken);
  }

  async getScheduleTags(): Promise<ScheduleTag[]> {
    this.requireAuth();
    return schedules.getTags(this.accessToken);
  }

  // ── QnA ──

  async getQnACategories(): Promise<QnACategory[]> {
    return qna.getCategories();
  }

  async getMyQnAs(opts?: { page?: number; size?: number }): Promise<PagedData<QnA>> {
    this.requireAuth();
    return qna.getMyList(this.accessToken, opts?.page, opts?.size);
  }

  async createQnA(data: CreateQnARequest): Promise<QnA> {
    this.requireAuth();
    return qna.create(this.accessToken, data);
  }

  async getQnADetail(id: number): Promise<QnA> {
    this.requireAuth();
    return qna.getDetail(this.accessToken, id);
  }

  async updateQnA(id: number, data: Partial<CreateQnARequest>): Promise<QnA> {
    this.requireAuth();
    return qna.update(this.accessToken, id, data);
  }

  async deleteQnA(id: number): Promise<void> {
    this.requireAuth();
    return qna.remove(this.accessToken, id);
  }

  // ── Staff ──

  async searchStaff(opts?: { page?: number; size?: number }): Promise<PagedData<StaffItem>> {
    this.requireAuth();
    return staff.search(this.accessToken, opts?.page, opts?.size);
  }

  // ── Notifications ──

  async getNotifications(opts?: { page?: number; size?: number }): Promise<PagedData<Notification>> {
    this.requireAuth();
    return notifs.getInbox(this.accessToken, opts?.page, opts?.size);
  }

  async getUnreadCount(): Promise<UnreadCount> {
    this.requireAuth();
    return notifs.getUnreadCount(this.accessToken);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    this.requireAuth();
    return notifs.markAsRead(this.accessToken, id);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    this.requireAuth();
    return notifs.markAllAsRead(this.accessToken);
  }

  async deleteNotification(id: number): Promise<void> {
    this.requireAuth();
    return notifs.deleteNotification(this.accessToken, id);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    this.requireAuth();
    return notifs.getSettings(this.accessToken);
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    this.requireAuth();
    return notifs.updateSettings(this.accessToken, settings);
  }

  // ── Library (libseat, existing) ──

  async getLibraryRooms(): Promise<ReadingRoom[]> {
    const { http, token } = await this.ensureLibseat();
    return fetchRoomList(http, token);
  }

  async getMySeat(): Promise<MySeat> {
    const { http, token } = await this.ensureLibseat();
    return fetchMySeat(http, token);
  }

  async getSeatMap(roomNo: number): Promise<SeatMapResponse> {
    const { http, token } = await this.ensureLibseat();
    return fetchSeatMap(http, token, roomNo);
  }

  /** 좌석 배치도 — 물리적 배치 그대로 (테이블 그리드) */
  async getSeatLayout(roomNo: number): Promise<import("./types.js").SeatLayoutResponse> {
    const { http, token } = await this.ensureLibseat();
    return fetchSeatLayout(http, token, roomNo);
  }

  async getFacilityRooms(type: FacilityType): Promise<FacilityRoom[]> {
    const { http, token } = await this.ensureLibseat();
    return fetchFacilityRooms(http, token, type);
  }

  /** 좌석 좌표 배치도 — 각 좌석의 정확한 (x,y) px 좌표 + 배경 이미지 URL */
  async getSeatCoords(roomNo: number): Promise<import("./types.js").SeatMapCoords> {
    const { http, token } = await this.ensureLibseat();
    return fetchSeatCoords(http, token, roomNo);
  }

  /** 좌석 예약 (setSeat) */
  async reserveSeat(roomNo: number, seatNo: number): Promise<SeatActionResult> {
    const { http, token } = await this.ensureLibseat();
    return doSetSeat(http, token, this.userId, roomNo, seatNo);
  }

  /** 좌석 발권확정 (confirmSeat) — 게이트 통과 후 */
  async confirmSeat(roomNo: number, seatNo: number): Promise<SeatActionResult> {
    const { http, token } = await this.ensureLibseat();
    return doConfirmSeat(http, token, this.userId, roomNo, seatNo);
  }

  /** 좌석 연장 (extdSeat) */
  async extendSeat(): Promise<SeatActionResult> {
    const { http, token } = await this.ensureLibseat();
    const seat = await fetchMySeat(http, token);
    return doExtendSeat(http, token, this.userId, seat.seatNumber, seat.seatNumber);
  }

  /** 좌석 반납 (returnSeat) */
  async returnSeat(): Promise<SeatActionResult> {
    const { http, token } = await this.ensureLibseat();
    const seat = await fetchMySeat(http, token);
    return doReturnSeat(http, token, this.userId, seat.seatNumber, seat.seatNumber);
  }

  /** 스터디룸 예약 가능 목록 */
  async getStudyRoomReservation(): Promise<{ rooms: { id: string; name: string }[] }> {
    const { http, token } = await this.ensureLibseat();
    return fetchStudyRoomReservation(http, token);
  }

  /** 스터디룸 예약 */
  async reserveStudyRoom(roomNo: number, date: string, startTime: number, endTime: number): Promise<SeatActionResult> {
    const { http, token } = await this.ensureLibseat();
    return doReserveStudyRoom(http, token, this.userId, roomNo, date, startTime, endTime);
  }

  /** 스터디룸 예약 취소 */
  async cancelStudyRoom(reserveNo: string): Promise<SeatActionResult> {
    const { http, token } = await this.ensureLibseat();
    return doCancelStudyRoom(http, token, this.userId, reserveNo);
  }

  // ── Internal ──

  private requireAuth(): void {
    if (!this.accessToken) throw new SessionExpiredError();
  }

  private async ensureLibseat(): Promise<{ http: any; token: string }> {
    this.requireAuth();
    if (!this.libseatHttp || !this.libseatToken) {
      // Use sjapp SSO to get portal session, then acquire libseat token
      const { wrapper } = await import("axios-cookiejar-support");
      const { CookieJar } = await import("tough-cookie");
      const jar = new CookieJar();
      const http = wrapper(axios.create({
        jar,
        maxRedirects: 15,
        timeout: 30000,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36" },
      }));

      // Get SSO redirect URL
      const ssoResp = await axios.post(
        "https://sjapp.sejong.ac.kr/api/secureapi/sso/external-link",
        { targetUrl: "https://sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=" },
        { headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" } },
      );
      const redirectUrl = ssoResp.data?.data?.redirectUrl;
      if (redirectUrl) {
        await http.get(redirectUrl);
        await http.get("https://sjpt.sejong.ac.kr/main/view/Login/doSsoLogin.do?p=");
      }

      // Now get libseat token via library redirect
      this.libseatHttp = http;
      this.libseatToken = await acquireLibseatToken(http);
    }
    return { http: this.libseatHttp, token: this.libseatToken };
  }
}
