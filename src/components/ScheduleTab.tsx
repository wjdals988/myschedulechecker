"use client";

import { addDays, format, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useEventsByDate } from "@/hooks/useEventsByDate";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { dateKey, parseDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ScheduleTab({ roomId, date }: { roomId: string; date: string }) {
  const selected = parseDateKey(date);
  const days = useMemo(() => {
    const start = startOfMonth(selected);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [selected]);
  const dayRefs = useRef(new Map<string, HTMLAnchorElement>());
  const { events, loading, error } = useEventsByDate(roomId, date);
  const rangeStart = dateKey(days[0] ?? selected);
  const rangeEnd = dateKey(days[days.length - 1] ?? selected);
  const { byDate } = useEventsInRange(roomId, rangeStart, rangeEnd);

  useEffect(() => {
    dayRefs.current.get(date)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [date]);

  return (
    <main className="flex min-h-[calc(100vh-136px)] flex-col">
      <section className="sticky top-[65px] z-10 border-b border-[#d8e3df] bg-[#f8faf9] px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const active = key === date;
            const hasMemo = (byDate[key] ?? []).some((event) => event.memo);

            return (
              <Link
                key={key}
                href={`/rooms/${roomId}/schedule?date=${key}`}
                ref={(node) => {
                  if (node) {
                    dayRefs.current.set(key, node);
                  } else {
                    dayRefs.current.delete(key);
                  }
                }}
                className={cn(
                  "relative grid h-16 min-w-14 place-items-center rounded border px-2 text-center transition",
                  active
                    ? "border-[#14211f] bg-[#14211f] text-white"
                    : "border-[#d8e3df] bg-white text-[#52645f] hover:border-[#159a86]",
                )}
              >
                <span className="text-xs font-semibold">{format(day, "EEE", { locale: ko })}</span>
                <span className="text-lg font-bold">{format(day, "d")}</span>
                {hasMemo ? (
                  <span
                    className={cn(
                      "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
                      active ? "bg-[#f6c177]" : "bg-[#df7a2f]",
                    )}
                    title="메모 있음"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex-1 px-4 py-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#159a86]">Schedule</p>
            <h1 className="text-2xl font-bold">{format(selected, "M월 d일 EEEE", { locale: ko })}</h1>
          </div>
          <Link
            href={`/rooms/${roomId}/calendar`}
            className="h-10 rounded border border-[#c9d7d2] bg-white px-3 py-2 text-sm font-semibold"
          >
            달력에서 추가
          </Link>
        </div>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="text-sm text-[#687a75]">일정을 동기화하는 중입니다.</p> : null}

        <div className="space-y-3">
          {!loading && events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#c9d7d2] bg-white p-6 text-center">
              <p className="font-semibold">이 날짜에는 일정이 없습니다.</p>
              <p className="mt-2 text-sm text-[#687a75]">달력 탭에서 날짜를 눌러 새 일정을 만들 수 있습니다.</p>
            </div>
          ) : null}

          {events.map((event) => (
            <Link
              key={event.id}
              href={`/rooms/${roomId}/schedule/${event.id}?date=${date}`}
              className="block rounded-lg border border-[#d8e3df] bg-white p-4 shadow-sm transition hover:border-[#159a86]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{event.title}</h2>
                  <p className="mt-1 text-sm text-[#687a75]">
                    {event.startTime ?? "시간 없음"} {event.endTime ? `- ${event.endTime}` : ""}
                  </p>
                </div>
                <span className="rounded bg-[#eefaf7] px-2 py-1 text-xs font-semibold text-[#146c61]">{event.authorLabel}</span>
              </div>
              {event.memo ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#52645f]">{event.memo}</p> : null}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
