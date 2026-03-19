import { Router, Request, Response } from "express";
import { SejongClient } from "../client.js";
import { LoginFailedError, NetworkError, PortalError, ParseError } from "../errors.js";
import type { NoticeCategory, NewsType, FeedType, FacilityType } from "../types.js";

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

// ── Auth ──

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: "username and password required" }); return; }
    const client = new SejongClient();
    res.json(await client.login(username, password));
  } catch (e) { handleError(e, res); }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization header required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getProfile());
  } catch (e) { handleError(e, res); }
});

// ── Grades ──

router.get("/grades", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getGrades());
  } catch (e) { handleError(e, res); }
});

router.get("/grades/current", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getCurrentGrades());
  } catch (e) { handleError(e, res); }
});

router.get("/grades/semester", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const { year, smtCd } = req.query as { year: string; smtCd: string };
    if (!year || !smtCd) { res.status(400).json({ error: "year and smtCd required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getSemesterGrades(year, smtCd));
  } catch (e) { handleError(e, res); }
});

// ── Notices (no auth) ──

router.get("/notices/latest", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as NoticeCategory) || "general";
    const size = Number(req.query.size) || 5;
    const client = new SejongClient();
    res.json(await client.getLatestNotices(type, size));
  } catch (e) { handleError(e, res); }
});

router.get("/notices/:category", async (req: Request, res: Response) => {
  try {
    const category = req.params.category as NoticeCategory;
    const page = Number(req.query.page) || 0;
    const size = Number(req.query.size) || 10;
    const client = new SejongClient();
    res.json(await client.getNotices(category, { page, size }));
  } catch (e) { handleError(e, res); }
});

router.get("/notices/:category/:id", async (req: Request, res: Response) => {
  try {
    const { category, id } = req.params;
    const client = new SejongClient();
    res.json(await client.getNoticeDetail(category as NoticeCategory, id));
  } catch (e) { handleError(e, res); }
});

// ── News (no auth) ──

router.get("/news/:type", async (req: Request, res: Response) => {
  try {
    const type = req.params.type as NewsType;
    const page = Number(req.query.page) || 0;
    const size = Number(req.query.size) || 10;
    const client = new SejongClient();
    res.json(await client.getNews(type, { page, size }));
  } catch (e) { handleError(e, res); }
});

// ── Feeds (no auth) ──

router.get("/feeds/:type", async (req: Request, res: Response) => {
  try {
    const type = req.params.type as FeedType;
    const page = Number(req.query.page) || 0;
    const size = Number(req.query.size) || 10;
    const client = new SejongClient();
    res.json(await client.getFeeds(type, { page, size }));
  } catch (e) { handleError(e, res); }
});

// ── Schedules ──

router.get("/schedules", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getSchedules());
  } catch (e) { handleError(e, res); }
});

router.get("/schedules/categories", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getScheduleCategories());
  } catch (e) { handleError(e, res); }
});

// ── QnA ──

router.get("/qna/categories", async (_req: Request, res: Response) => {
  try {
    const client = new SejongClient();
    res.json(await client.getQnACategories());
  } catch (e) { handleError(e, res); }
});

// ── Staff ──

router.get("/staff", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    const page = Number(req.query.page) || 0;
    const size = Number(req.query.size) || 20;
    res.json(await client.searchStaff({ page, size }));
  } catch (e) { handleError(e, res); }
});

// ── Notifications ──

router.get("/notifications", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    const page = Number(req.query.page) || 0;
    const size = Number(req.query.size) || 10;
    res.json(await client.getNotifications({ page, size }));
  } catch (e) { handleError(e, res); }
});

router.get("/notifications/unread-count", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Authorization required" }); return; }
    const client = new SejongClient();
    (client as any).accessToken = token;
    res.json(await client.getUnreadCount());
  } catch (e) { handleError(e, res); }
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
    res.json(await client.getFacilityRooms((type || "studyroom") as FacilityType));
  } catch (e) { handleError(e, res); }
});
