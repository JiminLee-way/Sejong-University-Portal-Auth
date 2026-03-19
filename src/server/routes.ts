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

/** 1회 로그인으로 요청된 기능 모두 조회 */
router.post("/grades", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const client = new SejongClient();
    await client.login(username, password);
    res.json(await client.getGrades());
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
    res.json(await client.getEnrollments(year, semesterCode));
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
    res.json(await client.getScholarships());
  } catch (e) {
    handleError(e, res);
  }
});

/** 한번 로그인으로 성적+수강+장학 전부 조회 */
router.post("/all", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "username and password required" });
      return;
    }
    const client = new SejongClient();
    await client.login(username, password);

    // 순차 실행 — 같은 세션에서 페이지 전환
    const grades = await client.getGrades();
    const enrollments = await client.getEnrollments();
    const scholarships = await client.getScholarships();

    res.json({ grades, enrollments, scholarships });
  } catch (e) {
    handleError(e, res);
  }
});

// ── Library Seats ──

router.post("/library/rooms", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: "username and password required" }); return; }
    const client = new SejongClient();
    await client.login(username, password);
    res.json(await client.getLibraryRooms());
  } catch (e) { handleError(e, res); }
});

router.post("/library/my-seat", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: "username and password required" }); return; }
    const client = new SejongClient();
    await client.login(username, password);
    res.json(await client.getMySeat());
  } catch (e) { handleError(e, res); }
});

router.post("/library/seat-map", async (req: Request, res: Response) => {
  try {
    const { username, password, roomNo } = req.body;
    if (!username || !password) { res.status(400).json({ error: "username and password required" }); return; }
    const client = new SejongClient();
    await client.login(username, password);
    res.json(await client.getSeatMap(Number(roomNo) || 11));
  } catch (e) { handleError(e, res); }
});

router.post("/library/facilities", async (req: Request, res: Response) => {
  try {
    const { username, password, type } = req.body;
    if (!username || !password) { res.status(400).json({ error: "username and password required" }); return; }
    const client = new SejongClient();
    await client.login(username, password);
    res.json(await client.getFacilityRooms(type || "studyroom"));
  } catch (e) { handleError(e, res); }
});

// ── Student Card ──

router.post("/student-card", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: "username and password required" }); return; }
    const client = new SejongClient();
    await client.login(username, password);
    res.json(await client.getStudentCard());
  } catch (e) { handleError(e, res); }
});
