# Shared Schedule

Next.js App Router, Tailwind CSS, Firebase Anonymous Auth, and Firestore로 만든 공유 일정 관리 웹 애플리케이션입니다.

## Firebase 구조

```txt
roomCodes/{inviteCode}
rooms/{roomId}
rooms/{roomId}/members/{uid}
rooms/{roomId}/events/{eventId}
rooms/{roomId}/events/{eventId}/todos/{todoId}
```

`roomCodes/{inviteCode}` 문서를 통해 초대 코드를 방 ID로 변환하고, 실제 일정과 할 일 데이터는 `rooms/{roomId}` 아래에 저장합니다.

## 실행 준비

1. Firebase 콘솔에서 Web App을 만들고 Anonymous Auth와 Firestore를 활성화합니다.
2. `.env.example`을 참고해 `.env.local`을 생성합니다.
3. Firestore Rules에는 `firestore.rules` 내용을 배포합니다.
4. 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

## 주요 화면

- `/`: 작성자 표시 선택, 새 공유방 생성, 초대 코드 참가
- `/rooms/[roomId]/calendar`: 월간 달력과 날짜별 일정 모달
- `/rooms/[roomId]/schedule?date=YYYY-MM-DD`: 가로 스크롤 날짜 선택과 일정 목록
- `/rooms/[roomId]/schedule/[eventId]`: 일정 상세와 To-do CRUD
