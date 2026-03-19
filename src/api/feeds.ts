import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData, Feed, FeedType, FeedLatestResponse } from "../types.js";

export async function getFeedList(type: FeedType, page = 0, size = 10): Promise<PagedData<Feed> | FeedLatestResponse> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<PagedData<Feed> | FeedLatestResponse>>(
    `/api/publicapi/feeds/${type}`,
    { params: { page, size } },
  );
  return unwrap(resp);
}
