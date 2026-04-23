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
        <p className="text-sm font-semibold text-[#273f3a]">작성자 표시</p>
        <p className="text-xs text-[#687a75]">닉네임과 작성자 표시는 이 브라우저에 저장됩니다.</p>
      </div>

      <label className="block text-sm font-medium text-[#40534f]">
        닉네임
        <div className="mt-2 flex gap-2">
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="예: 민수"
            maxLength={18}
            className="h-11 min-w-0 flex-1 rounded border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
          />
          {currentProfile ? (
            <button
              type="button"
              onClick={saveCurrentNickname}
              className="h-11 rounded bg-[#14211f] px-3 text-sm font-semibold text-white"
            >
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
            className="grid h-11 min-w-11 place-items-center rounded border border-[#c9d7d2] bg-white text-lg shadow-sm transition hover:border-[#159a86]"
            title={`${emoji} 표시명 선택`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPick(withNickname({ label: randomNumberLabel(), kind: "number" }))}
          className="h-11 rounded border border-[#c9d7d2] bg-white px-4 text-sm font-semibold text-[#273f3a] shadow-sm transition hover:border-[#159a86]"
        >
          숫자
        </button>
      </div>

      {currentProfile ? (
        <div className="rounded border border-[#b8ded4] bg-[#eefaf7] px-3 py-2 text-sm text-[#146c61]">
          현재 사용자: <span className="font-semibold">{displayName}</span>
          {currentProfile.nickname ? <span className="text-[#4f7f76]"> · {currentProfile.label}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
