"use client";

import { animalOptions, makeMixedLabel, randomNumberLabel } from "@/lib/profile";
import type { VisitorProfile } from "@/lib/types";

export function ProfilePicker({
  currentLabel,
  onPick,
}: {
  currentLabel?: string;
  onPick: (profile: VisitorProfile) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[#273f3a]">작성자 표시</p>
        <p className="text-xs text-[#687a75]">이 값은 이 브라우저의 로컬 스토리지에 저장됩니다.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {animalOptions().map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick({ label: makeMixedLabel(emoji), kind: "mixed" })}
            className="grid h-11 min-w-11 place-items-center rounded border border-[#c9d7d2] bg-white text-lg shadow-sm transition hover:border-[#159a86]"
            title={`${emoji} 표시명 선택`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPick({ label: randomNumberLabel(), kind: "number" })}
          className="h-11 rounded border border-[#c9d7d2] bg-white px-4 text-sm font-semibold text-[#273f3a] shadow-sm transition hover:border-[#159a86]"
        >
          숫자
        </button>
      </div>

      {currentLabel ? (
        <div className="rounded border border-[#b8ded4] bg-[#eefaf7] px-3 py-2 text-sm text-[#146c61]">
          현재 표시명: <span className="font-semibold">{currentLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
