"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { EventItem, TodoItem, TodoWithEvent } from "@/lib/types";

export function useTodosForEvents(roomId: string, events: EventItem[]) {
  const [todosByEvent, setTodosByEvent] = useState<Record<string, TodoItem[]>>({});
  const [errorsByKey, setErrorsByKey] = useState<Record<string, string>>({});
  const eventIdsKey = events.map((event) => event.id).join("|");
  const eventIds = useMemo(() => (eventIdsKey ? eventIdsKey.split("|") : []), [eventIdsKey]);

  useEffect(() => {
    if (eventIds.length === 0) {
      return;
    }

    const firestore = getDb();
    const unsubscribes = eventIds.map((eventId) => {
      const ref = collection(firestore, "rooms", roomId, "events", eventId, "todos");

      return onSnapshot(
        query(ref, orderBy("order")),
        (snapshot) => {
          const nextTodos = snapshot.docs.map((todoDoc) => ({ id: todoDoc.id, ...todoDoc.data() }) as TodoItem);
          setTodosByEvent((current) => ({
            ...current,
            [eventId]: nextTodos,
          }));
        },
        (caught) => {
          setErrorsByKey((current) => ({
            ...current,
            [eventIdsKey]: caught.message,
          }));
        },
      );
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [eventIds, eventIdsKey, roomId]);

  const todos = useMemo<TodoWithEvent[]>(() => {
    const eventMap = new Map(events.map((event) => [event.id, event]));

    return Object.entries(todosByEvent)
      .flatMap(([eventId, eventTodos]) => {
        const event = eventMap.get(eventId);
        if (!event) return [];

        return eventTodos.map((todo) => ({
          ...todo,
          eventId,
          eventTitle: event.title,
          eventDate: event.date,
          eventStartTime: event.startTime,
          eventTag: event.tag,
          eventColor: event.color,
        }));
      })
      .sort((a, b) => {
        const byDate = a.eventDate.localeCompare(b.eventDate);
        if (byDate !== 0) return byDate;
        const byStartTime = (a.eventStartTime ?? "99:99").localeCompare(b.eventStartTime ?? "99:99");
        if (byStartTime !== 0) return byStartTime;
        return a.order - b.order;
      });
  }, [events, todosByEvent]);

  const error = errorsByKey[eventIdsKey] ?? null;
  const loading = !error && eventIds.length > 0 && eventIds.some((eventId) => !(eventId in todosByEvent));

  return { todos, loading, error };
}
