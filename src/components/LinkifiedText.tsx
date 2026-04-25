import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const urlPattern = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export function hasLink(text: string) {
  return /(https?:\/\/|www\.)/i.test(text);
}

export function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(urlPattern)) {
    const value = match[0];
    const index = match.index ?? 0;

    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }

    parts.push(
      <a
        key={`${value}-${index}`}
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="font-semibold text-[var(--accent)] underline decoration-current/35 underline-offset-2 hover:decoration-current"
      >
        {value}
      </a>,
    );
    cursor = index + value.length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <span className={cn("whitespace-pre-wrap break-words", className)}>{parts}</span>;
}
