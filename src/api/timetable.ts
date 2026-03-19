import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface AvailableSemester {
  year: string;
  smtCd: string;
}

export interface TimetableSlot {
  dayCd: string;
  hourCd: string;
  timeSlot: string;
  curiNm: string;
  roomNmAlias: string;
  empNm: string;
  className: string;
  lesnTime: string;
  curiNo: string;
  curiTypeCdNm: string;
  year: string;
  smtCd: string;
}

export interface TimetableResponse {
  year: string;
  smtCd: string;
  courses: TimetableSlot[];
  cyberLectures?: string[];
}

export interface EnrolledCourse {
  id: string;
  name: string;
  category: string;
  credits: number;
  building: string;
  room: string;
  professor: string;
  curiNo: string;
  className: string;
}

export interface CreditSummary {
  totalCourses: number;
  totalCredits: number;
  major: { required: { courses: number; credits: number }; elective: { courses: number; credits: number } };
  general: { required: { courses: number; credits: number }; elective: { courses: number; credits: number } };
}

export interface EnrolledCoursesResponse {
  courses: EnrolledCourse[];
  creditSummary: CreditSummary;
}

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function getAvailableSemesters(accessToken: string): Promise<AvailableSemester[]> {
  const resp = await client(accessToken).get<ApiResponse<AvailableSemester[]>>("/api/secureapi/class-schedule/available-semesters");
  return unwrap(resp);
}

export async function getTimetable(accessToken: string, year: string, smtCd: string): Promise<TimetableResponse> {
  const resp = await client(accessToken).get<ApiResponse<TimetableResponse>>("/api/secureapi/class-schedule/timetable", { params: { year, smtCd } });
  return unwrap(resp);
}

export async function getEnrolledCourses(accessToken: string, year: string, smtCd: string): Promise<EnrolledCoursesResponse> {
  const resp = await client(accessToken).get<ApiResponse<EnrolledCoursesResponse>>("/api/secureapi/class-schedule/enrolled-courses", { params: { year, smtCd } });
  return unwrap(resp);
}
