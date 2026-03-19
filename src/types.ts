export enum Semester {
  FIRST = "1학기",
  SECOND = "2학기",
  SUMMER = "여름학기",
  WINTER = "겨울학기",
}

export const SEMESTER_CODE_MAP: Record<string, Semester> = {
  "10": Semester.FIRST,
  "20": Semester.SECOND,
  "11": Semester.SUMMER,
  "21": Semester.WINTER,
};

export const SEMESTER_NAME_MAP: Record<string, Semester> = {
  "1학기": Semester.FIRST,
  "2학기": Semester.SECOND,
  "여름학기": Semester.SUMMER,
  "겨울학기": Semester.WINTER,
};

export function parseSemester(value: string): Semester {
  const result = SEMESTER_NAME_MAP[value] ?? SEMESTER_CODE_MAP[value];
  if (!result) throw new Error(`Unknown semester: ${value}`);
  return result;
}

// ── Grades ──

export interface Grade {
  year: number;
  semester: Semester;
  courseCode: string;
  section: string;
  courseName: string;
  courseType: string;
  graduationCourseType: string;
  credit: number;
  grade: string;
  gradePoint: number;
  evaluationType: string;
  retake: boolean;
  electiveArea?: string;
  teachingArea?: string;
}

export interface CreditSummary {
  liberalRequired: number;
  majorRequired: number;
  majorElective: number;
  majorBasic: number;
  majorTotal: number;
}

export interface GradeReport {
  studentId: string;
  studentName: string;
  major: string;
  yearLevel: number;
  grades: Grade[];
  creditSummary: CreditSummary;
  totalGpa: number;
  totalEarnedCredits: number;
  totalAttemptedCredits: number;
  liberalGpa: number;
  majorGpa: number;
  percentile: number;
}

// ── Enrollments ──

export interface Enrollment {
  year: number;
  semester: Semester;
  courseCode: string;
  section: string;
  courseName: string;
  courseType: string;
  credit: number;
  professor?: string;
  timeLocation?: string;
}

export interface EnrollmentReport {
  studentId: string;
  year: number;
  semester: Semester;
  enrollments: Enrollment[];
  totalCredits: number;
}

// ── Scholarships ──

export interface Scholarship {
  year: number;
  semester: Semester;
  scholarshipName: string;
  amount: number;
}

export interface ScholarshipReport {
  studentId: string;
  scholarships: Scholarship[];
  totalAmount: number;
}
