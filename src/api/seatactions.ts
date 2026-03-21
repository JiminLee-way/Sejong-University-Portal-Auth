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
        roomName: params.room_no ? `열람실 ${params.room_no}` : params.roomNo ? `열람실 ${params.roomNo}` : undefined,
        seatNumber: params.seat_no ? Number(params.seat_no) : params.seatNo ? Number(params.seatNo) : undefined,
        message: msg || "성공",
      };
    }

    throw new PortalError(msg || `좌석 ${action} 실패 (code: ${code})`);
  } catch (e) {
    if (e instanceof PortalError) throw e;
    throw new ParseError(`Seat action ${action} failed: ${e}`);
  }
}

// ── 좌석 예약 (setSeat) ──

export async function setSeat(
  http: AxiosInstance,
  token: string,
  userId: string,
  roomNo: number,
  seatNo: number,
): Promise<SeatActionResult> {
  return postSeatAction(http, "setSeat.php", {
    token,
    userID: userId,
    room_no: String(roomNo),
    seat_no: String(seatNo),
  }, "reserve");
}

// ── 좌석 발권확정 (confirmSeat) ──

export async function confirmSeat(
  http: AxiosInstance,
  token: string,
  userId: string,
  roomNo: number,
  seatNo: number,
): Promise<SeatActionResult> {
  return postSeatAction(http, "confirmSeat.php", {
    token,
    userID: userId,
    room_no: String(roomNo),
    seat_no: String(seatNo),
  }, "reserve");
}

// ── 좌석 연장 (extdSeat) ──

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

// ── 좌석 반납 (returnSeat) ──

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

// ── 스터디룸 예약 (sroomReserve) ──

/**
 * 시설 예약 (스터디룸/시네마룸/S-Lounge 공통)
 * @param roomNo - 호실 번호 (sroomNo)
 * @param reserveDate - 예약일 (YYYYMMDD)
 * @param startTime - 시작 시간 (예: 1000 = 10:00)
 * @param useTime - 사용 시간(분) (예: 120 = 2시간)
 * @param userName - 예약자 이름
 */
export async function reserveStudyRoom(
  http: AxiosInstance,
  token: string,
  userId: string,
  roomNo: number,
  reserveDate: string,
  startTime: number,
  useTime = 120,
  userName = "",
): Promise<SeatActionResult> {
  return postSeatAction(http, "sroomReserve.php", {
    userID: userId,
    userName,
    roomNo: String(roomNo),
    reserveDate,
    startTime: String(startTime),
    useTime: String(useTime),
  }, "reserve");
}

// ── 스터디룸 취소 (cancelSroom) ──

export async function cancelStudyRoom(
  http: AxiosInstance,
  token: string,
  userId: string,
  reserveNo: string,
): Promise<SeatActionResult> {
  return postSeatAction(http, "cancelSroom.php", {
    token,
    userID: userId,
    reserveNo,
  }, "return");
}

// ── 하위 호환용 alias ──

export const reserveSeat = setSeat;
