import type { SessionInfo } from "../session.js";
import { ParseError, PortalError } from "../errors.js";
import { parseSemester } from "../types.js";
import type { Scholarship, ScholarshipReport } from "../types.js";

const SJPT = "https://sjpt.sejong.ac.kr";
const JSON_HEADERS = {
  "Content-Type": 'application/json; charset="UTF-8"',
  Accept: "application/json",
};

export async function fetchScholarships(
  session: SessionInfo,
  addParam: string,
): Promise<ScholarshipReport> {
  const { http, userId } = session;

  try {
    const resp = await http.post(
      `${SJPT}/sch/sch/sub/SubSchoMasterOneQ/doList.do`,
      { dm_search: { ORGN_CLSF_CD: "", STUDENT_NO: userId } },
      { params: { addParam }, headers: JSON_HEADERS },
    );
    const data = resp.data;

    if (data._SUBMIT_ERROR_) {
      throw new PortalError(
        `[scholarships] ${data._SUBMIT_ERROR_.ERRMSG ?? "Unknown"}`,
      );
    }

    const rawList = (data.dl_mainList ?? []) as Record<string, unknown>[];
    let totalAmount = 0;
    const scholarships: Scholarship[] = rawList.map((r) => {
      const amt = Number(r.TOT_SCHO_AMT ?? 0);
      totalAmount += amt;
      return {
        year: Number(r.YEAR ?? 0),
        semester: parseSemester(String(r.SMT_CD ?? "10")),
        scholarshipName: String(r.SCHO_CD_NM ?? r.FIX_SCHO_CD_NM ?? ""),
        amount: amt,
      };
    });

    return { studentId: userId, scholarships, totalAmount };
  } catch (e) {
    if (e instanceof PortalError || e instanceof ParseError) throw e;
    throw new ParseError(`Failed to fetch scholarships: ${e}`);
  }
}
