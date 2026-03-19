# REST API Contract: sjapp Native

sjapp.sejong.ac.kr를 프록시하는 자체 REST API 서버.

Base URL: `http://localhost:3000/api/v1`

## 인증

### POST /auth/login
```json
Request:  { "username": "학번", "password": "비밀번호" }
Response: { "accessToken": "...", "userId": "...", "username": "홍길동", ... }
```

### GET /auth/me
```
Headers: Authorization: Bearer {token}
Response: UserProfile JSON
```

### POST /auth/refresh
```
Headers: Authorization: Bearer {token}
Response: { "accessToken": "new_token", ... }
```

## 성적 (인증 필요)

### GET /grades
전체 성적. `Authorization: Bearer {token}`
```json
Response: { "overallSummary": {...}, "semesters": [...] }
```

### GET /grades/current
당학기 성적.

### GET /grades/semester?year=2025&smtCd=20
특정 학기 성적.

## 공지사항 (인증 불필요)

### GET /notices/:category?page=0&size=10
카테고리별 공지 목록. category: general|academic|scholarship|employment|international|recruitment|engineering|library

### GET /notices/:category/:id
공지 상세.

### GET /notices/latest?type=general&size=5
최신 공지.

## 세종뉴스 (인증 불필요)

### GET /news/:type?page=0&size=10
type: news|media|press|sejong-webzine|engineering-webzine

### GET /news/:type/:id
뉴스 상세.

## 피드 (인증 불필요)

### GET /feeds/:type?page=0&size=10
type: latest|blog|youtube

## 일정 (인증 필요)

### GET /schedules
### POST /schedules
### PUT /schedules/:id
### DELETE /schedules/:id
### POST /schedules/:id/complete
### GET /schedules/categories
### GET /schedules/tags

## 문의 (인증 필요)

### GET /qna/categories (인증 불필요)
### GET /qna/my
### POST /qna
### GET /qna/:id
### PUT /qna/:id
### DELETE /qna/:id

## 교직원 (인증 필요)

### GET /staff

## 알림 (인증 필요)

### GET /notifications?page=0&size=10
### GET /notifications/unread-count
### POST /notifications/:id/read
### POST /notifications/read-all
### DELETE /notifications/:id
### GET /notifications/settings
### PUT /notifications/settings

## 도서관 (기존 유지, 인증 필요)

### POST /library/rooms
### POST /library/my-seat
### POST /library/seat-map
### POST /library/facilities
### POST /library/reserve
### POST /library/extend
### POST /library/return
