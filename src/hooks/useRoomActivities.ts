"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { RoomActivity } from "@/lib/types";

export function useRoomActivities(roomId: string, enabled = true) {
  const [activities, setActivities] = useState<RoomActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ref = collection(getDb(), "rooms", roomId, "activities");

    return onSnapshot(
      query(ref, orderBy("createdAt", "desc"), limit(40)),
      (snapshot) => {
        setActivities(snapshot.docs.map((activityDoc) => ({ id: activityDoc.id, ...activityDoc.data() }) as RoomActivity));
        setError(null);
        setLoading(false);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [enabled, roomId]);

  return { activities, loading: enabled && loading, error };
}
