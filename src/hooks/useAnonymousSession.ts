"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureAnonymousAuth } from "@/lib/firebase";
import {
  readVisitorProfile,
  saveVisitorProfile,
} from "@/lib/profile";
import type { VisitorProfile } from "@/lib/types";

export function useAnonymousSession() {
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfileState] = useState<VisitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const nextUid = await ensureAnonymousAuth();
        if (!active) return;
        setUid(nextUid);
        setProfileState(readVisitorProfile());
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "인증에 실패했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

  const setProfile = useCallback((nextProfile: VisitorProfile) => {
    setProfileState(saveVisitorProfile(nextProfile));
  }, []);

  return {
    uid,
    profile,
    loading,
    error,
    ready: Boolean(uid && profile),
    setProfile,
  };
}
