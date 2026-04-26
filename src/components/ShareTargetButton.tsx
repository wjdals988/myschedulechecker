"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function ShareTargetButton({
  path,
  label = "공유",
  title = "공유 링크 복사",
  className,
  iconOnly = false,
}: {
  path: string;
  label?: string;
  title?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    const url = `${window.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    } finally {
      window.setTimeout(() => setStatus("idle"), 1800);
    }
  }

  const text = status === "copied" ? "복사됨" : status === "failed" ? "실패" : label;
  const activeTitle = status === "idle" ? title : text;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={copyLink}
        className={cn(
          "app-button-secondary inline-flex h-9 items-center justify-center gap-1.5 px-3 text-xs font-semibold hover:border-[var(--accent)]",
          iconOnly && "w-9 px-0",
          status === "copied" && "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
          status === "failed" && "border-red-200 bg-red-50 text-red-600 dark:bg-red-950/30",
          className,
        )}
        title={activeTitle}
        aria-label={activeTitle}
      >
        <ShareIcon className="h-4 w-4" />
        {iconOnly ? <span className="sr-only">{text}</span> : <span>{text}</span>}
      </button>
      {iconOnly && status !== "idle" ? (
        <span
          role="status"
          className={cn(
            "pointer-events-none absolute right-0 top-full z-30 mt-1 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-bold shadow-[var(--shadow-soft)]",
            status === "copied"
              ? "border-[var(--accent)] bg-[var(--surface)] text-[var(--accent-strong)]"
              : "border-red-200 bg-[var(--surface)] text-red-600",
          )}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
