import type { AxiosInstance } from "axios";
import { PortalError, ParseError } from "../errors.js";
import type { SeatActionResult } from "../types.js";

const LIBSEAT_BASE = "https://libseat.sejong.ac.kr/mobile/MA";

function parseXmlResult(xml: string): { code: string; msg: string } {
  const codeMatch = xml.match(/<resultCode><!\[CDATA\[([^\]]*)\]\]><\/resultCode>/);
  const msgMatch = xml.match(/<resultMsg><!\[CDATA\[([^\]]*)\]\]><\/resultMsg>/);
  return {
    code: codeMatch?.[1] ?? "",
    msg: msgMatch?.[1] ?? "",
  };
}

async function postSeatAction(
  http: AxiosInstance,
  endpoint: string,
  params: Record<string, string>,
  action: SeatActionResult["action"],
): Promise<SeatActionResult> {
  try {
    const resp = await http.post(
      `${LIBSEAT_BASE}/${endpoint}`,
      new URLSearchParams(params).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const body = typeof resp.data === "string" ? resp.data : "";
    const { code, msg } = parseXmlResult(body);

    if (code === "0") {
      return {
        success: true,
        action,
        roomName: params.roomNo ? `열람실 ${params.roomNo}` : undefined,
        seatNumber: params.seatNo ? Number(params.seatNo) : undefined,
        message: msg || "성공",
      };
    }

    throw new PortalError(msg || `좌석 ${action} 실패 (code: ${code})`);
  } catch (e) {
    if (e instanceof PortalError) throw e;
    throw new ParseError(`Seat action ${action} failed: ${e}`);
  }
}

export async function reserveSeat(
  http: AxiosInstance,
  token: string,
  userId: string,
  roomNo: number,
  seatNo: number,
): Promise<SeatActionResult> {
  return postSeatAction(http, "confirmSeat.php", {
    token,
    userID: userId,
    roomNo: String(roomNo),
    seatNo: String(seatNo),
  }, "reserve");
}

export async function extendSeat(
  http: AxiosInstance,
  token: string,
  userId: string,
  roomNo: string,
  seatNo: string,
): Promise<SeatActionResult> {
  return postSeatAction(http, "extdSeat.php", {
    token,
    userID: userId,
    roomNo,
    seatNo,
  }, "extend");
}

export async function returnSeat(
  http: AxiosInstance,
  token: string,
  userId: string,
  roomNo: string,
  seatNo: string,
): Promise<SeatActionResult> {
  return postSeatAction(http, "returnSeat.php", {
    token,
    userID: userId,
    roomNo,
    seatNo,
  }, "return");
}
