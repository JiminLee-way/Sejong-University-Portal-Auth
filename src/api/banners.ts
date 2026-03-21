import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface Banner {
  bannerId: string;
  sortOrder: number;
  imageUrl: string;
  altText: string;
  titleName: string;
  linkUrl: string;
  targetType: string;
}

export async function getBanners(type = "MAIN"): Promise<Banner[]> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<Banner[]>>("/api/publicapi/home-banners", { params: { type } });
  return unwrap(resp);
}
