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
  location?: string;
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
  eventLocation?: string;
  eventTag?: string;
  eventColor?: string;
};

export type CommentItem = {
  id: string;
  text: string;
  authorUid: string;
  authorLabel: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ActivityType =
  | "event.created"
  | "event.updated"
  | "event.deleted"
  | "event.comment.created"
  | "event.comment.deleted"
  | "todo.created"
  | "todo.updated"
  | "todo.completed"
  | "todo.reopened"
  | "todo.deleted"
  | "todo.comment.created"
  | "todo.comment.deleted";

export type RoomActivity = {
  id: string;
  type: ActivityType;
  actorUid: string;
  actorLabel: string;
  targetType: "event" | "todo" | "comment";
  targetId: string;
  eventId?: string | null;
  todoId?: string | null;
  title: string;
  summary?: string | null;
  href?: string | null;
  createdAt?: unknown;
};
