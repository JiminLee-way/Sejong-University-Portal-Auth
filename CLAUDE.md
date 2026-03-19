# sejong_portal_auth Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-19

## Active Technologies
- TypeScript 5.x, Node.js 18+ + axios, axios-cookiejar-support, tough-cookie, cheerio, express, zod (003-academic-extended)
- N/A (무상태, 포털 프록시) (003-academic-extended)
- TypeScript 5.x, Node.js 18+ + axios, axios-cookiejar-support, tough-cookie (기존 의존성 그대로) (004-sjapp-jwt-auth)
- .sejong-session.json (기존 세션 파일 호환) (004-sjapp-jwt-auth)
- TypeScript 5.x, Node.js 18+ + axios (HTTP), express (REST 서버) — tough-cookie/cheerio 제거 가능 (005-sjapp-native-api)
- N/A (무상태) (005-sjapp-native-api)

- TypeScript 5.x, Node.js 18+ + axios (HTTP client), express (REST server), zod (validation) (001-ts-portal-auth)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 18+: Follow standard conventions

## Recent Changes
- 005-sjapp-native-api: Added TypeScript 5.x, Node.js 18+ + axios (HTTP), express (REST 서버) — tough-cookie/cheerio 제거 가능
- 004-sjapp-jwt-auth: Added TypeScript 5.x, Node.js 18+ + axios, axios-cookiejar-support, tough-cookie (기존 의존성 그대로)
- 003-academic-extended: Added TypeScript 5.x, Node.js 18+ + axios, axios-cookiejar-support, tough-cookie, cheerio, express, zod


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
