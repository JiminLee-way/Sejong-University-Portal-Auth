// ── Common ──

export interface ApiResponse<T> {
  status: "success" | "error";
  code: string;
  message: string;
  data: T;
  timestamp: string;
  httpStatus: string | number;
  success: boolean;
}

export interface PagedData<T> {
  content: T[];
  pageable?: { pageNumber: number; pageSize: number };
  page?: number;
  size?: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  status: "error";
  code: string;
  message: string;
  traceId?: string;
  path?: string;
  httpStatus: number;
  errorCode?: string;
  details?: { fieldErrors?: { field: string; message: string }[] };
}

// ── Auth ──

export interface AuthToken {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  roleName: string;
  departmentName: string;
  organizationClassName?: string;
  birthDate: string;
  studentYear: number;
  cardNo: string;
  cardNoIos: string;
  cardCount: number;
  cmsUserId: string;
  rememberMe: boolean;
  ssoToken: string | null;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  roleName: string;
  departmentName: string;
  organizationClassName?: string;
  birthDate: string;
  studentYear: number;
  cardNo: string;
  cardNoIos: string;
  cardCount: number;
  cmsUserId: string;
}

// ── Grades ──

export interface SemesterSummary {
  reqCdt: number;
  appCdt: number;
  avgMrks: number;
}

export interface GradeCourse {
  curiNo: string;
  curiNm: string;
  curiTypeCdNm: string;
  cdt: number;
  grade: string;
  mrks: number;
  [key: string]: unknown;
}

export interface GradeSemester {
  yearSmtNm: string;
  year: number;
  smtCd: string;
  summary: SemesterSummary;
  courses: GradeCourse[];
}

export interface GradeOverallSummary {
  reqCdt: number;
  appCdt: number;
  totMrks: number;
  gruCdt: number;
  avgMrks: number;
  sco: number;
}

export interface GradeAllResponse {
  overallSummary: GradeOverallSummary;
  semesters: GradeSemester[];
}

export interface GradeCurrentResponse {
  year: string;
  smtCd: string;
  smtCdNm: string;
  summary: SemesterSummary;
  courses: GradeCourse[];
}

// ── Notices ──

export type NoticeCategory =
  | "general" | "academic" | "scholarship" | "employment"
  | "international" | "recruitment" | "engineering" | "library";

export interface Notice {
  id: string;
  categoryCode: string;
  categoryName: string;
  categoryType: string;
  title: string;
  summary: string | null;
  writerName: string;
  writtenAt: string;
  viewCount: number;
  hasAttachment?: boolean;
  isNew?: boolean;
  [key: string]: unknown;
}

// ── News ──

export type NewsType = "news" | "media" | "press" | "sejong-webzine" | "engineering-webzine";

export interface News {
  id: string;
  categoryCode: string;
  categoryName: string;
  categoryType: string;
  title: string;
  summary: string | null;
  writerName?: string;
  writtenAt: string;
  viewCount?: number;
  thumbnailUrl?: string | null;
  [key: string]: unknown;
}

// ── Feeds ──

export type FeedType = "latest" | "blog" | "youtube";

export interface Feed {
  id: number;
  source: string;
  sourceName: string;
  title: string;
  link: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  new?: boolean;
}

export interface FeedLatestResponse {
  feeds: Feed[];
}

// ── Schedules ──

export interface Schedule {
  id: number;
  title: string;
  startAt?: string;
  endAt?: string;
  categoryId?: number;
  tags?: ScheduleTag[];
  memo?: string;
  completed?: boolean;
  [key: string]: unknown;
}

export interface ScheduleCategory {
  id: number;
  name: string;
  color?: string;
}

export interface ScheduleTag {
  id: number;
  name: string;
}

export interface CreateScheduleRequest {
  title: string;
  startAt?: string;
  endAt?: string;
  categoryId?: number;
  memo?: string;
}

// ── QnA ──

export interface QnACategory {
  categoryId: string;
  categoryName: string;
  description: string;
  displayOrder?: number;
  active: boolean;
}

export interface QnA {
  id: number;
  categoryId?: string;
  categoryName?: string;
  title: string;
  content?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreateQnARequest {
  categoryId: string;
  title: string;
  content: string;
}

// ── Staff ──

export interface Staff {
  id: number;
  name: string;
  department: string;
  phone: string | null;
  mobile: string | null;
  email: string | null;
}

// ── Notifications ──

export interface Notification {
  id: number;
  category?: string;
  content?: string;
  readAt?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface UnreadCount {
  unreadCount: number;
  unreadByCategory: Record<string, number>;
}

export interface NotificationSettings {
  masterEnabled: boolean;
  settings: { categoryId: string; enabled: boolean }[];
}

// ── Library Seats (libseat) ──

export interface ReadingRoom {
  roomNo: number;
  name: string;
  usedSeats: number;
  totalSeats: number;
  occupancyRate: number;
}

export interface MySeat {
  roomName: string;
  seatNumber: string;
  usageTime: string;
  extensionCount: number;
  isAssigned: boolean;
}

export type SeatStatusType = "available" | "occupied" | "reserved";

export interface SeatStatus {
  seatNumber: number;
  status: SeatStatusType;
}

export interface SeatMapResponse {
  roomNo: number;
  roomName: string;
  seats: SeatStatus[];
}

export type FacilityType = "studyroom" | "cinema" | "slounge";

export interface FacilityRoom {
  facilityType: FacilityType;
  name: string;
  available: boolean;
}

export interface SeatActionResult {
  success: boolean;
  action: "reserve" | "extend" | "return";
  roomName?: string;
  seatNumber?: number;
  message: string;
}

// ── Seat Layout (physical) ──

export type SeatLayoutCell =
  | {
      type: "seat";
      seatId: number;
      status: SeatStatusType;
      orientation?: "left" | "right" | "top" | "bottom";
      colspan?: number;
      rowspan?: number;
    }
  | { type: "gap"; width: number; colspan?: number; rowspan?: number }
  | { type: "empty"; colspan?: number; rowspan?: number };

export interface SeatLayoutRow {
  cells: SeatLayoutCell[];
  gapAfter?: number;
}

export interface SeatLayoutBlock {
  rows: SeatLayoutRow[];
  style?: { marginTop?: number; marginLeft?: number; cellspacing?: number; cellpadding?: number };
}

export interface SeatLayoutResponse {
  roomNo: number;
  roomName: string;
  totalSeats: number;
  occupiedSeats: number[];
  blocks: SeatLayoutBlock[];
}

// ── Seat Coordinates (pixel-level) ──

export interface SeatCoord {
  seatId: number;
  status: SeatStatusType;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation?: "left" | "right" | "top" | "bottom";
}

export interface SeatMapCoords {
  roomNo: number;
  roomName: string;
  mapImageUrl: string;
  seatWidth: number;
  seatHeight: number;
  totalSeats: number;
  seats: SeatCoord[];
}
