"use client";

import { EVENT_COLOR_OPTIONS, normalizeEventColor, type EventColorKey } from "@/lib/eventAppearance";
import { cn } from "@/lib/utils";

export function EventAppearanceFields({
  tag,
  color,
  onTagChange,
  onColorChange,
}: {
  tag: string;
  color: EventColorKey;
  onTagChange: (value: string) => void;
  onColorChange: (value: EventColorKey) => void;
}) {
  const activeColor = normalizeEventColor(color);

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
      <label className="block text-sm font-semibold text-[#40534f]">
        태그
        <input
          value={tag}
          onChange={(event) => onTagChange(event.target.value)}
          maxLength={14}
          placeholder="업무, 개인, 모임"
          className="mt-2 h-11 w-full rounded-md border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
        />
      </label>

      <div className="block text-sm font-semibold text-[#40534f]">
        색상
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-3">
          {EVENT_COLOR_OPTIONS.map((option) => {
            const active = option.key === activeColor;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onColorChange(option.key)}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-semibold whitespace-nowrap transition hover:-translate-y-0.5 sm:gap-2 sm:px-3",
                  active
                    ? option.badgeClass
                    : "border-[#c9d7d2] bg-white text-[#40534f] hover:border-[#159a86]",
                )}
                aria-pressed={active}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", option.dotClass)} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
