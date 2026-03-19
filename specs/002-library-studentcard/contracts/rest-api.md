# REST API Contract (추가 엔드포인트)

## POST /api/v1/library/rooms
열람실 좌석 현황. 로그인 필요.

**Request**: `{ "username": "학번", "password": "비밀번호" }`
**Response 200**: `{ rooms: ReadingRoom[] }`

## POST /api/v1/library/my-seat
나의 좌석 조회. 로그인 필요.

**Request**: `{ "username": "학번", "password": "비밀번호" }`
**Response 200**: `MySeat | null`

## POST /api/v1/library/seat-map
특정 열람실 좌석 배치도.

**Request**: `{ "username": "학번", "password": "비밀번호", "roomNo": 11 }`
**Response 200**: `SeatMapResponse`

## POST /api/v1/student-card
모바일 학생증 카드번호.

**Request**: `{ "username": "학번", "password": "비밀번호" }`
**Response 200**: `StudentCard`
