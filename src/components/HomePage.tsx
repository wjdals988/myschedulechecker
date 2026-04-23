"use client";

import { doc, getDoc, serverTimestamp, setDoc, writeBatch, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { getDb } from "@/lib/firebase";
import { createInviteCode, normalizeInviteCode } from "@/lib/invite";
import { ProfilePicker } from "@/components/ProfilePicker";
import { profileDisplayName } from "@/lib/profile";

export function HomePage() {
  const router = useRouter();
  const session = useAnonymousSession();
  const [roomName, setRoomName] = useState("우리 일정");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.uid || !session.profile) {
      setMessage("먼저 작성자 표시를 선택해 주세요.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const firestore = getDb();
      let code = createInviteCode();
      let codeRef = doc(firestore, "roomCodes", code);
      let codeSnap = await getDoc(codeRef);

      while (codeSnap.exists()) {
        code = createInviteCode();
        codeRef = doc(firestore, "roomCodes", code);
        codeSnap = await getDoc(codeRef);
      }

      const roomRef = doc(collection(firestore, "rooms"));
      const batch = writeBatch(firestore);
      const now = serverTimestamp();

      batch.set(roomRef, {
        name: roomName.trim() || "우리 일정",
        inviteCode: code,
        createdBy: session.uid,
        createdAt: now,
        updatedAt: now,
      });
      batch.set(codeRef, {
        roomId: roomRef.id,
        createdBy: session.uid,
        createdAt: now,
      });
      batch.set(doc(firestore, "rooms", roomRef.id, "members", session.uid), {
        label: session.profile.label,
        nickname: session.profile.nickname ?? null,
        inviteCode: code,
        joinedAt: now,
        lastSeenAt: now,
      });

      await batch.commit();
      router.push(`/rooms/${roomRef.id}/calendar`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "방 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.uid || !session.profile) {
      setMessage("먼저 작성자 표시를 선택해 주세요.");
      return;
    }

    const code = normalizeInviteCode(inviteCode);
    if (!code) {
      setMessage("초대 코드를 입력해 주세요.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const firestore = getDb();
      const codeSnap = await getDoc(doc(firestore, "roomCodes", code));
      if (!codeSnap.exists()) {
        setMessage("초대 코드를 찾을 수 없습니다.");
        return;
      }

      const roomId = codeSnap.data().roomId as string;
      const now = serverTimestamp();

      await setDoc(
        doc(firestore, "rooms", roomId, "members", session.uid),
        {
          label: session.profile.label,
          nickname: session.profile.nickname ?? null,
          inviteCode: code,
          joinedAt: now,
          lastSeenAt: now,
        },
        { merge: true },
      );

      router.push(`/rooms/${roomId}/calendar`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "방 참가에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8faf9] px-5 py-8 text-[#14211f]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-[#159a86]">Shared Schedule</p>
          <h1 className="text-4xl font-bold tracking-normal text-[#14211f]">초대 코드로 함께 쓰는 일정판</h1>
          <p className="max-w-2xl text-base leading-7 text-[#52645f]">
            회원가입 없이 익명 로그인으로 시작하고, 같은 초대 코드를 가진 사람들과 일정과 할 일을 실시간으로 공유합니다.
          </p>
        </header>

        <section className="rounded-lg border border-[#d8e3df] bg-white p-5 shadow-sm">
          {session.loading ? (
            <p className="text-sm text-[#687a75]">익명 세션을 준비하는 중입니다.</p>
          ) : (
            <ProfilePicker currentProfile={session.profile} onPick={session.setProfile} />
          )}
          {session.error ? <p className="mt-3 text-sm text-red-600">{session.error}</p> : null}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={createRoom} className="rounded-lg border border-[#d8e3df] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">새 공유방 만들기</h2>
            <label className="mt-4 block text-sm font-medium text-[#40534f]">
              방 이름
              <input
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                className="mt-2 w-full rounded border border-[#c9d7d2] px-3 py-2 outline-none transition focus:border-[#159a86]"
              />
            </label>
            <button
              disabled={busy || !session.uid}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded bg-[#14211f] px-4 text-sm font-semibold text-white transition hover:bg-[#243a35] disabled:opacity-50"
            >
              {session.profile ? `${profileDisplayName(session.profile)}로 방 만들기` : "방 만들기"}
            </button>
          </form>

          <form onSubmit={joinRoom} className="rounded-lg border border-[#d8e3df] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">초대 코드로 참가</h2>
            <label className="mt-4 block text-sm font-medium text-[#40534f]">
              초대 코드
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                className="mt-2 w-full rounded border border-[#c9d7d2] px-3 py-2 uppercase tracking-[0.16em] outline-none transition focus:border-[#159a86]"
              />
            </label>
            <button
              disabled={busy || !session.uid}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded bg-[#159a86] px-4 text-sm font-semibold text-white transition hover:bg-[#108270] disabled:opacity-50"
            >
              참가하기
            </button>
          </form>
        </div>

        {message ? (
          <div className="rounded border border-[#f0c9a6] bg-[#fff7ed] px-4 py-3 text-sm text-[#8a4b12]">{message}</div>
        ) : null}
      </div>
    </main>
  );
}
