"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { EventItem } from "@/lib/types";

export function useEvent(roomId: string, eventId: string) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      doc(getDb(), "rooms", roomId, "events", eventId),
      (snapshot) => {
        setEvent(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as EventItem) : null);
        setLoading(false);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [roomId, eventId]);

  return { event, loading, error };
}
