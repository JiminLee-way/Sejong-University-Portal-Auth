import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData, Staff } from "../types.js";

export async function search(accessToken: string, page = 0, size = 20): Promise<PagedData<Staff>> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get<ApiResponse<PagedData<Staff>>>("/api/secureapi/adm/staff", { params: { page, size } });
  return unwrap(resp);
}
