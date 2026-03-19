import { Router, Request, Response } from "express";
import { SejongClient } from "../client.js";
import {
  LoginFailedError,
  NetworkError,
  PortalError,
  ParseError,
} from "../errors.js";

export const router = Router();

function handleError(e: unknown, res: Response): void {
  if (e instanceof LoginFailedError) {
    res.status(401).json({ error: e.message });
  } else if (e instanceof NetworkError || e instanceof PortalError) {
    res.status(502).json({ error: e.message });
  } else if (e instanceof ParseError) {
    res.status(500).json({ error: e.message });
  } else {
    res.status(500).json({ error: String(e) });
  }
}

router.post("/grades", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const client = new SejongClient();
    await client.login(username, password);
    const report = await client.getGrades();
    res.json(report);
  } catch (e) {
    handleError(e, res);
  }
});

router.post("/enrollments", async (req: Request, res: Response) => {
  try {
    const { username, password, year, semesterCode } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const client = new SejongClient();
    await client.login(username, password);
    const report = await client.getEnrollments(year, semesterCode);
    res.json(report);
  } catch (e) {
    handleError(e, res);
  }
});

router.post("/scholarships", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const client = new SejongClient();
    await client.login(username, password);
    const report = await client.getScholarships();
    res.json(report);
  } catch (e) {
    handleError(e, res);
  }
});
