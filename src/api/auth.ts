import { createSjappClient, unwrap } from "../http.js";
import type { AuthToken, UserProfile, ApiResponse } from "../types.js";

const BASE = "https://sjapp.sejong.ac.kr";

export async function login(username: string, password: string): Promise<AuthToken> {
  const client = createSjappClient();
  const resp = await client.post<ApiResponse<AuthToken>>("/api/auth/login", { username, password });
  return unwrap(resp);
}

export async function getProfile(accessToken: string): Promise<UserProfile> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get<ApiResponse<UserProfile>>("/api/auth/me");
  return unwrap(resp);
}

export async function refreshToken(accessToken: string): Promise<AuthToken> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.post<ApiResponse<AuthToken>>("/api/auth/refresh");
  return unwrap(resp);
}

export async function logout(accessToken: string): Promise<void> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  await client.post("/api/auth/logout");
}
