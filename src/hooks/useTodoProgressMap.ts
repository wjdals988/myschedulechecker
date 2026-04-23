"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { TodoItem } from "@/lib/types";

export type TodoProgress = {
  total: number;
  done: number;
};

export function useTodoProgressMap(roomId: string, eventIds: string[]) {
  const [progressMap, setProgressMap] = useState<Record<string, TodoProgress>>({});
  const eventIdsKey = eventIds.join("|");

  useEffect(() => {
    const ids = eventIdsKey ? eventIdsKey.split("|") : [];

    if (ids.length === 0) {
      return;
    }

    const firestore = getDb();
    const unsubscribes = ids.map((eventId) => {
      const ref = collection(firestore, "rooms", roomId, "events", eventId, "todos");

      return onSnapshot(ref, (snapshot) => {
        const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TodoItem);
        setProgressMap((current) => ({
          ...current,
          [eventId]: {
            total: todos.length,
            done: todos.filter((todo) => todo.done).length,
          },
        }));
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [roomId, eventIdsKey]);

  const ids = eventIdsKey ? eventIdsKey.split("|") : [];
  return ids.reduce<Record<string, TodoProgress>>((acc, eventId) => {
    if (progressMap[eventId]) {
      acc[eventId] = progressMap[eventId];
    }
    return acc;
  }, {});
}
