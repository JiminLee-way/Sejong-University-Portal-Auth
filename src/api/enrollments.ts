import type { SessionInfo } from "../session.js";
import { ParseError, PortalError } from "../errors.js";
import { parseSemester } from "../types.js";
import type { Enrollment, EnrollmentReport } from "../types.js";

const SJPT = "https://sjpt.sejong.ac.kr";
const JSON_HEADERS = {
  "Content-Type": 'application/json; charset="UTF-8"',
  Accept: "application/json",
};

export async function fetchEnrollments(
  session: SessionInfo,
  addParam: string,
  year?: string,
  semesterCode?: string,
): Promise<EnrollmentReport> {
  const { http, userId } = session;

  try {
    // Get available semesters
    const ysResp = await http.post(
      `${SJPT}/sch/sch/sue/SueReqLesnQ/doYearsmt.do`,
      {
        dm_search: {
          ORGN_CLSF_CD: "20",
          STUDENT_NO: userId,
          YEAR_SMT: "",
          REQ_LOG_CD: "",
          CDT: "",
          CNT: "",
          YEAR: "",
          SMT_CD: "",
          SMT_CD_NM: "",
        },
      },
      { params: { addParam }, headers: JSON_HEADERS },
    );
    const ysData = ysResp.data;
    const semesters = (ysData.dl_yearSmt ?? []) as Record<string, unknown>[];

    if (!year && semesters.length > 0) {
      year = String(semesters[0].YEAR ?? "2026");
      semesterCode = String(semesters[0].SMT_CD ?? "10");
    }
    year = year ?? "2026";
    semesterCode = semesterCode ?? "10";
    const yearSmt = `${year}${semesterCode}`;

    // Get enrollment list
    const resp = await http.post(
      `${SJPT}/sch/sch/sue/SueReqLesnQ/doList.do`,
      {
        dm_search: {
          ORGN_CLSF_CD: "20",
          STUDENT_NO: userId,
          YEAR_SMT: yearSmt,
          REQ_LOG_CD: "",
          CDT: "",
          CNT: "",
          YEAR: year,
          SMT_CD: semesterCode,
          SMT_CD_NM: "",
        },
      },
      { params: { addParam }, headers: JSON_HEADERS },
    );
    const data = resp.data;

    if (data._SUBMIT_ERROR_) {
      throw new PortalError(
        `[enrollments] ${data._SUBMIT_ERROR_.ERRMSG ?? "Unknown"}`,
      );
    }

    const rawList = (data.dl_main ?? []) as Record<string, unknown>[];
    let totalCredits = 0;
    const enrollments: Enrollment[] = rawList.map((r) => {
      const cdt = Number(r.CDT ?? 0);
      totalCredits += cdt;
      return {
        year: Number(year),
        semester: parseSemester(semesterCode!),
        courseCode: String(r.CURI_NO ?? ""),
        section: String(r.CLASS ?? ""),
        courseName: String(r.CURI_NM ?? ""),
        courseType: String(r.CURI_TYPE_CD_NM ?? ""),
        credit: cdt,
        professor: r.EMP_NM ? String(r.EMP_NM) : undefined,
        timeLocation: r.CORS_SCHE_TIME ? String(r.CORS_SCHE_TIME) : undefined,
      };
    });

    // Fallback: use semester summary if list is empty
    if (!enrollments.length && semesters.length) {
      for (const s of semesters) {
        if (String(s.YEAR) === year && String(s.SMT_CD) === semesterCode) {
          totalCredits = Number(s.TOT_CDT ?? 0);
          break;
        }
      }
    }

    return {
      studentId: userId,
      year: Number(year),
      semester: parseSemester(semesterCode),
      enrollments,
      totalCredits,
    };
  } catch (e) {
    if (e instanceof PortalError || e instanceof ParseError) throw e;
    throw new ParseError(`Failed to fetch enrollments: ${e}`);
  }
}
