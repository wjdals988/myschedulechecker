"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { EventItem } from "@/lib/types";

export function useEventsByDate(roomId: string, date: string) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firestore = getDb();
    const ref = collection(firestore, "rooms", roomId, "events");
    const q = query(ref, where("date", "==", date));

    return onSnapshot(
      q,
      (snapshot) => {
        const nextEvents = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as EventItem)
          .sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"));

        setEvents(nextEvents);
        setLoading(false);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [roomId, date]);

  return { events, loading, error };
}
