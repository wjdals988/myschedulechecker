"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_RELEASE_NOTES, APP_VERSION } from "@/lib/appMeta";
import { cn } from "@/lib/utils";

export function ReleaseNotesButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const currentRelease = useMemo(
    () => APP_RELEASE_NOTES.find((release) => release.version === APP_VERSION) ?? APP_RELEASE_NOTES[0],
    [],
  );

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-7 items-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]",
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        v{APP_VERSION}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 px-4 py-8 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="mx-auto flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="릴리즈 노트"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
              <div>
                <p className="app-kicker">Release Notes</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">v{APP_VERSION}</h2>
                {currentRelease ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{currentRelease.title}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="app-button-secondary inline-flex h-9 items-center justify-center px-3 text-sm font-semibold"
              >
                닫기
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-5 py-4">
              {APP_RELEASE_NOTES.map((release) => (
                <section
                  key={release.version}
                  className={cn(
                    "rounded-2xl border p-4",
                    release.version === APP_VERSION
                      ? "border-[var(--accent)] bg-[var(--surface-muted)]"
                      : "border-[var(--border)] bg-[var(--background)]",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--foreground)]">v{release.version}</h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{release.title}</p>
                    </div>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                      {release.releasedAt}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                    {release.changes.map((change) => (
                      <li key={change} className="flex gap-2">
                        <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
