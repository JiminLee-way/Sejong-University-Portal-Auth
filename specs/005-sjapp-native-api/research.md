# Research: sjapp 네이티브 REST API 전면 전환

## R1: API 전체 검증 결과 ✅

**Base URL**: `https://sjapp.sejong.ac.kr`
**모든 API 실제 호출 검증 완료** (2026-03-19)

### 인증 (`/api/auth`)
| Endpoint | Method | Status | Auth |
|----------|--------|--------|------|
| `/api/auth/login` | POST | 200 | None |
| `/api/auth/logout` | POST | - | Bearer |
| `/api/auth/refresh` | POST | - | Bearer |
| `/api/auth/me` | GET | 200 | Bearer |

### 성적 (`/api/secureapi/grade-inquiry`)
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/secureapi/grade-inquiry/all` | GET | 200 | 전체 성적 + GPA |
| `/api/secureapi/grade-inquiry/current` | GET | 200 | 당학기 성적 |
| `/api/secureapi/grade-inquiry/semester?year=2025&smtCd=20` | GET | 200 | 학기별 |

### 공지사항 (`/api/publicapi/university-notice`)
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/publicapi/university-notice/{category}?page=0&size=10` | GET | 200 | 8개 카테고리 |
| `/api/publicapi/university-notice/{category}/{id}` | GET | 200 | 상세 |
| `/api/publicapi/university-notice/latest?type={cat}&size=5` | GET | 200 | 최신 N개 |

**카테고리**: general, academic, scholarship, employment, international, recruitment, engineering, library

### 세종뉴스 (`/api/publicapi/sejong-news`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/publicapi/sejong-news/news?page=0&size=10` | GET | 200 |
| `/api/publicapi/sejong-news/media?page=0&size=10` | GET | 200 |
| `/api/publicapi/sejong-news/press?page=0&size=10` | GET | 200 |
| `/api/publicapi/sejong-news/sejong-webzine?page=0&size=10` | GET | 200 |
| `/api/publicapi/sejong-news/engineering-webzine?page=0&size=10` | GET | 200 |

### 피드 (`/api/publicapi/feeds`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/publicapi/feeds/latest?page=0&size=10` | GET | 200 |
| `/api/publicapi/feeds/blog?page=0&size=10` | GET | 200 |
| `/api/publicapi/feeds/youtube?page=0&size=10` | GET | 200 |

### 일정 (`/api/secureapi/schedules`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/secureapi/schedules` | GET | 200 |
| `/api/secureapi/schedules` | POST | - |
| `/api/secureapi/schedules/{id}` | PUT/DELETE | - |
| `/api/secureapi/schedules/recurring` | POST | - |
| `/api/secureapi/schedules/{id}/complete` | POST | - |
| `/api/secureapi/schedules/categories` | GET | 200 |
| `/api/secureapi/schedules/tags` | GET | 200 |
| `/api/secureapi/schedules/import-batch` | POST | - |

### 문의 (`/api/secureapi/qna`, `/api/publicapi/qna`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/secureapi/qna/my` | GET | 200 |
| `/api/secureapi/qna` | POST | - |
| `/api/secureapi/qna/{id}` | GET/PUT/DELETE | - |
| `/api/publicapi/qna/categories` | GET | 200 |

### 교직원 (`/api/secureapi/adm/staff`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/secureapi/adm/staff` | GET | 200 |
| `/api/secureapi/adm/staff/{id}/photo` | GET | - |

### 알림 (`/api/v1/ums`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/v1/ums/inbox?page=0&size=10` | GET | 200 |
| `/api/v1/ums/inbox/unread-count` | GET | 200 |
| `/api/v1/ums/categories` | GET | 200 |
| `/api/v1/ums/inbox/{id}/read` | POST | - |
| `/api/v1/ums/inbox/read-all` | POST | - |
| `/api/v1/ums/inbox/{id}` | DELETE | - |
| `/api/v1/ums/notification-settings` | GET/PUT | 200 |

## R2: 응답 구조 패턴

**성공 응답**:
```json
{ "status": "success", "code": "SUCCESS", "message": "성공", "data": {...}, "timestamp": "...", "httpStatus": "OK", "success": true }
```

**에러 응답**:
```json
{ "status": "error", "code": "ERROR_CODE", "message": "메시지", "traceId": "uuid", "timestamp": "...", "path": "/api/...", "httpStatus": 400, "errorCode": "..." }
```

**페이지네이션 응답** (data 내부):
```json
{ "content": [...], "pageable": { "pageNumber": 0, "pageSize": 10 }, "totalElements": 100, "totalPages": 10 }
```

## R3: 아키텍처 결정

**Decision**: 프로젝트 전면 재작성. sjpt WebSquare 코드 전체 제거, sjapp REST API 기반 새 클라이언트 구축.

**유지**: 도서관 좌석(libseat) — sjapp에 해당 API 없음
**제거**: session.ts(WebSquare 세션), 기존 api/grades.ts, enrollments.ts, scholarships.ts, tuition.ts, graduation.ts, calendar.ts, notices.ts, studentcard.ts
**신규**: sjapp 기반 auth, grades, notices, news, feeds, schedules, qna, staff, notifications 모듈
