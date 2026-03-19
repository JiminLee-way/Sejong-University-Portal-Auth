import type { SessionInfo } from "../session.js";
import { ParseError } from "../errors.js";
import type { StudentCard } from "../types.js";

const SJPT = "https://sjpt.sejong.ac.kr";
const JSON_HEADERS = {
  "Content-Type": 'application/json; charset="UTF-8"',
  Accept: "application/json",
};

/**
 * Fetch student card number from portal student info API.
 * The doStudent.do response contains extensive personal info —
 * the card number may be in fields like VA_NO, COM_CD, etc.
 */
export async function fetchStudentCard(
  session: SessionInfo,
  addParam: string,
): Promise<StudentCard> {
  try {
    const resp = await session.http.post(
      `${SJPT}/sch/sch/sys/SchStudentBaseInfo/doStudent.do`,
      {
        dm_reqKey: {
          keyOrgnClsfCd: "20",
          keyStudentNo: session.userId,
          keyStudentImagPath: "",
          keyYear: "",
          keySmtCd: "",
        },
      },
      { params: { addParam }, headers: JSON_HEADERS },
    );

    const data = resp.data;
    const studentList = data.dl_main as Record<string, unknown>[] | undefined;
    const info = studentList?.[0] ?? {};

    // Search for card number in known fields
    // From APK analysis: S1PassConfig stores cardNo
    // The portal student API may have it in various fields
    const candidateFields = [
      "VA_NO",          // 가상번호
      "COM_CD",         // 출입카드
      "STUDENT_NO_ENC", // 암호화된 학번
      "SSN",            // 식별번호
      "SCHO_CD",        // 장학코드 (아닐 수 있음)
    ];

    let cardNo = "";
    for (const field of candidateFields) {
      const val = info[field];
      if (val && typeof val === "string" && val.trim()) {
        cardNo = val.trim();
        break;
      }
    }

    // Fallback: use student number as card identifier
    if (!cardNo) {
      cardNo = String(info.STUDENT_NO ?? session.userId);
    }

    return {
      cardNo,
      isIssued: cardNo !== session.userId, // true if found a real card number
    };
  } catch (e) {
    throw new ParseError(`Failed to fetch student card: ${e}`);
  }
}
