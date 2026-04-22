"use client";

import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { EventItem } from "@/lib/types";

export function useEventsInRange(roomId: string, startDate: string, endDate: string) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firestore = getDb();
    const ref = collection(firestore, "rooms", roomId, "events");
    const q = query(
      ref,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const nextEvents = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as EventItem)
          .sort((a, b) => {
            const byDate = a.date.localeCompare(b.date);
            if (byDate !== 0) return byDate;
            return (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99");
          });

        setEvents(nextEvents);
        setLoading(false);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [roomId, startDate, endDate]);

  const byDate = useMemo(() => {
    return events.reduce<Record<string, EventItem[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [events]);

  return { events, byDate, loading, error };
}
