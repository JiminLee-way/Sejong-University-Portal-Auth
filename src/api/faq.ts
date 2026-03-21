import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData } from "../types.js";

export interface FaqCategory {
  categoryId: string;
  categoryName: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

export interface FaqItem {
  [key: string]: unknown;
}

export async function getCategories(): Promise<FaqCategory[]> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<FaqCategory[]>>("/api/publicapi/faq/categories");
  return unwrap(resp);
}

export async function getList(page = 0, size = 10, categoryId?: string): Promise<PagedData<FaqItem>> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<PagedData<FaqItem>>>("/api/publicapi/faq", {
    params: { page, size, ...(categoryId ? { categoryId } : {}) },
  });
  return unwrap(resp);
}
