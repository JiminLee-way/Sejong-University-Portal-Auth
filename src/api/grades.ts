import type { SessionInfo } from "../session.js";
import { ParseError, PortalError } from "../errors.js";
import { parseSemester } from "../types.js";
import type { Grade, CreditSummary, GradeReport } from "../types.js";

const SJPT = "https://sjpt.sejong.ac.kr";
const JSON_HEADERS = {
  "Content-Type": 'application/json; charset="UTF-8"',
  Accept: "application/json",
};

export async function fetchGrades(
  session: SessionInfo,
  addParam: string,
): Promise<GradeReport> {
  const { http, userId } = session;

  try {
    // Page onload (required by WebSquare)
    await http.post(
      `${SJPT}/sch/sch/sug/SugRecordQ/doOnload.do`,
      null,
      { params: { addParam }, headers: JSON_HEADERS },
    );

    // Student info
    const studentResp = await http.post(
      `${SJPT}/sch/sch/sys/SchStudentBaseInfo/doStudent.do`,
      {
        dm_reqKey: {
          keyOrgnClsfCd: "20",
          keyStudentNo: userId,
          keyStudentImagPath: "",
          keyYear: "",
          keySmtCd: "",
        },
      },
      { params: { addParam }, headers: JSON_HEADERS },
    );
    const studentData = studentResp.data;

    // Grade list
    const gradeResp = await http.post(
      `${SJPT}/sch/sch/sug/SugRecordQ/doList.do`,
      {
        dm_search: {
          ORGN_CLSF_CD: "20",
          YEAR: "",
          SMT_CD: "",
          RECORD_YN: "Y",
          STUDENT_NO: userId,
          STUDENT_NM: "",
          YEAR_SMT: "",
        },
      },
      { params: { addParam }, headers: JSON_HEADERS },
    );
    const gradeData = gradeResp.data;

    if (gradeData._SUBMIT_ERROR_) {
      throw new PortalError(
        `[grades] ${gradeData._SUBMIT_ERROR_.ERRMSG ?? "Unknown error"}`,
      );
    }

    return buildGradeReport(studentData, gradeData, userId);
  } catch (e) {
    if (e instanceof PortalError || e instanceof ParseError) throw e;
    throw new ParseError(`Failed to fetch grades: ${e}`);
  }
}

function buildGradeReport(
  studentData: Record<string, unknown>,
  gradeData: Record<string, unknown>,
  userId: string,
): GradeReport {
  const studentList = studentData.dl_main as Record<string, unknown>[] | undefined;
  const sInfo = studentList?.[0] ?? {};

  const rawGrades = gradeData.dl_main as Record<string, unknown>[] ?? [];
  const summaryList = gradeData.dl_summary as Record<string, unknown>[] | undefined;
  const summary = summaryList?.[0] ?? {};

  const grades: Grade[] = rawGrades.map((r) => ({
    year: Number(r.YEAR ?? 0),
    semester: parseSemester(String(r.SMT_CD_NM ?? r.SMT_CD ?? "")),
    courseCode: String(r.CURI_NO ?? ""),
    section: String(r.CLASS ?? r.CURI_CLASS ?? ""),
    courseName: String(r.CURI_NM ?? ""),
    courseType: String(r.CURI_TYPE_CD_NM ?? ""),
    graduationCourseType: String(r.SUH_CURI_TYPE_CD_NM ?? ""),
    credit: Number(r.CDT ?? 0),
    grade: String(r.GRADE ?? ""),
    gradePoint: Number(r.MRKS ?? 0),
    evaluationType: String(r.GRADE_TYPE_CD_NM ?? ""),
    retake: Boolean(r.RE_YEAR),
    electiveArea: r.SLT_DOMAIN_CD_NM ? String(r.SLT_DOMAIN_CD_NM) : undefined,
    teachingArea: r.DOMAIN_CD_NM ? String(r.DOMAIN_CD_NM) : undefined,
  }));

  const creditSummary: CreditSummary = {
    liberalRequired: Number(summary.CUL_CDT ?? 0),
    majorRequired: Number(summary.MAJ_CDT ?? 0),
    majorElective: Number(summary.MAJ_SEL ?? 0),
    majorBasic: Number(summary.MAJ_BAS ?? 0),
    majorTotal: Number(summary.MAJ_TOT ?? 0),
  };

  return {
    studentId: userId,
    studentName: String(sInfo.NM ?? ""),
    major: String(sInfo.DEPT_ALIAS ?? ""),
    yearLevel: Number(sInfo.STUDENT_YEAR ?? 0),
    grades,
    creditSummary,
    totalGpa: Number(summary.AVG_MRKS ?? 0),
    totalEarnedCredits: Number(summary.APP_CDT ?? 0),
    totalAttemptedCredits: Number(summary.REQ_CDT ?? 0),
    liberalGpa: Number(summary.CUL_AVG_MRKS ?? 0),
    majorGpa: Number(summary.MAJ_AVG_MRKS ?? 0),
    percentile: Number(summary.TOT_MRKS ?? 0),
  };
}
