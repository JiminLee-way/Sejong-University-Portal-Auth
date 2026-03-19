import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, GradeAllResponse, GradeCurrentResponse, GradeSemester } from "../types.js";

export async function getAll(accessToken: string): Promise<GradeAllResponse> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get<ApiResponse<GradeAllResponse>>("/api/secureapi/grade-inquiry/all");
  return unwrap(resp);
}

export async function getCurrent(accessToken: string): Promise<GradeCurrentResponse> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get<ApiResponse<GradeCurrentResponse>>("/api/secureapi/grade-inquiry/current");
  return unwrap(resp);
}

export async function getSemester(accessToken: string, year: string, smtCd: string): Promise<GradeSemester> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get<ApiResponse<GradeSemester>>("/api/secureapi/grade-inquiry/semester", {
    params: { year, smtCd },
  });
  return unwrap(resp);
}
