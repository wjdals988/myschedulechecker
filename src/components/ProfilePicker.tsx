"use client";

import { useState } from "react";
import { animalOptions, makeMixedLabel, randomNumberLabel } from "@/lib/profile";
import type { VisitorProfile } from "@/lib/types";

export function ProfilePicker({
  currentProfile,
  onPick,
}: {
  currentProfile?: VisitorProfile | null;
  onPick: (profile: VisitorProfile) => void;
}) {
  const [nickname, setNickname] = useState(currentProfile?.nickname ?? "");

  function withNickname(profile: VisitorProfile) {
    const trimmed = nickname.trim();
    return {
      ...profile,
      nickname: trimmed || undefined,
    };
  }

  function saveCurrentNickname() {
    if (!currentProfile) return;
    onPick(withNickname(currentProfile));
  }

  const displayName = currentProfile?.nickname || currentProfile?.label;

  return (
    <div className="space-y-4">
      <div>
        <p className="app-kicker text-xs font-bold">Profile</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">작성자 표시</p>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">닉네임과 작성자 표시는 브라우저에 저장되어 다음 접속에도 유지됩니다.</p>
      </div>

      <label className="block text-sm font-semibold text-[var(--foreground)]">
        닉네임
        <div className="mt-2 flex gap-2">
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="입력은 선택"
            maxLength={18}
            className="app-input h-11 min-w-0 flex-1 px-3"
          />
          {currentProfile ? (
            <button type="button" onClick={saveCurrentNickname} className="app-button-primary h-11 px-3 text-sm font-semibold">
              저장
            </button>
          ) : null}
        </div>
      </label>

      <div className="flex flex-wrap gap-2">
        {animalOptions().map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(withNickname({ label: makeMixedLabel(emoji), kind: "mixed" }))}
            className="app-button-secondary app-button-emoji grid h-11 min-w-11 place-items-center font-medium shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
            title={`${emoji} 표시명 선택`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPick(withNickname({ label: randomNumberLabel(), kind: "number" }))}
          className="app-button-secondary h-11 px-4 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
        >
          숫자
        </button>
      </div>

      {currentProfile ? (
        <div className="app-subtle-panel px-3 py-2 text-sm text-[var(--accent)]">
          현재 사용 중 <span className="font-semibold">{displayName}</span>
          {currentProfile.nickname ? <span className="text-[var(--muted)]"> · {currentProfile.label}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
