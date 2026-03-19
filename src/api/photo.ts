import { createSjappClient } from "../http.js";

/**
 * Fetch student profile photo (증명사진).
 * Returns raw image buffer (JPEG).
 */
export async function getProfilePhoto(accessToken: string): Promise<Buffer> {
  const client = createSjappClient({ accessToken, userId: "", username: "" });
  const resp = await client.get("/api/secureapi/photos/me", {
    responseType: "arraybuffer",
  });
  return Buffer.from(resp.data);
}
