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

  return (
    <button
      type="button"
      onClick={copyLink}
      className={cn(
        "app-button-secondary inline-flex h-9 items-center justify-center gap-1.5 px-3 text-xs font-semibold hover:border-[var(--accent)]",
        iconOnly && "w-9 px-0",
        className,
      )}
      title={title}
      aria-label={title}
    >
      <ShareIcon className="h-4 w-4" />
      {iconOnly ? <span className="sr-only">{text}</span> : <span>{text}</span>}
    </button>
  );
}
