"use client";

import { collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ClockIcon } from "@/components/icons";
import { ProfilePicker } from "@/components/ProfilePicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { getDb } from "@/lib/firebase";
import { createInviteCode, normalizeInviteCode } from "@/lib/invite";
import { profileDisplayName } from "@/lib/profile";
import { readRecentRooms, saveRecentRoom } from "@/lib/recentRooms";

export function HomePage() {
  const router = useRouter();
  const session = useAnonymousSession();
  const [roomName, setRoomName] = useState("우리 일정");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recentRooms, setRecentRooms] = useState(() => readRecentRooms());

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.uid || !session.profile) {
      setMessage("먼저 작성자 프로필을 선택해 주세요.");
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
      const nextRoomName = roomName.trim() || "우리 일정";

      batch.set(roomRef, {
        name: nextRoomName,
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
      setRecentRooms(
        saveRecentRoom({
          roomId: roomRef.id,
          name: nextRoomName,
          inviteCode: code,
        }),
      );
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
      setMessage("먼저 작성자 프로필을 선택해 주세요.");
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
      const roomSnap = await getDoc(doc(firestore, "rooms", roomId));
      const roomData = roomSnap.data();
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

      setRecentRooms(
        saveRecentRoom({
          roomId,
          name: typeof roomData?.name === "string" ? roomData.name : `방 ${code}`,
          inviteCode: code,
        }),
      );
      router.push(`/rooms/${roomId}/calendar`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "방 참가에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-5 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="app-kicker text-xs font-bold">Shared Schedule</p>
            <h1 className="max-w-3xl text-3xl font-bold tracking-normal text-[var(--foreground)] sm:text-[2.6rem]">
              다시 찾지 않아도 바로 들어가는 공유 일정 홈
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              익명 로그인으로 바로 시작하고, 자주 들어가는 방은 홈에 남겨 두세요. 초대 코드와 최근 방문 기록만으로 빠르게 다시 이어집니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle compact />
            {session.profile ? (
              <div className="app-panel inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
                <span>{profileDisplayName(session.profile)}</span>
              </div>
            ) : null}
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_23rem]">
          <section className="space-y-6">
            <section className="app-panel p-5 sm:p-6">
              {session.loading ? (
                <p className="text-sm text-[var(--muted)]">익명 세션을 준비하는 중입니다.</p>
              ) : (
                <ProfilePicker currentProfile={session.profile} onPick={session.setProfile} />
              )}
              {session.error ? <p className="mt-3 text-sm text-red-600">{session.error}</p> : null}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <form onSubmit={createRoom} className="app-panel p-5 sm:p-6">
                <p className="app-kicker text-xs font-bold">Create Room</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">새 공유방 만들기</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">가족, 팀, 커플 등 함께 쓰는 방을 바로 만들 수 있습니다.</p>
                <label className="mt-5 block text-sm font-semibold text-[var(--foreground)]">
                  방 이름
                  <input
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    className="app-input mt-2 h-11 w-full px-3"
                    placeholder="우리 일정"
                  />
                </label>
                <button
                  disabled={busy || !session.uid}
                  className="app-button-primary mt-5 inline-flex h-11 w-full items-center justify-center px-4 text-sm font-semibold disabled:opacity-50"
                >
                  {session.profile ? `${profileDisplayName(session.profile)}로 방 만들기` : "방 만들기"}
                </button>
              </form>

              <form onSubmit={joinRoom} className="app-panel p-5 sm:p-6">
                <p className="app-kicker text-xs font-bold">Join With Code</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">초대 코드로 참가</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">공유받은 코드를 붙여 넣으면 바로 방에 들어갑니다.</p>
                <label className="mt-5 block text-sm font-semibold text-[var(--foreground)]">
                  초대 코드
                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="app-input mt-2 h-11 w-full px-3 uppercase tracking-[0.16em]"
                  />
                </label>
                <button
                  disabled={busy || !session.uid}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[#0e1716] disabled:opacity-50"
                >
                  방 참가하기
                </button>
              </form>
            </div>

            {message ? (
              <div className="app-subtle-panel border-[#f0c9a6] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#8a4b12]">
                {message}
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="app-panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="app-kicker text-xs font-bold">Recent Rooms</p>
                  <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">최근 들어간 방</h2>
                </div>
                <ClockIcon className="h-5 w-5 text-[var(--accent)]" />
              </div>

              {recentRooms.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  최근 방문한 방이 아직 없습니다. 한 번 들어간 방은 여기에서 바로 다시 열 수 있습니다.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {recentRooms.map((room) => (
                    <Link
                      key={room.roomId}
                      href={`/join/${room.inviteCode}`}
                      className="block rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--foreground)]">{room.name}</p>
                          <p className="mt-1 text-xs font-semibold tracking-[0.14em] text-[var(--accent)]">{room.inviteCode}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[var(--muted)]">
                          {formatVisitedAt(room.lastVisitedAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function formatVisitedAt(timestamp: number) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}
