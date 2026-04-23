import type { VisitorProfile } from "@/lib/types";

export const visitorProfileKey = "visitorProfile";

const animalLabels = ["🐶", "🐱", "🐻", "🐰", "🦊", "🐼", "🐯", "🐨"];

export function randomNumberLabel() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function makeMixedLabel(emoji = animalLabels[Math.floor(Math.random() * animalLabels.length)]) {
  return `${emoji} ${randomNumberLabel()}`;
}

export function animalOptions() {
  return animalLabels;
}

export function readVisitorProfile() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(visitorProfileKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<VisitorProfile>;
    if (!parsed.label) return null;
    return {
      label: parsed.label,
      nickname: parsed.nickname?.trim() || undefined,
      kind: parsed.kind ?? "mixed",
    };
  } catch {
    return null;
  }
}

export function saveVisitorProfile(profile: VisitorProfile) {
  const nextProfile = {
    ...profile,
    nickname: profile.nickname?.trim() || undefined,
  };

  window.localStorage.setItem(visitorProfileKey, JSON.stringify(nextProfile));
  return nextProfile;
}

export function profileDisplayName(profile: { label: string; nickname?: string | null }) {
  return profile.nickname?.trim() || profile.label;
}
