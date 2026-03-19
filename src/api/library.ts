import * as cheerio from "cheerio";
import type { AxiosInstance } from "axios";
import { NetworkError, PortalError, ParseError } from "../errors.js";
import type {
  ReadingRoom,
  MySeat,
  SeatStatus,
  SeatMapResponse,
  FacilityRoom,
  FacilityType,
} from "../types.js";

const LIBRARY_SEAT_URL = "https://library.sejong.ac.kr/relation/seat";
const LIBSEAT_BASE = "https://libseat.sejong.ac.kr/mobile/MA";

/**
 * Acquire libseat token by following library.sejong.ac.kr SSO redirect.
 * Requires an authenticated axios instance (with portal SSO cookies).
 */
export async function acquireLibseatToken(
  http: AxiosInstance,
): Promise<string> {
  try {
    const resp = await http.get(LIBRARY_SEAT_URL, { maxRedirects: 5 });
    // The final URL after redirects contains the token
    const finalUrl =
      typeof resp.request?.res?.responseUrl === "string"
        ? resp.request.res.responseUrl
        : (resp.config?.url ?? "");

    // Also check if we were redirected to libseat
    const urlStr = resp.request?.responseURL || finalUrl || String(resp.config?.url);

    // Extract token from URL
    const tokenMatch = urlStr.match(/token=([^&]+)/);
    if (tokenMatch) return decodeURIComponent(tokenMatch[1]);

    // If not in final URL, check response body for redirect
    const body = typeof resp.data === "string" ? resp.data : "";
    const bodyMatch = body.match(/token=([^&'"]+)/);
    if (bodyMatch) return decodeURIComponent(bodyMatch[1]);

    throw new PortalError("Failed to acquire libseat token from redirect");
  } catch (e) {
    if (e instanceof PortalError) throw e;
    throw new NetworkError(`Library access failed: ${e}`);
  }
}

/** Fetch reading room list with occupancy */
export async function fetchRoomList(
  http: AxiosInstance,
  token: string,
): Promise<ReadingRoom[]> {
  try {
    const resp = await http.get(`${LIBSEAT_BASE}/roomList.php`, {
      params: { token },
    });
    const $ = cheerio.load(resp.data);
    const rooms: ReadingRoom[] = [];

    $("a[href*='seatMap']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const text = $(el).find("h5").text().trim() || $(el).text().trim();
      const roomNoMatch = href.match(/param_room_no=(\d+)/);
      const dataMatch = text.match(/(.+?)\s+(\d+)\s*\/\s*(\d+)/);

      if (roomNoMatch && dataMatch) {
        const used = parseInt(dataMatch[2], 10);
        const total = parseInt(dataMatch[3], 10);
        rooms.push({
          roomNo: parseInt(roomNoMatch[1], 10),
          name: dataMatch[1].trim(),
          usedSeats: used,
          totalSeats: total,
          occupancyRate: total > 0 ? Math.round((used / total) * 1000) / 10 : 0,
        });
      }
    });

    return rooms;
  } catch (e) {
    if (e instanceof PortalError || e instanceof ParseError) throw e;
    throw new ParseError(`Failed to parse room list: ${e}`);
  }
}

/** Fetch current user's assigned seat */
export async function fetchMySeat(
  http: AxiosInstance,
  token: string,
): Promise<MySeat> {
  try {
    const resp = await http.get(`${LIBSEAT_BASE}/mySeat.php`, {
      params: { token },
    });
    const $ = cheerio.load(resp.data);

    // Parse seat card area — structure from seatMain.php snapshot
    const roomName = $("h6:contains('열람실')").next().text().trim();
    const seatNumber = $("h6:contains('좌석번호')").next().text().trim();
    const usageTime = $("h6:contains('사용시간')").next().text().trim();
    const extensionText = $("h6:contains('연장')").next().text().trim();
    const extensionCount = parseInt(extensionText, 10) || 0;
    const isAssigned = !!(roomName && seatNumber);

    return { roomName, seatNumber, usageTime, extensionCount, isAssigned };
  } catch (e) {
    throw new ParseError(`Failed to parse my seat: ${e}`);
  }
}

/** Fetch seat map for a specific reading room */
export async function fetchSeatMap(
  http: AxiosInstance,
  token: string,
  roomNo: number,
): Promise<SeatMapResponse> {
  try {
    const resp = await http.get(`${LIBSEAT_BASE}/seatMap.php`, {
      params: { param_room_no: roomNo, token },
    });
    const html = typeof resp.data === "string" ? resp.data : "";

    // The script lists ONLY occupied seats with getElementById + _over pattern.
    // Each occupied seat has a block like:
    //   if(document.getElementById('N')){ var clsName = ...; ...setAttribute("class",clsName+"_over"); }
    // Extract seat IDs from these blocks — they are ALL occupied.
    const occupiedIds = new Set<number>();
    const blockPattern = /if\s*\(\s*document\.getElementById\('(\d+)'\)\)/g;
    let match;
    while ((match = blockPattern.exec(html)) !== null) {
      occupiedIds.add(parseInt(match[1], 10));
    }

    // Total seats come from the room list data (passed via roomList).
    // For the seat map, we generate seat numbers 1..N based on the iframe table structure.
    // Use cheerio to find all numbered cells in the seat table.
    const $map = cheerio.load(html);
    const allIds = new Set<number>();
    $map("td, div").each((_, el) => {
      const text = $map(el).text().trim();
      const id = $map(el).attr("id");
      if (id && /^\d+$/.test(id)) {
        allIds.add(parseInt(id, 10));
      } else if (/^\d+$/.test(text) && parseInt(text, 10) > 0 && parseInt(text, 10) < 500) {
        allIds.add(parseInt(text, 10));
      }
    });

    // If cheerio didn't find seat elements, use the occupied list as the full list
    if (allIds.size === 0) {
      occupiedIds.forEach((id) => allIds.add(id));
    }

    const seats: SeatStatus[] = Array.from(allIds)
      .sort((a, b) => a - b)
      .map((id) => ({
        seatNumber: id,
        status: occupiedIds.has(id) ? ("occupied" as const) : ("available" as const),
      }));

    // Room name from page
    const $ = cheerio.load(html);
    const roomName = $("h4, h5, .room-name").first().text().trim() || `열람실 ${roomNo}`;

    return { roomNo, roomName, seats };
  } catch (e) {
    throw new ParseError(`Failed to parse seat map: ${e}`);
  }
}

/** Fetch facility rooms (study rooms, cinema rooms, S-Lounge) */
export async function fetchFacilityRooms(
  http: AxiosInstance,
  token: string,
  type: FacilityType,
): Promise<FacilityRoom[]> {
  const endpoints: Record<FacilityType, string> = {
    studyroom: "sroomList.php",
    cinema: "cinemaList.php",
    slounge: "loungeList.php",
  };

  try {
    const resp = await http.get(`${LIBSEAT_BASE}/${endpoints[type]}`, {
      params: { token },
    });
    const $ = cheerio.load(resp.data);
    const rooms: FacilityRoom[] = [];

    // Generic parsing — facility list items
    $("a[href], .room-item, li").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100 && !text.includes("메인") && !text.includes("학술")) {
        rooms.push({
          facilityType: type,
          name: text.replace(/\s+/g, " "),
          available: !text.includes("사용중") && !text.includes("예약완료"),
        });
      }
    });

    return rooms;
  } catch (e) {
    throw new ParseError(`Failed to parse facility rooms: ${e}`);
  }
}
