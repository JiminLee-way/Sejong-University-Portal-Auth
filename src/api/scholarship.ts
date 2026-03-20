import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface ScholarshipItem {
  scholarshipName: string;
  admissionFee: number;
  tuitionFee: number;
  supportFee: number;
  totalAmount: number;
}

export interface ScholarshipListResponse {
  scholarships: ScholarshipItem[];
}

export interface YearSemesterOption {
  year: string;
  smtCd: string;
}

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function getYearSemesterOptions(accessToken: string): Promise<YearSemesterOption[]> {
  const resp = await client(accessToken).get<ApiResponse<YearSemesterOption[]>>("/api/secureapi/scholarship/year-semester-options");
  return unwrap(resp);
}

export async function getList(accessToken: string, year: string, smtCd: string): Promise<ScholarshipListResponse> {
  const resp = await client(accessToken).get<ApiResponse<ScholarshipListResponse>>("/api/secureapi/scholarship/list", { params: { year, smtCd } });
  return unwrap(resp);
}
