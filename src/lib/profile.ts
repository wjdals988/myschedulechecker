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
    const parsed = JSON.parse(raw) as VisitorProfile;
    if (!parsed.label) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveVisitorProfile(profile: VisitorProfile) {
  window.localStorage.setItem(visitorProfileKey, JSON.stringify(profile));
  return profile;
}
