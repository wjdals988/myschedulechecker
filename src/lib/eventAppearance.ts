export type EventColorKey = "mint" | "sky" | "amber" | "rose" | "violet" | "slate";

export type EventColorOption = {
  key: EventColorKey;
  label: string;
  dotClass: string;
  badgeClass: string;
  accentClass: string;
};

export const DEFAULT_EVENT_COLOR: EventColorKey = "mint";

export const EVENT_COLOR_OPTIONS: EventColorOption[] = [
  {
    key: "mint",
    label: "민트",
    dotClass: "bg-[#159a86]",
    badgeClass: "border-[#b8ded4] bg-[#eefaf7] text-[#146c61]",
    accentClass: "border-l-[#159a86]",
  },
  {
    key: "sky",
    label: "블루",
    dotClass: "bg-[#4a8ff0]",
    badgeClass: "border-[#bfd7f5] bg-[#eef6ff] text-[#285ea8]",
    accentClass: "border-l-[#4a8ff0]",
  },
  {
    key: "amber",
    label: "옐로",
    dotClass: "bg-[#df8a22]",
    badgeClass: "border-[#f2d3a2] bg-[#fff6e8] text-[#9a5a14]",
    accentClass: "border-l-[#df8a22]",
  },
  {
    key: "rose",
    label: "핑크",
    dotClass: "bg-[#e06b8b]",
    badgeClass: "border-[#f1c2cf] bg-[#fff0f3] text-[#a44c66]",
    accentClass: "border-l-[#e06b8b]",
  },
  {
    key: "violet",
    label: "퍼플",
    dotClass: "bg-[#8b63d9]",
    badgeClass: "border-[#d9c8ff] bg-[#f5f1ff] text-[#6642a8]",
    accentClass: "border-l-[#8b63d9]",
  },
  {
    key: "slate",
    label: "그레이",
    dotClass: "bg-[#667b88]",
    badgeClass: "border-[#cdd6db] bg-[#f1f4f6] text-[#41525c]",
    accentClass: "border-l-[#667b88]",
  },
];

export function normalizeEventColor(color?: string | null): EventColorKey {
  const matched = EVENT_COLOR_OPTIONS.find((option) => option.key === color);
  return matched?.key ?? DEFAULT_EVENT_COLOR;
}

export function getEventColorOption(color?: string | null) {
  return EVENT_COLOR_OPTIONS.find((option) => option.key === color) ?? EVENT_COLOR_OPTIONS[0];
}

export function normalizeEventTag(tag?: string | null) {
  return tag?.trim() || "";
}
