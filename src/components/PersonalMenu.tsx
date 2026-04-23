"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarIcon, HomeIcon, ShareIcon, UserIcon, UsersIcon } from "@/components/icons";
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
    const count = members.length;
    if (loading) return "멤버 확인 중";
    return `${count}명 참여 중`;
  }, [loading, members.length]);

  async function saveNickname() {
    const nextProfile = {
      ...profile,
      nickname: nicknameDraft.trim() || undefined,
    };

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

  async function refreshLabel() {
    const nextProfile = {
      ...profile,
      label: makeMixedLabel(),
    };

    onProfileChange(nextProfile);

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 max-w-36 items-center justify-center gap-2 rounded-md border border-[#c9d7d2] bg-[#f8faf9] px-3 text-sm font-semibold text-[#273f3a] shadow-sm transition hover:border-[#159a86] sm:max-w-52",
          open && "border-[#159a86] bg-[#eefaf7]",
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
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="개인 메뉴 닫기"
            onClick={() => setOpen(false)}
          />
          <section className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#d8e3df] bg-white shadow-xl">
            <div className="border-b border-[#d8e3df] bg-[#f8faf9] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#159a86]">Profile</p>
              <h2 className="mt-1 truncate text-lg font-bold text-[#14211f]">{displayName}</h2>
              <p className="mt-1 text-xs font-semibold text-[#687a75]">
                {profile.label} · 초대 코드 <span className="tracking-[0.14em] text-[#159a86]">{room.inviteCode}</span>
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#c9d7d2] bg-white px-3 text-sm font-semibold transition hover:border-[#159a86]"
                >
                  <HomeIcon className="h-4 w-4" />
                  홈
                </Link>
                <Link
                  href={todayScheduleHref}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#c9d7d2] bg-white px-3 text-sm font-semibold transition hover:border-[#159a86]"
                >
                  <CalendarIcon className="h-4 w-4" />
                  오늘
                </Link>
              </div>

              <button
                type="button"
                onClick={onCopyShareLink}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#14211f] px-3 text-sm font-semibold text-white transition hover:bg-[#243a35]"
              >
                <ShareIcon className="h-4 w-4" />
                {shareStatus === "copied" ? "초대 링크 복사됨" : shareStatus === "failed" ? "복사 실패" : "초대 링크 복사"}
              </button>

              <div className="rounded-md border border-[#d8e3df] bg-white p-3">
                <label className="block text-xs font-semibold text-[#52645f]" htmlFor="nickname">
                  닉네임
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="nickname"
                    value={nicknameDraft}
                    onChange={(event) => setNicknameDraft(event.target.value)}
                    maxLength={18}
                    placeholder="닉네임 입력"
                    className="h-10 min-w-0 flex-1 rounded-md border border-[#c9d7d2] px-3 text-sm outline-none transition focus:border-[#159a86]"
                  />
                  <button
                    type="button"
                    onClick={saveNickname}
                    className="h-10 rounded-md bg-[#159a86] px-3 text-sm font-semibold text-white transition hover:bg-[#108270]"
                  >
                    저장
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={refreshLabel}
                    className="text-xs font-semibold text-[#159a86] transition hover:text-[#108270]"
                  >
                    표시 아이콘 바꾸기
                  </button>
                  {profileStatus !== "idle" ? (
                    <span className={cn("text-xs font-semibold", profileStatus === "saved" ? "text-[#159a86]" : "text-red-600")}>
                      {profileStatus === "saved" ? "저장됨" : "저장 실패"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-md border border-[#d8e3df] bg-white">
                <div className="flex items-center justify-between border-b border-[#d8e3df] px-3 py-2">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-[#14211f]">
                    <UsersIcon className="h-4 w-4" />
                    멤버
                  </div>
                  <span className="text-xs font-semibold text-[#687a75]">{memberSummary}</span>
                </div>
                <div className="max-h-52 overflow-y-auto p-2">
                  {error ? <p className="p-2 text-sm text-red-600">멤버를 불러오지 못했습니다.</p> : null}
                  {loading ? <p className="p-2 text-sm text-[#687a75]">멤버를 불러오는 중입니다.</p> : null}
                  {!loading && members.length === 0 ? <p className="p-2 text-sm text-[#687a75]">아직 표시할 멤버가 없습니다.</p> : null}
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-[#f8faf9]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#14211f]">{profileDisplayName(member)}</p>
                        {member.nickname ? <p className="text-xs text-[#687a75]">{member.label}</p> : null}
                      </div>
                      {member.id === uid ? (
                        <span className="rounded bg-[#eefaf7] px-2 py-1 text-xs font-bold text-[#146c61]">나</span>
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
