# Data Model: 도서관 좌석 + 모바일 학생증

## Entities

### ReadingRoom
열람실 좌석 현황.

| Field | Type | Source |
|-------|------|--------|
| roomNo | number | URL param_room_no (11-18) |
| name | string | HTML h5 텍스트 파싱 |
| usedSeats | number | HTML 파싱 (N / M) |
| totalSeats | number | HTML 파싱 |
| occupancyRate | number | 계산: usedSeats / totalSeats |

### MySeat
현재 배정된 좌석 정보.

| Field | Type | Source |
|-------|------|--------|
| roomName | string | seatMain.php 카드 영역 |
| seatNumber | string | seatMain.php 카드 영역 |
| usageTime | string | seatMain.php 카드 영역 |
| extensionCount | number | seatMain.php 카드 영역 |
| isAssigned | boolean | 데이터 존재 여부 |

### SeatStatus
개별 좌석 상태.

| Field | Type | Description |
|-------|------|-------------|
| seatNumber | number | 좌석 번호 |
| status | 'available' \| 'occupied' \| 'reserved' | CSS class 기반 |

### SeatMapResponse
열람실 좌석 배치도 응답.

| Field | Type |
|-------|------|
| roomNo | number |
| roomName | string |
| seats | SeatStatus[] |

### FacilityRoom
시설 예약 정보 (스터디룸/시네마룸/S-Lounge).

| Field | Type |
|-------|------|
| facilityType | 'studyroom' \| 'cinema' \| 'slounge' |
| name | string |
| available | boolean |

### StudentCard
모바일 학생증 정보.

| Field | Type |
|-------|------|
| cardNo | string |
| isIssued | boolean |
