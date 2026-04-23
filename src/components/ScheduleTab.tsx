"use client";

import { addDays, format, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgendaListPanel } from "@/components/AgendaListPanel";
import { CalendarIcon, ListIcon } from "@/components/icons";
import { useEventsByDate } from "@/hooks/useEventsByDate";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { dateKey, parseDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ScheduleTab({ roomId, date }: { roomId: string; date: string }) {
  const selected = parseDateKey(date);
  const [sheetOpen, setSheetOpen] = useState(false);
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#159a86]">Schedule</p>
                <h1 className="text-2xl font-bold">{format(selected, "M월 d일 EEEE", { locale: ko })}</h1>
              </div>
              <Link
                href={`/rooms/${roomId}/calendar`}
                className="inline-flex h-10 items-center gap-2 rounded border border-[#c9d7d2] bg-white px-3 py-2 text-sm font-semibold"
              >
                <CalendarIcon className="h-4 w-4" />
                달력
              </Link>
            </div>

            {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            <div className="rounded-md border border-[#d8e3df] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#687a75]">선택일 일정</p>
                  <p className="mt-1 text-2xl font-bold text-[#14211f]">{loading ? "-" : events.length}</p>
                </div>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#14211f] px-4 text-sm font-semibold text-white lg:hidden"
                >
                  <ListIcon className="h-4 w-4" />
                  일정 리스트 보기
                </button>
              </div>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[154px] max-h-[calc(100vh-180px)] overflow-y-auto border-l border-[#d8e3df] pl-5">
              <AgendaListPanel
                roomId={roomId}
                title="선택일 일정"
                events={events}
                loading={loading}
                emptyMessage="선택한 날짜에는 일정이 없습니다."
              />
            </div>
          </aside>
        </div>
      </section>

      {sheetOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/45 lg:hidden">
          <div className="max-h-[78vh] w-full overflow-y-auto rounded-t-lg bg-[#f8faf9] p-4 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#159a86]">{format(selected, "yyyy.MM.dd")}</p>
                <h2 className="text-xl font-bold">일정 리스트</h2>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="h-9 rounded border border-[#c9d7d2] bg-white px-3 text-sm font-semibold"
              >
                닫기
              </button>
            </div>

            <AgendaListPanel
              roomId={roomId}
              title="선택일 일정"
              events={events}
              loading={loading}
              emptyMessage="선택한 날짜에는 일정이 없습니다."
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
