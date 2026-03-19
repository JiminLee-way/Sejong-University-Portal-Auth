# Implementation Plan: 도서관 좌석 + 모바일 학생증

**Branch**: `002-library-studentcard` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)

## Summary

기존 SejongClient에 도서관 좌석 시스템(libseat.sejong.ac.kr)과 모바일 학생증 카드번호 조회 기능을 추가한다. 좌석 시스템은 토큰 기반 PHP 서버로, library.sejong.ac.kr SSO 인증 후 libseat로 리다이렉트되어 토큰을 받는다. 학생증 카드번호는 포털 내 API를 추가 분석하여 연동한다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+ (기존 프로젝트)
**Primary Dependencies**: axios, cheerio (HTML 파싱), express (기존)
**New Dependency**: cheerio — libseat.sejong.ac.kr이 PHP SSR이므로 HTML 파싱 필요
**Testing**: vitest (기존)
**Target Platform**: Node.js server
**Project Type**: library + web-service (기존 확장)

## Constitution Check

Constitution 미정의 — 게이트 통과.

## Project Structure

### Source Code (기존 프로젝트에 추가)

```text
src/
├── api/
│   ├── grades.ts          # 기존
│   ├── enrollments.ts     # 기존
│   ├── scholarships.ts    # 기존
│   ├── library.ts         # NEW — 좌석 현황, 나의 좌석, 좌석 배치도, 시설 예약
│   └── studentcard.ts     # NEW — 모바일 학생증 카드번호
├── client.ts              # 기존 — 새 메서드 추가
├── types.ts               # 기존 — 새 타입 추가
├── server/
│   └── routes.ts          # 기존 — 새 엔드포인트 추가
└── index.ts               # 기존 — 새 export 추가
```
