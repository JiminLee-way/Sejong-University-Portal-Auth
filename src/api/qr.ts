import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface QrCodeResult {
  qrCodeImage: string;
  format: string;
}

export async function generateQr(
  accessToken: string,
  data: string,
  size = 200,
): Promise<QrCodeResult> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.post<ApiResponse<QrCodeResult>>(
    "/api/secureapi/qr/generate",
    { data, size, margin: 1, errorCorrectionLevel: "M" },
  );
  return unwrap(resp);
}
