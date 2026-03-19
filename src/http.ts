import axios, { AxiosInstance } from "axios";
import type { ApiResponse } from "./types.js";

const SJAPP_BASE = "https://sjapp.sejong.ac.kr";

export interface SjappSession {
  accessToken: string;
  userId: string;
  username: string;
}

export function createSjappClient(session?: SjappSession): AxiosInstance {
  const client = axios.create({
    baseURL: SJAPP_BASE,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  if (session) {
    client.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return config;
    });
  }

  return client;
}

/**
 * Extract data from sjapp API response wrapper.
 * Throws on error responses.
 */
export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data;
  if (body.status === "error" || !body.success) {
    const msg = (body as unknown as { details?: { fieldErrors?: { message: string }[] } })
      .details?.fieldErrors?.[0]?.message ?? body.message ?? "Unknown error";
    throw new Error(msg);
  }
  return body.data;
}
