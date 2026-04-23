"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "@/lib/firebase";
import { profileDisplayName } from "@/lib/profile";
import type { RoomMember } from "@/lib/types";

export function useRoomMembers(roomId: string, currentUid: string) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      collection(getDb(), "rooms", roomId, "members"),
      (snapshot) => {
        const nextMembers = snapshot.docs.map((memberDoc) => ({
          id: memberDoc.id,
          ...memberDoc.data(),
        })) as RoomMember[];

        setMembers(nextMembers);
        setLoading(false);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [currentUid, roomId]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.id === currentUid) return -1;
      if (b.id === currentUid) return 1;
      return profileDisplayName(a).localeCompare(profileDisplayName(b), "ko");
    });
  }, [currentUid, members]);

  return { members: sortedMembers, loading, error };
}
