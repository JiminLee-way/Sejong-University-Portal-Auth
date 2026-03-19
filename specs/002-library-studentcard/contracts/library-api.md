# Library API Contract (SejongClient 추가 메서드)

```typescript
// 열람실 좌석 현황
const rooms = await client.getLibraryRooms();
// Returns: ReadingRoom[]

// 나의 좌석
const mySeat = await client.getMySeat();
// Returns: MySeat | null

// 좌석 배치도
const seatMap = await client.getSeatMap(11);
// Returns: SeatMapResponse

// 시설 예약 현황
const studyRooms = await client.getFacilityRooms('studyroom');
// Returns: FacilityRoom[]

// 학생증 카드번호
const card = await client.getStudentCard();
// Returns: StudentCard
```
