export { SejongClient } from "./client.js";

export type {
  ApiResponse,
  PagedData,
  AuthToken,
  UserProfile,
  GradeAllResponse,
  GradeCurrentResponse,
  GradeSemester,
  GradeCourse,
  GradeOverallSummary,
  SemesterSummary,
  NoticeCategory,
  Notice,
  NewsType,
  News,
  FeedType,
  Feed,
  FeedLatestResponse,
  Schedule,
  ScheduleCategory,
  ScheduleTag,
  CreateScheduleRequest,
  QnA,
  QnACategory,
  CreateQnARequest,
  Staff,
  Notification,
  UnreadCount,
  NotificationSettings,
  ReadingRoom,
  MySeat,
  SeatStatus,
  SeatStatusType,
  SeatMapResponse,
  FacilityRoom,
  FacilityType,
  SeatActionResult,
} from "./types.js";

export type { QrCodeResult } from "./api/qr.js";

export type {
  AvailableSemester,
  TimetableSlot,
  TimetableResponse,
  EnrolledCourse,
  EnrolledCoursesResponse,
  CreditSummary,
} from "./api/timetable.js";

export {
  SejongAuthError,
  LoginFailedError,
  SessionExpiredError,
  NetworkError,
  PortalError,
  ParseError,
} from "./errors.js";
