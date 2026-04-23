export type ThemePreference = "system" | "light" | "dark";

export const themeStorageKey = "themePreference";
const systemQuery = "(prefers-color-scheme: dark)";

export function readStoredThemePreference() {
  if (typeof window === "undefined") return "system" as ThemePreference;

  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system" as ThemePreference;
}

export function resolveTheme(preference: ThemePreference) {
  if (typeof window === "undefined") return "light";
  if (preference === "system") {
    return window.matchMedia(systemQuery).matches ? "dark" : "light";
  }

  return preference;
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;

  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return preference;

  window.localStorage.setItem(themeStorageKey, preference);
  applyThemePreference(preference);
  return preference;
}

export function themeInitScript() {
  return `
    (function () {
      try {
        var key = "${themeStorageKey}";
        var stored = window.localStorage.getItem(key);
        var preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
        var dark = preference === "dark" || (preference === "system" && window.matchMedia("${systemQuery}").matches);
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        document.documentElement.dataset.themePreference = preference;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
        document.documentElement.dataset.themePreference = "system";
      }
    })();
  `;
}
