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

/**
 * Fetch seat layout — physical grid matching the actual room layout.
 *
 * Parses the HTML table structure from libseat exactly:
 * - `<td class="desk">` → available seat
 * - `<td class="desk_over">` → occupied seat
 * - `<td style="width:55px">` → gap (aisle between desk groups)
 * - `<tr style="height:54px">` → vertical gap between rows
 * - `<table style="margin-top:45px; margin-left:78px">` → block position
 */
export async function fetchSeatLayout(
  http: AxiosInstance,
  token: string,
  roomNo: number,
): Promise<import("../types.js").SeatLayoutResponse> {
  try {
    const resp = await http.get(`${LIBSEAT_BASE}/seatMap.php`, {
      params: { param_room_no: roomNo, token },
    });
    const html = typeof resp.data === "string" ? resp.data : "";
    const $ = cheerio.load(html);

    const blocks: import("../types.js").SeatLayoutBlock[] = [];
    let totalSeats = 0;
    const occupiedSeats: number[] = [];

    $("table").each((_, tableEl) => {
      const tableHtml = $(tableEl).html() || "";
      // Only tables with seat links: setSeat('roomNo','seatNo')
      if (!tableHtml.includes("setSeat")) return;

      // Parse block position from inline style
      const tableStyle = $(tableEl).attr("style") || "";
      const mtMatch = tableStyle.match(/margin-top:\s*(-?\d+)px/);
      const mlMatch = tableStyle.match(/margin-left:\s*(-?\d+)px/);
      const cellspacingAttr = $(tableEl).attr("cellspacing");
      const cellpaddingAttr = $(tableEl).attr("cellpadding");
      
      const cellspacing = cellspacingAttr ? parseInt(cellspacingAttr, 10) : undefined;
      const cellpadding = cellpaddingAttr ? parseInt(cellpaddingAttr, 10) : undefined;

      const style: import("../types.js").SeatLayoutBlock["style"] = {
        marginTop: mtMatch ? parseInt(mtMatch[1], 10) : 0,
        marginLeft: mlMatch ? parseInt(mlMatch[1], 10) : 0,
      };
      
      if (cellspacing !== undefined && !isNaN(cellspacing)) style.cellspacing = cellspacing;
      if (cellpadding !== undefined && !isNaN(cellpadding)) style.cellpadding = cellpadding;

      const rows: import("../types.js").SeatLayoutRow[] = [];

      $(tableEl).find("tr").each((_, tr) => {
        // Check if this is a spacing row (height gap)
        const trStyle = $(tr).attr("style") || "";
        const hMatch = trStyle.match(/height:\s*(\d+)px/);
        if (hMatch && $(tr).find("td").length === 0) {
          // Pure gap row — attach gap to previous row
          if (rows.length > 0) {
            rows[rows.length - 1].gapAfter = parseInt(hMatch[1], 10);
          }
          return;
        }

        const cells: import("../types.js").SeatLayoutCell[] = [];
        let hasSeat = false;

        $(tr).find("td").each((_, td) => {
          const cls = $(td).attr("class") || "";
          const tdStyle = $(td).attr("style") || "";
          const id = $(td).attr("id") || "";
          const text = $(td).text().trim();
          
          const colStr = $(td).attr("colspan");
          const rowStr = $(td).attr("rowspan");
          const colspan = colStr ? parseInt(colStr, 10) : undefined;
          const rowspan = rowStr ? parseInt(rowStr, 10) : undefined;

          if (cls.startsWith("desk")) {
            // Seat cell — desk = available, desk_over = occupied
            const seatId = parseInt(id || text, 10);
            if (!isNaN(seatId)) {
              const isOccupied = cls.includes("_over");
              let orientation: "left" | "right" | "top" | "bottom" = "bottom";
              if (cls.includes("deskL")) orientation = "left";
              else if (cls.includes("deskR")) orientation = "right";
              else if (cls.includes("deskT")) orientation = "top";
              
              totalSeats++;
              if (isOccupied) occupiedSeats.push(seatId);
              hasSeat = true;
              
              const cellData: import("../types.js").SeatLayoutCell = {
                type: "seat",
                seatId,
                status: isOccupied ? "occupied" : "available",
                orientation,
              };
              if (colspan && !isNaN(colspan)) cellData.colspan = colspan;
              if (rowspan && !isNaN(rowspan)) cellData.rowspan = rowspan;
              cells.push(cellData);
            }
          } else {
            // Gap/spacer cell — extract width
            const wMatch = tdStyle.match(/width:\s*(\d+)px/);
            
            if (wMatch) {
              const cellData: import("../types.js").SeatLayoutCell = { type: "gap", width: parseInt(wMatch[1], 10) };
              if (colspan && !isNaN(colspan)) cellData.colspan = colspan;
              if (rowspan && !isNaN(rowspan)) cellData.rowspan = rowspan;
              cells.push(cellData);
            } else {
              const cellData: import("../types.js").SeatLayoutCell = { type: "empty" };
              if (colspan && !isNaN(colspan)) cellData.colspan = colspan;
              if (rowspan && !isNaN(rowspan)) cellData.rowspan = rowspan;
              cells.push(cellData);
            }
          }
        });

        if (cells.length > 0 && hasSeat) {
          rows.push({ cells });
        }
      });

      if (rows.length > 0) blocks.push({ rows, style });
    });

    const roomName = $("h4, h5, .room-name").first().text().trim() || `열람실 ${roomNo}`;

    return {
      roomNo,
      roomName,
      totalSeats,
      occupiedSeats: occupiedSeats.sort((a, b) => a - b),
      blocks,
    };
  } catch (e) {
    throw new ParseError(`Failed to parse seat layout: ${e}`);
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

/**
 * Fetch seat map with exact pixel coordinates for each seat.
 *
 * Calculates (x, y) position of every seat by:
 * 1. Table margin-top/margin-left → block origin
 * 2. Cumulative cell widths (seat=35px, gap=Npx) → x offset
 * 3. Cumulative row heights (seat=36px, gap tr=Npx) → y offset
 * 4. cellspacing between cells
 *
 * Also returns the floor plan background image URL.
 */
export async function fetchSeatCoords(
  http: AxiosInstance,
  token: string,
  roomNo: number,
): Promise<import("../types.js").SeatMapCoords> {
  try {
    const resp = await http.get(`${LIBSEAT_BASE}/seatMap.php`, {
      params: { param_room_no: roomNo, token },
    });
    const html = typeof resp.data === "string" ? resp.data : "";
    const $ = cheerio.load(html);

    // Seat dimensions from CSS
    const SEAT_W = 35;
    const SEAT_H = 36;

    // Map background image
    const mapImageMatch = html.match(new RegExp(`map_${String(roomNo).padStart(2, "0")}\\.jpg|map_${roomNo}\\.jpg`));
    const mapImageUrl = mapImageMatch
      ? `https://libseat.sejong.ac.kr/mobile/MA/../images/${mapImageMatch[0]}`
      : "";

    const roomName = $("h4, h5, .room-name").first().text().trim() || `열람실 ${roomNo}`;

    const seats: import("../types.js").SeatCoord[] = [];

    // Track cumulative Y from document flow (tables are position:relative)
    let flowY = 0;

    $("table").each((_, tableEl) => {
      const tableHtml = $(tableEl).html() || "";
      if (!tableHtml.includes("setSeat")) return;

      const style = $(tableEl).attr("style") || "";
      const mtMatch = style.match(/margin-top:\s*(-?\d+)px/);
      const mlMatch = style.match(/margin-left:\s*(-?\d+)px/);
      const cs = parseInt($(tableEl).attr("cellspacing") || "0", 10) || 0;

      const blockX = mlMatch ? parseInt(mlMatch[1], 10) : 0;
      const marginTop = mtMatch ? parseInt(mtMatch[1], 10) : 0;

      // position: relative means margin-top affects flow position
      flowY += marginTop;
      const blockY = flowY;

      let rowY = 0;

      $(tableEl).find("tr").each((_, tr) => {
        const trStyle = $(tr).attr("style") || "";
        const hMatch = trStyle.match(/height:\s*(\d+)px/);

        // Gap-only row
        if (hMatch && $(tr).find("td").length === 0) {
          rowY += parseInt(hMatch[1], 10);
          return;
        }

        let cellX = 0;
        let rowHasSeats = false;

        $(tr).find("td").each((_, td) => {
          const cls = $(td).attr("class") || "";
          const tdStyle = $(td).attr("style") || "";
          const id = $(td).attr("id") || "";
          const text = $(td).text().trim();

          if (cls.startsWith("desk")) {
            const seatId = parseInt(id || text, 10);
            if (!isNaN(seatId)) {
              const isOccupied = cls.includes("_over");
              let orientation: "left" | "right" | "top" | "bottom" | undefined;
              if (cls.includes("deskL")) orientation = "left";
              else if (cls.includes("deskR")) orientation = "right";
              else if (cls.includes("deskT")) orientation = "top";

              seats.push({
                seatId,
                status: isOccupied ? "occupied" : "available",
                x: blockX + cellX,
                y: blockY + rowY,
                width: SEAT_W,
                height: SEAT_H,
                orientation,
              });
              rowHasSeats = true;
            }
            cellX += SEAT_W + cs;
          } else {
            // Gap or empty cell
            const wMatch = tdStyle.match(/width:\s*(\d+)px/);
            if (wMatch) {
              cellX += parseInt(wMatch[1], 10) + cs;
            }
          }
        });

        if (rowHasSeats) {
          rowY += SEAT_H + cs;
        }
        // Height gap from tr style
        if (hMatch) {
          rowY += parseInt(hMatch[1], 10);
        }
      });

      flowY += rowY;
    });

    return {
      roomNo,
      roomName,
      mapImageUrl,
      seatWidth: SEAT_W,
      seatHeight: SEAT_H,
      totalSeats: seats.length,
      seats: seats.sort((a, b) => a.seatId - b.seatId),
    };
  } catch (e) {
    throw new ParseError(`Failed to parse seat coords: ${e}`);
  }
}

/** Fetch study room reservation page to get available rooms/times */
export async function fetchStudyRoomReservation(
  http: AxiosInstance,
  token: string,
): Promise<{ rooms: { id: string; name: string }[] }> {
  try {
    const resp = await http.get(`${LIBSEAT_BASE}/sroomReserveMain.php`, {
      params: { token },
    });
    const $ = cheerio.load(resp.data);
    const rooms: { id: string; name: string }[] = [];

    $("a[href*='sroomMap'], .room-item, option, li").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || $(el).attr("value") || "";
      const idMatch = href.match(/room_no=(\d+)/) || href.match(/^(\d+)$/);
      if (text && text.length < 100 && (idMatch || text.includes("스터디룸"))) {
        rooms.push({
          id: idMatch?.[1] || text,
          name: text.replace(/\s+/g, " "),
        });
      }
    });

    return { rooms };
  } catch (e) {
    throw new ParseError(`Failed to parse study room reservation: ${e}`);
  }
}
