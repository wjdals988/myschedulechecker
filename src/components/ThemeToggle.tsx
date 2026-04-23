"use client";

import type { ComponentType } from "react";
import { DesktopIcon, MoonIcon, SunIcon } from "@/components/icons";
import { useThemePreference } from "@/hooks/useThemePreference";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "light", label: "라이트", icon: SunIcon },
  { value: "dark", label: "다크", icon: MoonIcon },
  { value: "system", label: "시스템", icon: DesktopIcon },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { themePreference, setThemePreference } = useThemePreference();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)]",
        compact ? "gap-1" : "gap-1.5",
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = themePreference === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setThemePreference(option.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-md font-semibold transition",
              compact ? "h-9 w-9" : "h-9 gap-2 px-3 text-sm",
              active
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
            )}
            aria-label={`${option.label} 모드`}
            title={option.label}
          >
            <Icon className="h-4 w-4" />
            {compact ? null : <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
