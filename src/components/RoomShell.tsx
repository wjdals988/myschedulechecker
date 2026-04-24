"use client";

import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PersonalMenu } from "@/components/PersonalMenu";
import { ProfilePicker } from "@/components/ProfilePicker";
import { ReleaseNotesButton } from "@/components/ReleaseNotesButton";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { todayKey } from "@/lib/dates";
import { getDb } from "@/lib/firebase";
import { saveRecentRoom } from "@/lib/recentRooms";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckListIcon, ListIcon, ShareIcon } from "@/components/icons";

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

    saveRecentRoom({
      roomId,
      name: room.name,
      inviteCode: room.inviteCode,
    });
  }, [room, roomId, session.profile, session.uid]);

  async function copyShareLink(inviteCode: string) {
    const shareUrl = `${window.location.origin}/join/${inviteCode}`;

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
      <main className="grid min-h-screen place-items-center bg-[var(--background)] p-6 text-[var(--muted)]">
        일정을 불러오는 중입니다.
      </main>
    );
  }

  if (!session.uid || !session.profile) {
    return (
      <main className="min-h-screen bg-[var(--background)] p-6">
        <div className="app-panel mx-auto max-w-md p-5">
          <ProfilePicker onPick={session.setProfile} />
        </div>
      </main>
    );
  }

  if (roomError || !room) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] p-6">
        <div className="app-panel max-w-md p-5 text-center">
          <h1 className="text-xl font-semibold">공유방에 접근할 수 없습니다</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            홈 화면에서 초대 코드로 다시 참가하면 이 방의 일정과 할 일을 계속 볼 수 있습니다.
          </p>
          <Link href="/" className="app-button-primary mt-5 inline-flex h-11 items-center justify-center px-4 text-sm font-semibold">
            홈으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const scheduleHref = `/rooms/${roomId}/schedule?date=${todayKey()}`;
  const todosHref = `/rooms/${roomId}/todos?date=${todayKey()}&range=week`;
  const isCalendarPage = pathname.endsWith("/calendar");
  const isScheduleListPage = pathname.endsWith("/schedule");
  const isTodosPage = pathname.endsWith("/todos");
  const contentWidthClassName = isCalendarPage || isScheduleListPage || isTodosPage ? "max-w-[92rem]" : "max-w-5xl";

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 backdrop-blur">
        <div className={cn("mx-auto flex flex-wrap items-start justify-between gap-3 sm:items-center", contentWidthClassName)}>
          <div className="min-w-0">
            <p className="truncate text-[1.1rem] font-bold text-[var(--foreground)]">{room.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <p>
                초대 코드 <span className="font-semibold tracking-[0.16em] text-[var(--accent)]">{room.inviteCode}</span>
              </p>
              <ReleaseNotesButton />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => copyShareLink(room.inviteCode)}
              className="app-button-secondary inline-flex h-10 items-center justify-center gap-1 px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
              title="공유 링크 복사"
            >
              <ShareIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{shareStatus === "copied" ? "복사됨" : shareStatus === "failed" ? "실패" : "공유"}</span>
            </button>

            <PersonalMenu
              key={`${roomId}-${session.profile.label}-${session.profile.nickname ?? ""}`}
              roomId={roomId}
              room={room}
              uid={session.uid}
              profile={session.profile}
              onProfileChange={session.setProfile}
              onCopyShareLink={() => copyShareLink(room.inviteCode)}
              shareStatus={shareStatus}
            />
          </div>
        </div>

        {shareStatus !== "idle" ? (
          <p className={cn("mx-auto mt-2 text-right text-xs font-semibold text-[var(--accent)]", contentWidthClassName)}>
            {shareStatus === "copied"
              ? "초대 링크를 복사했습니다."
              : "복사에 실패했습니다. 브라우저 권한을 확인해 주세요."}
          </p>
        ) : null}
      </header>

      <div className={cn("mx-auto", contentWidthClassName)}>{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <Link
            href={`/rooms/${roomId}/calendar`}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold transition",
              pathname.endsWith("/calendar")
                ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)]",
            )}
          >
            <CalendarIcon />
            달력
          </Link>
          <Link
            href={scheduleHref}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold transition",
              pathname.includes("/schedule")
                ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)]",
            )}
          >
            <ListIcon />
            일정
          </Link>
          <Link
            href={todosHref}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold transition",
              pathname.includes("/todos")
                ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)]",
            )}
          >
            <CheckListIcon />
            할일
          </Link>
        </div>
      </nav>
    </div>
  );
}
