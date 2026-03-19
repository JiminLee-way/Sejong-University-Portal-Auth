import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData, Notice, NoticeCategory } from "../types.js";

export async function getList(
  category: NoticeCategory,
  page = 0,
  size = 10,
): Promise<PagedData<Notice>> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<PagedData<Notice>>>(
    `/api/publicapi/university-notice/${category}`,
    { params: { page, size } },
  );
  return unwrap(resp);
}

export async function getDetail(
  category: NoticeCategory,
  id: string,
): Promise<Notice> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<Notice>>(
    `/api/publicapi/university-notice/${category}/${id}`,
  );
  return unwrap(resp);
}

export async function getLatest(
  type: NoticeCategory,
  size = 5,
): Promise<Notice[]> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<Notice[]>>(
    "/api/publicapi/university-notice/latest",
    { params: { type, size } },
  );
  return unwrap(resp);
}
