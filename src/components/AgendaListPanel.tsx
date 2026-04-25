"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { LinkifiedText } from "@/components/LinkifiedText";
import { useTodoProgressMap } from "@/hooks/useTodoProgressMap";
import { dayLabel, parseDateKey, todayKey, weekdayLabel } from "@/lib/dates";
import { getEventColorOption, normalizeEventTag } from "@/lib/eventAppearance";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type AgendaListPanelProps = {
  roomId: string;
  events: EventItem[];
  title: string;
  loading?: boolean;
  grouped?: boolean;
  emptyMessage?: string;
  className?: string;
  onDateSelect?: (date: string) => void;
  showFutureToggle?: boolean;
  showTodoProgress?: boolean;
};

export function AgendaListPanel({
  roomId,
  events,
  title,
  loading = false,
  grouped = false,
  emptyMessage = "등록된 일정이 없습니다.",
  className,
  onDateSelect,
  showFutureToggle = false,
  showTodoProgress = false,
}: AgendaListPanelProps) {
  const [futureOnly, setFutureOnly] = useState(true);
  const today = todayKey();
  const filteredEvents = showFutureToggle && futureOnly ? events.filter((event) => event.date >= today) : events;
  const effectiveEmptyMessage =
    showFutureToggle && futureOnly && events.length > 0
      ? "오늘 이후 일정이 없습니다. 전체를 눌러 지난 일정을 확인하세요."
      : emptyMessage;
  const todoProgress = useTodoProgressMap(roomId, showTodoProgress ? filteredEvents.map((event) => event.id) : []);
  const groupedEvents = filteredEvents.reduce<Record<string, EventItem[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event];
    return acc;
  }, {});
  const groups = Object.entries(groupedEvents).map(([date, groupEvents]) => ({
    date,
    events: groupEvents,
  }));

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#14211f]">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-[#687a75]">{loading ? "불러오는 중" : `${filteredEvents.length}개`}</p>
        </div>

        {showFutureToggle ? (
          <div className="flex rounded-md border border-[#c9d7d2] bg-white p-0.5">
            <button
              onClick={() => setFutureOnly(true)}
              className={cn(
                "h-8 rounded px-2.5 text-xs font-semibold transition",
                futureOnly
                  ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                  : "text-[#52645f]",
              )}
            >
              오늘 이후
            </button>
            <button
              onClick={() => setFutureOnly(false)}
              className={cn(
                "h-8 rounded px-2.5 text-xs font-semibold transition",
                !futureOnly
                  ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                  : "text-[#52645f]",
              )}
            >
              전체
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="rounded-md border border-[#d8e3df] bg-white p-4 text-sm text-[#687a75]">일정을 불러오는 중입니다.</p>
      ) : filteredEvents.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#c9d7d2] bg-white p-4 text-sm text-[#687a75]">{effectiveEmptyMessage}</p>
      ) : grouped ? (
        <div className="divide-y divide-[#d8e3df]">
          {groups.map((group) => {
            const groupDate = parseDateKey(group.date);

            return (
              <div key={group.date} className="grid grid-cols-[3.25rem_1fr] gap-3 py-3">
                {onDateSelect ? (
                  <button
                    onClick={() => onDateSelect(group.date)}
                    className="rounded-md py-1 text-left transition hover:text-[#159a86]"
                    aria-label={`${format(groupDate, "yyyy.MM.dd")} 일정 보기`}
                  >
                    <DateBadge date={groupDate} />
                  </button>
                ) : (
                  <div className="py-1">
                    <DateBadge date={groupDate} />
                  </div>
                )}

                <div className="space-y-2">
                  {group.events.map((event) => (
                    <AgendaEventLink
                      key={event.id}
                      roomId={roomId}
                      event={event}
                      progress={showTodoProgress ? todoProgress[event.id] : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <AgendaEventLink
              key={event.id}
              roomId={roomId}
              event={event}
              progress={showTodoProgress ? todoProgress[event.id] : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DateBadge({ date }: { date: Date }) {
  return (
    <>
      <div className="text-xl font-bold leading-none">{dayLabel(date)}</div>
      <div className="mt-1 text-xs font-semibold text-[#687a75]">{weekdayLabel(date)}</div>
    </>
  );
}

function AgendaEventLink({
  roomId,
  event,
  progress,
}: {
  roomId: string;
  event: EventItem;
  progress?: { total: number; done: number };
}) {
  const percent = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const tone = getEventColorOption(event.color);
  const tag = normalizeEventTag(event.tag);

  return (
    <div
      className={cn(
        "block w-full rounded-md border border-[#d8e3df] border-l-4 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#159a86] hover:shadow-md",
        tone.accentClass,
      )}
    >
      <Link href={`/rooms/${roomId}/schedule/${event.id}?date=${event.date}`} className="block">
        <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {tag ? <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", tone.badgeClass)}>{tag}</span> : null}
            <div className="truncate font-semibold text-[#14211f]">{event.title}</div>
          </div>
          <div className="mt-1 text-xs font-semibold text-[#687a75]">
            {event.startTime ?? "시간 없음"} {event.endTime ? `- ${event.endTime}` : ""}
          </div>
          {event.location ? <div className="mt-1 truncate text-xs font-semibold text-[#687a75]">장소 {event.location}</div> : null}
          <div className="mt-1 text-[11px] font-semibold text-[#687a75]">작성 {event.authorLabel}</div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dotClass)} />
          {event.memo ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#df7a2f]" title="메모 있음" /> : null}
        </div>
        </div>
      </Link>
      {event.memo ? <LinkifiedText text={event.memo} className="mt-2 line-clamp-2 block text-sm leading-5 text-[#52645f]" /> : null}
      {progress && progress.total > 0 ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[#687a75]">
            <span>To-do</span>
            <span>
              {progress.done}/{progress.total} 완료
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e4ece9]">
            <div className="h-full rounded-full bg-[#159a86]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
