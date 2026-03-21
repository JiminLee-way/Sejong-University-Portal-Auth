import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function getRecords(accessToken: string): Promise<unknown[]> {
  const resp = await client(accessToken).get<ApiResponse<unknown[]>>("/api/secureapi/presence/records");
  return unwrap(resp);
}

export async function getInspections(accessToken: string): Promise<unknown[]> {
  const resp = await client(accessToken).get<ApiResponse<unknown[]>>("/api/secureapi/presence/inspections");
  return unwrap(resp);
}

export async function getStatistics(accessToken: string): Promise<unknown> {
  const resp = await client(accessToken).get<ApiResponse<unknown>>("/api/secureapi/presence/statistics");
  return unwrap(resp);
}

export async function getSettings(accessToken: string): Promise<unknown> {
  const resp = await client(accessToken).get<ApiResponse<unknown>>("/api/secureapi/presence/settings");
  return unwrap(resp);
}
