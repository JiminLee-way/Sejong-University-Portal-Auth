export { SejongClient } from "./client.js";

export type {
  Grade,
  GradeReport,
  CreditSummary,
  Enrollment,
  EnrollmentReport,
  Scholarship,
  ScholarshipReport,
  ReadingRoom,
  MySeat,
  SeatStatus,
  SeatStatusType,
  SeatMapResponse,
  FacilityRoom,
  FacilityType,
  StudentCard,
} from "./types.js";

export { Semester, parseSemester } from "./types.js";

export {
  SejongAuthError,
  LoginFailedError,
  SessionExpiredError,
  NetworkError,
  PortalError,
  ParseError,
} from "./errors.js";
