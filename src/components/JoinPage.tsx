"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProfilePicker } from "@/components/ProfilePicker";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { getDb } from "@/lib/firebase";
import { normalizeInviteCode } from "@/lib/invite";

export function JoinPage({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const session = useAnonymousSession();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const code = normalizeInviteCode(inviteCode);

  useEffect(() => {
    if (!session.uid || !session.profile || startedRef.current) return;

    startedRef.current = true;

    async function joinRoom() {
      try {
        const firestore = getDb();
        const codeSnap = await getDoc(doc(firestore, "roomCodes", code));

        if (!codeSnap.exists()) {
          setError("초대 코드를 찾을 수 없습니다.");
          return;
        }

        const roomId = codeSnap.data().roomId as string;
        const now = serverTimestamp();

        await setDoc(
          doc(firestore, "rooms", roomId, "members", session.uid!),
          {
            label: session.profile!.label,
            nickname: session.profile!.nickname ?? null,
            inviteCode: code,
            joinedAt: now,
            lastSeenAt: now,
          },
          { merge: true },
        );

        router.replace(`/rooms/${roomId}/calendar`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "공유방 참가에 실패했습니다.");
      }
    }

    joinRoom();
  }, [code, router, session.profile, session.uid]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8faf9] px-5 py-8 text-[#14211f]">
      <section className="w-full max-w-md rounded-lg border border-[#d8e3df] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#159a86]">Invite</p>
        <h1 className="mt-2 text-2xl font-bold">공유방 참가</h1>
        <p className="mt-2 text-sm leading-6 text-[#687a75]">
          초대 코드 <span className="font-semibold tracking-[0.14em] text-[#14211f]">{code}</span>로 참가합니다.
        </p>

        <div className="mt-5">
          {session.loading ? <p className="text-sm text-[#687a75]">익명 세션을 준비하는 중입니다.</p> : null}
          {!session.loading && !session.profile ? (
            <ProfilePicker currentProfile={session.profile} onPick={session.setProfile} />
          ) : null}
          {!session.loading && session.profile && !error ? (
            <p className="rounded border border-[#d8e3df] bg-[#f8faf9] p-3 text-sm text-[#687a75]">공유방에 참가하는 중입니다.</p>
          ) : null}
          {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
