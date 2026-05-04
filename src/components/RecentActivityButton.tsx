"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, CheckListIcon, ClockIcon, ListIcon } from "@/components/icons";
import { useRoomActivities } from "@/hooks/useRoomActivities";
import type { ActivityType, RoomActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecentActivityButton({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const { activities, loading, error } = useRoomActivities(roomId, open);
  const panelTitleId = "recent-activity-title";

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

  const content = (
    <RecentActivityPanel
      titleId={panelTitleId}
      activities={activities}
      loading={loading}
      error={error}
      onClose={() => setOpen(false)}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-button-secondary inline-flex h-10 items-center justify-center gap-1 px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelTitleId : undefined}
        title="최근 활동 보기"
      >
        <ClockIcon className="h-4 w-4" />
        <span className="hidden sm:inline">활동</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[60] bg-black/24 backdrop-blur-[1.5px]"
                aria-label="최근 활동 닫기"
                onClick={() => setOpen(false)}
              />

              <section
                className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[min(86dvh,46rem)] flex-col overflow-hidden rounded-t-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] sm:hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby={panelTitleId}
              >
                {content}
              </section>

              <section
                className="hidden sm:fixed sm:bottom-4 sm:right-4 sm:top-4 sm:z-[70] sm:flex sm:w-[26rem] sm:flex-col sm:overflow-hidden sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)] sm:shadow-[var(--shadow-soft)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby={panelTitleId}
              >
                {content}
              </section>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function RecentActivityPanel({
  titleId,
  activities,
  loading,
  error,
  onClose,
}: {
  titleId: string;
  activities: RoomActivity[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border)] px-4 pb-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--border-strong)] sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-kicker text-[0.7rem] font-bold">Activity</p>
            <h2 id={titleId} className="mt-1 text-xl font-bold text-[var(--foreground)]">
              최근 활동
            </h2>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">이 방에서 새로 추가되거나 바뀐 내역입니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-button-secondary h-9 px-3 text-sm font-semibold hover:border-[var(--accent)]"
          >
            닫기
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            최근 활동을 불러오지 못했습니다. Firestore Rules가 최신인지 확인해 주세요.
          </p>
        ) : null}

        {loading ? <p className="text-sm font-semibold text-[var(--muted)]">최근 활동을 불러오는 중입니다.</p> : null}

        {!loading && !error && activities.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-5 text-center">
            <p className="font-bold text-[var(--foreground)]">아직 표시할 활동이 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">이제부터 추가, 수정, 완료, 의견 등록 내역이 여기에 쌓입니다.</p>
          </div>
        ) : null}

        {activities.length > 0 ? (
          <ol className="space-y-2">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} onNavigate={onClose} />
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}

function ActivityItem({ activity, onNavigate }: { activity: RoomActivity; onNavigate: () => void }) {
  const metadata = getActivityMetadata(activity.type);
  const body = (
    <div className="flex gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-left transition hover:border-[var(--accent)]">
      <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md", metadata.iconClass)}>
        <metadata.Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-[var(--foreground)]">
          <span className="font-bold text-[var(--accent)]">{activity.actorLabel}</span>
          <span className="mx-1 text-[var(--muted)]">·</span>
          <span className="font-bold">{metadata.label}</span>
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{activity.title}</p>
        {activity.summary ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{activity.summary}</p> : null}
        <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">{formatActivityTime(activity.createdAt)}</p>
      </div>
    </div>
  );

  return (
    <li>
      {activity.href ? (
        <Link href={activity.href} onClick={onNavigate} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

function getActivityMetadata(type: ActivityType) {
  if (type.startsWith("event.comment") || type.startsWith("todo.comment")) {
    return {
      label: type.endsWith("deleted") ? "의견 삭제" : "의견 추가",
      Icon: ListIcon,
      iconClass: "bg-[#eef6ff] text-[#285ea8]",
    };
  }

  if (type.startsWith("todo")) {
    const labelMap: Record<ActivityType, string> = {
      "event.created": "일정 추가",
      "event.updated": "일정 수정",
      "event.deleted": "일정 삭제",
      "event.comment.created": "의견 추가",
      "event.comment.deleted": "의견 삭제",
      "todo.created": "할일 추가",
      "todo.updated": "할일 수정",
      "todo.completed": "할일 완료",
      "todo.reopened": "할일 미완료",
      "todo.deleted": "할일 삭제",
      "todo.comment.created": "의견 추가",
      "todo.comment.deleted": "의견 삭제",
    };

    return {
      label: labelMap[type],
      Icon: CheckListIcon,
      iconClass: "bg-[var(--accent-weak)] text-[var(--accent)]",
    };
  }

  const labelMap: Record<ActivityType, string> = {
    "event.created": "일정 추가",
    "event.updated": "일정 수정",
    "event.deleted": "일정 삭제",
    "event.comment.created": "의견 추가",
    "event.comment.deleted": "의견 삭제",
    "todo.created": "할일 추가",
    "todo.updated": "할일 수정",
    "todo.completed": "할일 완료",
    "todo.reopened": "할일 미완료",
    "todo.deleted": "할일 삭제",
    "todo.comment.created": "의견 추가",
    "todo.comment.deleted": "의견 삭제",
  };

  return {
    label: labelMap[type],
    Icon: CalendarIcon,
    iconClass: type === "event.deleted" ? "bg-red-50 text-red-600" : "bg-[#fff6e8] text-[#9a5a14]",
  };
}

function formatActivityTime(value: unknown) {
  const date = toDate(value);
  if (!date) return "방금 전";

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: ko,
  });
}

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  if (isTimestampLike(value)) return value.toDate();
  return null;
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}
