"use client";

import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { APP_VERSION } from "@/lib/appMeta";
import { getDb } from "@/lib/firebase";
import { profileDisplayName } from "@/lib/profile";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarIcon, ListIcon, ShareIcon } from "@/components/icons";
import { ProfilePicker } from "@/components/ProfilePicker";
import { todayKey } from "@/lib/dates";

export function RoomShell({
  roomId,
  children,
}: {
  roomId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const session = useAnonymousSession();
  const [room, setRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (!session.uid) return;

    return onSnapshot(
      doc(getDb(), "rooms", roomId),
      (snapshot) => {
        setRoom(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Room) : null);
        setLoadingRoom(false);
      },
      (caught) => {
        setRoomError(caught.message);
        setLoadingRoom(false);
      },
    );
  }, [roomId, session.uid]);

  useEffect(() => {
    if (!session.uid || !session.profile || !room) return;

    updateDoc(doc(getDb(), "rooms", roomId, "members", session.uid), {
      label: session.profile.label,
      nickname: session.profile.nickname ?? null,
      lastSeenAt: serverTimestamp(),
    }).catch(() => undefined);
  }, [room, roomId, session.profile, session.uid]);

  async function copyShareLink(inviteCode: string) {
    const origin = window.location.origin;
    const shareUrl = `${origin}/join/${inviteCode}`;

    try {
      await window.navigator.clipboard.writeText(shareUrl);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch {
      setShareStatus("failed");
      window.setTimeout(() => setShareStatus("idle"), 2200);
    }
  }

  if (session.loading || loadingRoom) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8faf9] p-6 text-[#52645f]">
        일정을 불러오는 중입니다.
      </main>
    );
  }

  if (!session.profile) {
    return (
      <main className="min-h-screen bg-[#f8faf9] p-6">
        <div className="mx-auto max-w-md rounded-lg border border-[#d8e3df] bg-white p-5 shadow-sm">
          <ProfilePicker onPick={session.setProfile} />
        </div>
      </main>
    );
  }

  if (roomError || !room) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8faf9] p-6">
        <div className="max-w-md rounded-lg border border-[#d8e3df] bg-white p-5 text-center shadow-sm">
          <h1 className="text-xl font-semibold">공유방에 접근할 수 없습니다</h1>
          <p className="mt-3 text-sm leading-6 text-[#687a75]">
            홈 화면에서 초대 코드로 참가하면 이 방의 일정에 접근할 수 있습니다.
          </p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center justify-center rounded bg-[#14211f] px-4 text-sm font-semibold text-white">
            홈으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const scheduleHref = `/rooms/${roomId}/schedule?date=${todayKey()}`;

  return (
    <div className="min-h-screen bg-[#f8faf9] pb-24 text-[#14211f]">
      <header className="sticky top-0 z-20 border-b border-[#d8e3df] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{room.name}</p>
            <p className="text-xs text-[#687a75]">
              초대 코드 <span className="font-semibold tracking-[0.16em] text-[#159a86]">{room.inviteCode}</span>
              <span className="ml-2 text-[#9aa8a4]">v{APP_VERSION}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => copyShareLink(room.inviteCode)}
              className="inline-flex h-10 items-center justify-center gap-1 rounded border border-[#c9d7d2] bg-white px-3 text-sm font-semibold text-[#273f3a]"
              title="공유 링크 복사"
            >
              <ShareIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{shareStatus === "copied" ? "복사됨" : shareStatus === "failed" ? "실패" : "공유"}</span>
            </button>
            <div className="max-w-32 truncate rounded border border-[#d8e3df] bg-[#f8faf9] px-3 py-2 text-sm font-semibold sm:max-w-48">
              {profileDisplayName(session.profile)}
            </div>
          </div>
        </div>
        {shareStatus !== "idle" ? (
          <p className="mx-auto mt-2 max-w-5xl text-right text-xs font-semibold text-[#159a86]">
            {shareStatus === "copied" ? "공유 링크를 복사했습니다." : "복사에 실패했습니다. 브라우저 권한을 확인해 주세요."}
          </p>
        ) : null}
      </header>

      <div className="mx-auto max-w-5xl">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8e3df] bg-white/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <Link
            href={`/rooms/${roomId}/calendar`}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded text-sm font-semibold transition",
              pathname.endsWith("/calendar") ? "bg-[#14211f] text-white" : "text-[#52645f] hover:bg-[#edf5f2]",
            )}
          >
            <CalendarIcon />
            달력
          </Link>
          <Link
            href={scheduleHref}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded text-sm font-semibold transition",
              pathname.includes("/schedule") ? "bg-[#14211f] text-white" : "text-[#52645f] hover:bg-[#edf5f2]",
            )}
          >
            <ListIcon />
            일정
          </Link>
        </div>
      </nav>
    </div>
  );
}
