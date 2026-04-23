"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { dayLabel, parseDateKey, weekdayLabel } from "@/lib/dates";
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
}: AgendaListPanelProps) {
  const groups = useMemo(() => {
    const groupedEvents = events.reduce<Record<string, EventItem[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});

    return Object.entries(groupedEvents).map(([date, groupEvents]) => ({
      date,
      events: groupEvents,
    }));
  }, [events]);

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#14211f]">{title}</h2>
        <span className="text-xs font-semibold text-[#687a75]">{loading ? "동기화 중" : `${events.length}개`}</span>
      </div>

      {loading ? (
        <p className="rounded-md border border-[#d8e3df] bg-white p-4 text-sm text-[#687a75]">
          일정을 불러오는 중입니다.
        </p>
      ) : events.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#c9d7d2] bg-white p-4 text-sm text-[#687a75]">
          {emptyMessage}
        </p>
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
                    <AgendaEventLink key={event.id} roomId={roomId} event={event} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <AgendaEventLink key={event.id} roomId={roomId} event={event} />
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

function AgendaEventLink({ roomId, event }: { roomId: string; event: EventItem }) {
  return (
    <Link
      href={`/rooms/${roomId}/schedule/${event.id}?date=${event.date}`}
      className="block w-full rounded-md border border-[#d8e3df] bg-white p-3 text-left shadow-sm transition hover:border-[#159a86]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#14211f]">{event.title}</div>
          <div className="mt-1 text-xs font-semibold text-[#687a75]">
            {event.startTime ?? "시간 없음"} {event.endTime ? `- ${event.endTime}` : ""}
          </div>
        </div>
        {event.memo ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#df7a2f]" title="메모 있음" /> : null}
      </div>
      {event.memo ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#52645f]">{event.memo}</p> : null}
    </Link>
  );
}
