import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData, QnA, QnACategory, CreateQnARequest } from "../types.js";

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function getCategories(): Promise<QnACategory[]> {
  const c = createSjappClient();
  const resp = await c.get<ApiResponse<QnACategory[]>>("/api/publicapi/qna/categories");
  return unwrap(resp);
}

export async function getMyList(accessToken: string, page = 0, size = 10): Promise<PagedData<QnA>> {
  const resp = await client(accessToken).get<ApiResponse<PagedData<QnA>>>("/api/secureapi/qna/my", { params: { page, size } });
  return unwrap(resp);
}

export async function getDetail(accessToken: string, id: number): Promise<QnA> {
  const resp = await client(accessToken).get<ApiResponse<QnA>>(`/api/secureapi/qna/${id}`);
  return unwrap(resp);
}

export async function create(accessToken: string, data: CreateQnARequest): Promise<QnA> {
  const resp = await client(accessToken).post<ApiResponse<QnA>>("/api/secureapi/qna", data);
  return unwrap(resp);
}

export async function update(accessToken: string, id: number, data: Partial<CreateQnARequest>): Promise<QnA> {
  const resp = await client(accessToken).put<ApiResponse<QnA>>(`/api/secureapi/qna/${id}`, data);
  return unwrap(resp);
}

export async function remove(accessToken: string, id: number): Promise<void> {
  await client(accessToken).delete(`/api/secureapi/qna/${id}`);
}
