import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface StudyRoomReservation {
  roomNumber: string;
  roomName: string;
  status: string;
  requestDateTime: string;
}

export interface StudyRoomReservationsResponse {
  reservations: StudyRoomReservation[];
}

export async function getReservations(accessToken: string): Promise<StudyRoomReservationsResponse> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get<ApiResponse<StudyRoomReservationsResponse>>("/api/secureapi/study-room/reservations");
  return unwrap(resp);
}
