import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse, PagedData, Notification, UnreadCount, NotificationSettings } from "../types.js";

function client(token: string) {
  return createSjappClient({ accessToken: token, userId: "", username: "" });
}

export async function getInbox(accessToken: string, page = 0, size = 10): Promise<PagedData<Notification>> {
  const resp = await client(accessToken).get<ApiResponse<PagedData<Notification>>>("/api/v1/ums/inbox", { params: { page, size } });
  return unwrap(resp);
}

export async function getUnreadCount(accessToken: string): Promise<UnreadCount> {
  const resp = await client(accessToken).get<ApiResponse<UnreadCount>>("/api/v1/ums/inbox/unread-count");
  return unwrap(resp);
}

export async function markAsRead(accessToken: string, id: number): Promise<void> {
  await client(accessToken).post(`/api/v1/ums/inbox/${id}/read`);
}

export async function markAllAsRead(accessToken: string): Promise<void> {
  await client(accessToken).post("/api/v1/ums/inbox/read-all");
}

export async function deleteNotification(accessToken: string, id: number): Promise<void> {
  await client(accessToken).delete(`/api/v1/ums/inbox/${id}`);
}

export async function getSettings(accessToken: string): Promise<NotificationSettings> {
  const resp = await client(accessToken).get<ApiResponse<NotificationSettings>>("/api/v1/ums/notification-settings");
  return unwrap(resp);
}

export async function updateSettings(accessToken: string, settings: NotificationSettings): Promise<void> {
  await client(accessToken).put("/api/v1/ums/notification-settings", settings);
}
