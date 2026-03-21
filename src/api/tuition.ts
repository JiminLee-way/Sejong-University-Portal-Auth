import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface TuitionItem {
  orderDiv: string;
  yearSmtInfo: string;
  deptNm: string;
  studentNo: string;
  nm: string;
  rgstEntAmt: number;
  rgstLessAmt: number;
  totSchoAmt: number;
  totDemandAmt: number;
  virtBankNo: string;
  resAmt: number;
}

export interface PaymentDetail {
  num: number;
  processDate: string;
  category: string;
  amount: number;
}

export interface TuitionNoticeResponse {
  tuitions: TuitionItem[];
  reductions: unknown[];
}

export interface TuitionPaymentResponse {
  tuitions: TuitionItem[];
  paymentDetails: PaymentDetail[];
}

export interface YearSemesterOption {
  year: string;
  smtCd: string;
}

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function getNoticeOptions(accessToken: string): Promise<YearSemesterOption[]> {
  const resp = await client(accessToken).get<ApiResponse<YearSemesterOption[]>>("/api/secureapi/tuition/notice-year-semester-options");
  return unwrap(resp);
}

export async function getPaymentOptions(accessToken: string): Promise<YearSemesterOption[]> {
  const resp = await client(accessToken).get<ApiResponse<YearSemesterOption[]>>("/api/secureapi/tuition/payment-year-semester-options");
  return unwrap(resp);
}

export async function getNotice(accessToken: string, year: string, smtCd: string): Promise<TuitionNoticeResponse> {
  const resp = await client(accessToken).get<ApiResponse<TuitionNoticeResponse>>("/api/secureapi/tuition/notice", { params: { year, smtCd } });
  return unwrap(resp);
}

export async function getPayment(accessToken: string, year: string, smtCd: string): Promise<TuitionPaymentResponse> {
  const resp = await client(accessToken).get<ApiResponse<TuitionPaymentResponse>>("/api/secureapi/tuition/payment", { params: { year, smtCd } });
  return unwrap(resp);
}

/** 자율경비 내역 */
export async function getDiscretionarySpending(accessToken: string, year: string, smtCd: string): Promise<unknown> {
  const resp = await client(accessToken).get<ApiResponse<unknown>>("/api/secureapi/discretionary-spending/detail", { params: { year, smtCd } });
  return unwrap(resp);
}

export async function getDiscretionarySpendingOptions(accessToken: string): Promise<YearSemesterOption[]> {
  const resp = await client(accessToken).get<ApiResponse<YearSemesterOption[]>>("/api/secureapi/discretionary-spending/year-semester-options");
  return unwrap(resp);
}
