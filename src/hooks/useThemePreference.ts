"use client";

import { useEffect, useState } from "react";
import {
  applyThemePreference,
  readStoredThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/lib/theme";

export function useThemePreference() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => readStoredThemePreference());

  useEffect(() => {
    applyThemePreference(themePreference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (themePreference === "system") {
        applyThemePreference("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themePreference]);

  function setThemePreference(nextPreference: ThemePreference) {
    setThemePreferenceState(saveThemePreference(nextPreference));
  }

  return {
    themePreference,
    setThemePreference,
  };
}
