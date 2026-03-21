import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface Weather {
  temperature: string;
  weatherCondition: string;
  humidity: number;
  windSpeed: number;
  skyCode: string;
  ptyCode: string;
  syncAt: string;
  regionName: string;
}

export async function getWeather(): Promise<Weather> {
  const client = createSjappClient();
  const resp = await client.get<ApiResponse<Weather>>("/api/publicapi/weather");
  return unwrap(resp);
}
