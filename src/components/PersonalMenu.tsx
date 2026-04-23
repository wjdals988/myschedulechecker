"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, HomeIcon, ShareIcon, UserIcon, UsersIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRoomMembers } from "@/hooks/useRoomMembers";
import { todayKey } from "@/lib/dates";
import { getDb } from "@/lib/firebase";
import { makeMixedLabel, profileDisplayName } from "@/lib/profile";
import type { Room, VisitorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type PersonalMenuProps = {
  roomId: string;
  room: Room;
  uid: string;
  profile: VisitorProfile;
  onProfileChange: (profile: VisitorProfile) => void;
  onCopyShareLink: () => void;
  shareStatus: "idle" | "copied" | "failed";
};

type DesktopPanelPosition = {
  top: number;
  right: number;
};

export function PersonalMenu({
  roomId,
  room,
  uid,
  profile,
  onProfileChange,
  onCopyShareLink,
  shareStatus,
}: PersonalMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname ?? "");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [desktopPanelPosition, setDesktopPanelPosition] = useState<DesktopPanelPosition>({ top: 80, right: 16 });
  const { members, loading, error } = useRoomMembers(roomId, uid);
  const displayName = profileDisplayName(profile);
  const todayScheduleHref = `/rooms/${roomId}/schedule?date=${todayKey()}`;

  const memberSummary = useMemo(() => {
    if (loading) return "멤버 확인 중";
    return `${members.length}명 참여 중`;
  }, [loading, members.length]);

  useEffect(() => {
    if (!open) return;

    function updateDesktopPanelPosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDesktopPanelPosition({
        top: Math.round(rect.bottom + 10),
        right: Math.max(Math.round(window.innerWidth - rect.right), 16),
      });
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    updateDesktopPanelPosition();
    window.addEventListener("resize", updateDesktopPanelPosition);
    window.addEventListener("scroll", updateDesktopPanelPosition, true);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updateDesktopPanelPosition);
      window.removeEventListener("scroll", updateDesktopPanelPosition, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function persistProfile(nextProfile: VisitorProfile) {
    onProfileChange(nextProfile);
    setProfileStatus("idle");

    try {
      await updateDoc(doc(getDb(), "rooms", roomId, "members", uid), {
        label: nextProfile.label,
        nickname: nextProfile.nickname ?? null,
        lastSeenAt: serverTimestamp(),
      });
      setProfileStatus("saved");
      window.setTimeout(() => setProfileStatus("idle"), 1800);
    } catch {
      setProfileStatus("failed");
    }
  }

  async function saveNickname() {
    await persistProfile({
      ...profile,
      nickname: nicknameDraft.trim() || undefined,
    });
  }

  async function refreshLabel() {
    await persistProfile({
      ...profile,
      label: makeMixedLabel(),
    });
  }

  const menuContent = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.2rem)] pt-3 sm:px-5 sm:py-5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--border-strong)] sm:hidden" />

        <div className="border-b border-[var(--border)] pb-4">
          <p className="app-kicker text-xs font-bold">Profile</p>
          <h2 className="mt-2 truncate text-lg font-bold text-[var(--foreground)]">{displayName}</h2>
          <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
            {profile.label} · 초대 코드 <span className="tracking-[0.14em] text-[var(--accent)]">{room.inviteCode}</span>
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="app-button-secondary inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-semibold hover:border-[var(--accent)]"
            >
              <HomeIcon className="h-4 w-4" />
              홈
            </Link>
            <Link
              href={todayScheduleHref}
              onClick={() => setOpen(false)}
              className="app-button-secondary inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-semibold hover:border-[var(--accent)]"
            >
              <CalendarIcon className="h-4 w-4" />
              오늘
            </Link>
          </div>

          <button
            type="button"
            onClick={onCopyShareLink}
            className="app-button-primary inline-flex h-10 w-full items-center justify-center gap-2 px-3 text-sm font-semibold"
          >
            <ShareIcon className="h-4 w-4" />
            {shareStatus === "copied" ? "초대 링크 복사됨" : shareStatus === "failed" ? "복사 실패" : "초대 링크 복사"}
          </button>

          <div className="app-subtle-panel p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">테마</p>
              <span className="text-xs font-semibold text-[var(--muted)]">라이트 · 다크 · 시스템</span>
            </div>
            <ThemeToggle />
          </div>

          <div className="app-subtle-panel p-3">
            <label className="block text-xs font-semibold text-[var(--muted)]" htmlFor="nickname">
              닉네임
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="nickname"
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                maxLength={18}
                placeholder="닉네임 입력"
                className="app-input h-10 min-w-0 flex-1 px-3 text-sm"
              />
              <button
                type="button"
                onClick={saveNickname}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-sm font-semibold text-[#0f1716]"
              >
                저장
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={refreshLabel}
                className="text-xs font-semibold text-[var(--accent)] transition hover:opacity-80"
              >
                표시 아이콘 바꾸기
              </button>
              {profileStatus !== "idle" ? (
                <span className={cn("text-xs font-semibold", profileStatus === "saved" ? "text-[var(--accent)]" : "text-red-600")}>
                  {profileStatus === "saved" ? "저장됨" : "저장 실패"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="app-subtle-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                <UsersIcon className="h-4 w-4" />
                멤버
              </div>
              <span className="text-xs font-semibold text-[var(--muted)]">{memberSummary}</span>
            </div>
            <div className="px-2 py-2">
              {error ? <p className="px-2 py-2 text-sm text-red-600">멤버를 불러오지 못했습니다.</p> : null}
              {loading ? <p className="px-2 py-2 text-sm text-[var(--muted)]">멤버를 불러오는 중입니다.</p> : null}
              {!loading && members.length === 0 ? <p className="px-2 py-2 text-sm text-[var(--muted)]">표시할 멤버가 없습니다.</p> : null}
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-[var(--surface)]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{profileDisplayName(member)}</p>
                    {member.nickname ? <p className="text-xs text-[var(--muted)]">{member.label}</p> : null}
                  </div>
                  {member.id === uid ? (
                    <span className="rounded-md bg-[var(--accent-weak)] px-2 py-1 text-xs font-bold text-[var(--accent)]">나</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "app-button-secondary inline-flex h-10 max-w-[10.5rem] items-center justify-center gap-2 px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)] sm:max-w-[13rem]",
          open && "border-[var(--accent)] bg-[var(--surface-muted)]",
        )}
        aria-expanded={open}
        aria-label="개인 메뉴 열기"
      >
        <UserIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{displayName}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[70] bg-black/24 backdrop-blur-[1.5px]"
                aria-label="개인 메뉴 닫기"
                onClick={() => setOpen(false)}
              />

              <section className="fixed inset-x-0 bottom-0 z-[80] flex max-h-[min(88dvh,48rem)] flex-col overflow-hidden rounded-t-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] sm:hidden">
                {menuContent}
              </section>

              <section
                className="hidden sm:flex sm:fixed sm:z-[80] sm:max-h-[calc(100dvh-6rem)] sm:w-[24rem] sm:flex-col sm:overflow-hidden sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)] sm:shadow-[var(--shadow-soft)]"
                style={{
                  top: `${desktopPanelPosition.top}px`,
                  right: `${desktopPanelPosition.right}px`,
                }}
              >
                {menuContent}
              </section>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
