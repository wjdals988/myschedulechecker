import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ActivityType } from "@/lib/types";

type ActivityActor = {
  uid: string;
  label: string;
};

type ActivityInput = {
  type: ActivityType;
  actor: ActivityActor;
  targetType: "event" | "todo" | "comment";
  targetId: string;
  title: string;
  summary?: string | null;
  href?: string | null;
  eventId?: string | null;
  todoId?: string | null;
};

export async function recordRoomActivity(roomId: string, input: ActivityInput) {
  try {
    await addDoc(collection(getDb(), "rooms", roomId, "activities"), {
      type: input.type,
      actorUid: input.actor.uid,
      actorLabel: trimForActivity(input.actor.label, 40),
      targetType: input.targetType,
      targetId: input.targetId,
      eventId: input.eventId ?? null,
      todoId: input.todoId ?? null,
      title: trimForActivity(input.title, 80),
      summary: input.summary ? trimForActivity(input.summary, 160) : null,
      href: input.href ?? null,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Activity logs should never block the primary schedule/todo action.
  }
}

export function eventActivityHref(roomId: string, eventId: string, date?: string | null) {
  return `/rooms/${roomId}/schedule/${eventId}${date ? `?date=${date}` : ""}`;
}

export function todoActivityHref(roomId: string, eventId: string, todoId: string, date?: string | null) {
  const query = date ? `?date=${date}&todo=${todoId}` : `?todo=${todoId}`;
  return `/rooms/${roomId}/schedule/${eventId}${query}#todo-${todoId}`;
}

export function todoTabActivityHref(roomId: string, eventId: string, todoId: string, date: string) {
  return `/rooms/${roomId}/todos?date=${date}&range=week#todo-${eventId}-${todoId}`;
}

function trimForActivity(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}
