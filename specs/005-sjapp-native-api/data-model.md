# Data Model: sjapp 네이티브 REST API

## 인증

### AuthToken
| Field | Type | Description |
|-------|------|-------------|
| accessToken | string | JWT 접근 토큰 |
| refreshToken | string? | 갱신 토큰 |
| tokenType | string | "Bearer" |
| expiresIn | number | 만료 시간(초) |

### UserProfile
| Field | Type | Description |
|-------|------|-------------|
| userId | string | 학번 |
| username | string | 이름 |
| email | string | 이메일 |
| departmentName | string | 학과 |
| organizationClassName | string | 소속 구분 (학부/대학원) |
| roles | string[] | 역할 ["STUDENT"] |
| permissions | string[] | 권한 |
| roleName | string | 역할명 ("재학생") |
| studentYear | number | 학년 |
| cardNo | string | 학생증 카드번호 |
| cardNoIos | string | iOS 카드번호 |
| birthDate | string | 생년월일 (YYYYMMDD) |
| cmsUserId | string | CMS 사용자 ID |

## 성적

### GradeSemester
| Field | Type | Description |
|-------|------|-------------|
| yearSmtNm | string | "2025 / 2학기" |
| year | number | 년도 |
| smtCd | string | 학기 코드 |
| summary | SemesterSummary | 학기 요약 |
| courses | GradeCourse[] | 과목 목록 |

### SemesterSummary
| Field | Type | Description |
|-------|------|-------------|
| reqCdt | number | 신청 학점 |
| appCdt | number | 취득 학점 |
| avgMrks | number | 평점평균 |

### GradeCourse
| Field | Type | Description |
|-------|------|-------------|
| curiNo | string | 학수번호 |
| curiNm | string | 과목명 |
| curiTypeCdNm | string | 이수구분 |
| cdt | number | 학점 |
| grade | string | 등급 |
| mrks | number | 평점 |

### GradeOverallSummary
| Field | Type | Description |
|-------|------|-------------|
| reqCdt | number | 총 신청학점 |
| appCdt | number | 총 취득학점 |
| totMrks | number | 총 평점 |
| gruCdt | number | 졸업인정학점 |
| avgMrks | number | 전체 평점평균 |
| sco | number | 백분위 |

## 공지사항

### Notice
| Field | Type | Description |
|-------|------|-------------|
| id | string | "카테고리코드_게시글번호" |
| categoryCode | string | 카테고리 코드 |
| categoryName | string | 카테고리 한글명 |
| categoryType | string | general/academic/scholarship/... |
| title | string | 제목 |
| summary | string? | 요약 |
| writerName | string | 작성자 |
| writtenAt | string | 작성일시 (ISO 8601) |
| viewCount | number | 조회수 |
| hasAttachment | boolean | 첨부파일 여부 |
| isNew | boolean | 신규 여부 |

## 세종뉴스

### News
| Field | Type | Description |
|-------|------|-------------|
| id | string | "카테고리코드_번호" |
| categoryCode | string | 카테고리 코드 |
| categoryName | string | 카테고리명 |
| categoryType | string | news/media/press/sejong-webzine/engineering-webzine |
| title | string | 제목 |
| summary | string? | 요약 |
| writerName | string | 작성자 |
| writtenAt | string | 작성일시 |
| viewCount | number | 조회수 |
| thumbnailUrl | string? | 썸네일 URL |

## 피드

### Feed
| Field | Type | Description |
|-------|------|-------------|
| id | number | 피드 ID |
| source | string | BLOG/YOUTUBE |
| sourceName | string | "네이버 블로그"/"유튜브" |
| title | string | 제목 |
| link | string | 원문 링크 |
| description | string? | 설명 |
| thumbnailUrl | string? | 썸네일 |
| publishedAt | string | 발행일시 |
| new | boolean | 신규 여부 |

## 일정

### Schedule
| Field | Type | Description |
|-------|------|-------------|
| id | number | 일정 ID |
| title | string | 제목 |
| startAt | string | 시작 일시 |
| endAt | string | 종료 일시 |
| categoryId | number? | 카테고리 ID |
| tags | Tag[] | 태그 목록 |
| memo | string? | 메모 |
| completed | boolean | 완료 여부 |

## 문의

### QnA
| Field | Type | Description |
|-------|------|-------------|
| id | number | 문의 ID |
| categoryId | string | 카테고리 ID |
| categoryName | string | 카테고리명 |
| title | string | 제목 |
| content | string | 내용 |
| status | string | 상태 |
| createdAt | string | 작성일시 |

### QnACategory
| Field | Type | Description |
|-------|------|-------------|
| categoryId | string | "qna-error-report" 등 |
| categoryName | string | "오류 신고" 등 |
| description | string | 설명 |
| active | boolean | 활성 여부 |

## 교직원

### Staff
| Field | Type | Description |
|-------|------|-------------|
| id | number | 교직원 ID |
| name | string | 이름 |
| department | string | 부서/학과 |
| phone | string? | 전화번호 |
| mobile | string? | 휴대폰 |
| email | string? | 이메일 |

## 알림

### Notification
| Field | Type | Description |
|-------|------|-------------|
| id | number | 알림 ID |
| category | string | 카테고리 |
| content | string | 내용 |
| readAt | string? | 읽은 시각 |
| createdAt | string | 생성 시각 |

## 공통

### PagedResponse<T>
| Field | Type | Description |
|-------|------|-------------|
| content | T[] | 데이터 목록 |
| page / pageNumber | number | 현재 페이지 (0-indexed) |
| size / pageSize | number | 페이지 크기 |
| totalElements | number | 전체 항목 수 |
| totalPages | number | 전체 페이지 수 |

### ApiResponse<T>
| Field | Type | Description |
|-------|------|-------------|
| status | string | "success" / "error" |
| code | string | "SUCCESS" / 에러코드 |
| message | string | 메시지 |
| data | T | 응답 데이터 |
| timestamp | string | 응답 시각 |
| success | boolean | 성공 여부 |
