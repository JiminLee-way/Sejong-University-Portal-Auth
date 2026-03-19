import express from "express";
import { router } from "./routes.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", router);
  return app;
}

// Start server when run directly
const port = Number(process.env.PORT ?? 3000);
const app = createApp();
app.listen(port, () => {
  console.log(`Sejong Auth API running on http://localhost:${port}`);
});
