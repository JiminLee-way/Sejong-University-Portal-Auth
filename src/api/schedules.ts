import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, Schedule, ScheduleCategory, ScheduleTag, CreateScheduleRequest } from "../types.js";

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function list(accessToken: string): Promise<Schedule[]> {
  const resp = await client(accessToken).get<ApiResponse<Schedule[]>>("/api/secureapi/schedules");
  return unwrap(resp);
}

export async function create(accessToken: string, data: CreateScheduleRequest): Promise<Schedule> {
  const resp = await client(accessToken).post<ApiResponse<Schedule>>("/api/secureapi/schedules", data);
  return unwrap(resp);
}

export async function createRecurring(accessToken: string, data: unknown): Promise<Schedule> {
  const resp = await client(accessToken).post<ApiResponse<Schedule>>("/api/secureapi/schedules/recurring", data);
  return unwrap(resp);
}

export async function update(accessToken: string, id: number, data: Partial<CreateScheduleRequest>): Promise<Schedule> {
  const resp = await client(accessToken).put<ApiResponse<Schedule>>(`/api/secureapi/schedules/${id}`, data);
  return unwrap(resp);
}

export async function complete(accessToken: string, id: number): Promise<Schedule> {
  const resp = await client(accessToken).post<ApiResponse<Schedule>>(`/api/secureapi/schedules/${id}/complete`);
  return unwrap(resp);
}

export async function cancel(accessToken: string, id: number): Promise<Schedule> {
  const resp = await client(accessToken).post<ApiResponse<Schedule>>(`/api/secureapi/schedules/${id}/cancel`);
  return unwrap(resp);
}

export async function remove(accessToken: string, id: number): Promise<void> {
  await client(accessToken).delete(`/api/secureapi/schedules/${id}`);
}

export async function getCategories(accessToken: string): Promise<ScheduleCategory[]> {
  const resp = await client(accessToken).get<ApiResponse<ScheduleCategory[]>>("/api/secureapi/schedules/categories");
  return unwrap(resp);
}

export async function getTags(accessToken: string): Promise<ScheduleTag[]> {
  const resp = await client(accessToken).get<ApiResponse<ScheduleTag[]>>("/api/secureapi/schedules/tags");
  return unwrap(resp);
}

export async function importBatch(accessToken: string, data: unknown): Promise<unknown> {
  const resp = await client(accessToken).post<ApiResponse<unknown>>("/api/secureapi/schedules/import-batch", data);
  return unwrap(resp);
}
