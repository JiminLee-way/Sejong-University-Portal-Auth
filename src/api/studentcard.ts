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

    // STUDENT_NO_ENC is the encrypted student number used for NFC card emulation
    const encryptedNo = info.STUDENT_NO_ENC
      ? String(info.STUDENT_NO_ENC).trim()
      : "";

    return {
      cardNo: encryptedNo || String(info.STUDENT_NO ?? session.userId),
      isIssued: !!encryptedNo,
    };
  } catch (e) {
    throw new ParseError(`Failed to fetch student card: ${e}`);
  }
}
