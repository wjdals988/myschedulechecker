"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useMemo, useState } from "react";
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

export function PersonalMenu({
  roomId,
  room,
  uid,
  profile,
  onProfileChange,
  onCopyShareLink,
  shareStatus,
}: PersonalMenuProps) {
  const [open, setOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname ?? "");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saved" | "failed">("idle");
  const { members, loading, error } = useRoomMembers(roomId, uid);
  const displayName = profileDisplayName(profile);
  const todayScheduleHref = `/rooms/${roomId}/schedule?date=${todayKey()}`;

  const memberSummary = useMemo(() => {
    if (loading) return "멤버 확인 중";
    return `${members.length}명 참여 중`;
  }, [loading, members.length]);

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

  return (
    <div className="relative">
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

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/18 backdrop-blur-[1px]"
            aria-label="개인 메뉴 닫기"
            onClick={() => setOpen(false)}
          />

          <section className="fixed inset-x-3 bottom-[5.5rem] top-[5rem] z-50 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:absolute sm:right-0 sm:top-12 sm:bottom-auto sm:w-[22rem] sm:max-h-[min(40rem,calc(100vh-5rem))]">
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
                <div className="max-h-56 overflow-y-auto px-2 py-2">
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
          </section>
        </>
      ) : null}
    </div>
  );
}
