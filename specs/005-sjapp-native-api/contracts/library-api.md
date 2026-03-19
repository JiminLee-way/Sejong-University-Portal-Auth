# Library API Contract: sjapp Native

## SejongClient

```typescript
import { SejongClient } from 'sejong-auth';

const client = new SejongClient();

// ── 인증 ──
await client.login('학번', '비밀번호');
const profile = await client.getProfile();       // UserProfile
await client.refreshToken();
await client.logout();

// ── 성적 ──
const allGrades = await client.getGrades();           // 전체 성적
const currentGrades = await client.getCurrentGrades(); // 당학기 성적
const semGrades = await client.getSemesterGrades('2025', '20'); // 학기별

// ── 공지사항 (인증 불필요) ──
const notices = await client.getNotices('academic', { page: 0, size: 10 });
const detail = await client.getNoticeDetail('academic', '344_864814');
const latest = await client.getLatestNotices('general', 5);

// ── 세종뉴스 (인증 불필요) ──
const news = await client.getNews('news', { page: 0, size: 10 });
const newsDetail = await client.getNewsDetail('news', '320_864815');

// ── 피드 (인증 불필요) ──
const feeds = await client.getFeeds('latest', { page: 0, size: 10 });
const blog = await client.getFeeds('blog');
const youtube = await client.getFeeds('youtube');

// ── 일정 ──
const schedules = await client.getSchedules();
const created = await client.createSchedule({ title: '시험', startAt: '...', endAt: '...' });
await client.updateSchedule(created.id, { title: '중간시험' });
await client.deleteSchedule(created.id);
await client.completeSchedule(created.id);
const categories = await client.getScheduleCategories();
const tags = await client.getScheduleTags();

// ── 문의 ──
const qnaCategories = await client.getQnACategories();
const myQnas = await client.getMyQnAs();
const qna = await client.createQnA({ categoryId: 'qna-error-report', title: '...', content: '...' });
const qnaDetail = await client.getQnADetail(qna.id);

// ── 교직원 검색 ──
const staff = await client.searchStaff();

// ── 알림 ──
const inbox = await client.getNotifications({ page: 0, size: 10 });
const unread = await client.getUnreadCount();
await client.markAsRead(notificationId);
await client.markAllAsRead();
await client.deleteNotification(notificationId);
const settings = await client.getNotificationSettings();

// ── 도서관 좌석 (기존 유지) ──
const rooms = await client.getLibraryRooms();
const mySeat = await client.getMySeat();
const seatMap = await client.getSeatMap(13);
```

## 공개 API (인증 불필요)

```typescript
// 공지, 뉴스, 피드는 login() 없이도 호출 가능
const client = new SejongClient();
const notices = await client.getNotices('general');
const news = await client.getNews('news');
const feeds = await client.getFeeds('latest');
```
