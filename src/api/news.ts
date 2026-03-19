import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData, News, NewsType } from "../types.js";

export async function getNewsList(type: NewsType, page = 0, size = 10): Promise<PagedData<News>> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<PagedData<News>>>(`/api/publicapi/sejong-news/${type}`, { params: { page, size } });
  return unwrap(resp);
}

export async function getNewsDetail(type: NewsType, id: string): Promise<News> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<News>>(`/api/publicapi/sejong-news/${type}/${id}`);
  return unwrap(resp);
}
