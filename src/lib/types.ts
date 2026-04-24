export type VisitorProfile = {
  label: string;
  nickname?: string;
  kind: "emoji" | "number" | "mixed";
};

export type Room = {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RoomMember = {
  id: string;
  label: string;
  nickname?: string | null;
  inviteCode?: string;
  joinedAt?: unknown;
  lastSeenAt?: unknown;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  memo?: string;
  tag?: string;
  color?: string;
  authorUid: string;
  authorLabel: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  order: number;
  authorUid: string;
  authorLabel: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TodoWithEvent = TodoItem & {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime?: string;
  eventTag?: string;
  eventColor?: string;
};
