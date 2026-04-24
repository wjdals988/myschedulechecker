"use client";

import { addDays, addMonths, format, startOfMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AgendaListPanel } from "@/components/AgendaListPanel";
import { EventForm } from "@/components/EventForm";
import { CalendarIcon, PlusIcon } from "@/components/icons";
import { useEventsByDate } from "@/hooks/useEventsByDate";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { dateKey, isCurrentMonth, parseDateKey, todayKey } from "@/lib/dates";
import { getKoreanHoliday, getKoreanHolidayMapForDates } from "@/lib/koreanHolidays";
import { cn } from "@/lib/utils";

export function ScheduleTab({ roomId, date }: { roomId: string; date: string }) {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const selected = parseDateKey(date);
  const selectedMonth = startOfMonth(selected);
  const previousMonthDate = dateKey(subMonths(selectedMonth, 1));
  const nextMonthDate = dateKey(addMonths(selectedMonth, 1));
  const days = Array.from({ length: 42 }, (_, index) => addDays(selectedMonth, index));
  const dayRefs = useRef(new Map<string, HTMLAnchorElement>());
  const { events: selectedDateEvents, loading: selectedDateLoading, error } = useEventsByDate(roomId, date);
  const rangeStart = dateKey(days[0] ?? selected);
  const rangeEnd = dateKey(days[days.length - 1] ?? selected);
  const { events: rangeEvents, byDate, loading: monthLoading } = useEventsInRange(roomId, rangeStart, rangeEnd);
  const monthEvents = rangeEvents.filter((event) => isCurrentMonth(parseDateKey(event.date), selectedMonth));
  const holidayMap = getKoreanHolidayMapForDates(
    Array.from({ length: 42 }, (_, index) => format(addDays(selectedMonth, index), "yyyy-MM-dd")),
  );
  const selectedHoliday = getKoreanHoliday(date);

  useEffect(() => {
    dayRefs.current.get(date)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [date]);

  return (
    <main className="flex min-h-[calc(100vh-148px)] flex-col">
      <section className="sticky top-[72px] z-10 border-b border-[var(--border)] bg-[var(--background)] px-4 py-4 backdrop-blur lg:px-6 lg:py-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="app-kicker text-[0.72rem] font-bold">Month</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)] sm:text-[1.5rem]">
              {format(selectedMonth, "yyyy년 M월", { locale: ko })}
            </h2>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/rooms/${roomId}/schedule?date=${previousMonthDate}`}
              className="app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
            >
              이전달
            </Link>
            <Link
              href={`/rooms/${roomId}/schedule?date=${todayKey()}`}
              className="app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
            >
              오늘
            </Link>
            <Link
              href={`/rooms/${roomId}/schedule?date=${nextMonthDate}`}
              className="app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
            >
              다음달
            </Link>
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 lg:gap-4">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const active = key === date;
            const hasMemo = (byDate[key] ?? []).some((event) => event.memo);
            const holiday = holidayMap[key];

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
                  "relative grid h-[5.4rem] min-w-[5rem] snap-center place-items-center rounded-lg border px-3.5 text-center shadow-[var(--shadow-soft)] transition sm:min-w-[5.75rem] lg:h-[6rem] lg:min-w-[6.25rem] xl:min-w-[6.6rem]",
                  active
                    ? "border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]",
                )}
              >
                <span className={cn("text-[0.74rem] font-semibold", holiday && !active && "text-[#d95b43]")}>
                  {format(day, "EEE", { locale: ko })}
                </span>
                <span className={cn("text-[1.55rem] font-bold leading-none lg:text-[1.7rem]", holiday && !active && "text-[#d95b43]")}>
                  {format(day, "d")}
                </span>
                {hasMemo ? (
                  <span
                    className={cn(
                      "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
                      active ? "bg-[#f6c177]" : "bg-[#df7a2f]",
                    )}
                    title="메모 있음"
                  />
                ) : null}
                {holiday ? (
                  <span
                    className={cn(
                      "absolute left-2 top-2 h-1.5 w-1.5 rounded-full",
                      active ? "bg-[#ffd1c8]" : "bg-[#d95b43]",
                    )}
                    title={holiday.name}
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#159a86]">Schedule</p>
                <h1 className="whitespace-nowrap text-2xl font-bold">{format(selected, "M월 d일 EEEE", { locale: ko })}</h1>
                {selectedHoliday ? <p className="mt-1 text-sm font-semibold text-[#d95b43]">{selectedHoliday.name}</p> : null}
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                <button
                  onClick={() => setQuickAddOpen((open) => !open)}
                  className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#14211f] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223632]"
                >
                  <PlusIcon className="h-4 w-4" />
                  빠른 추가
                </button>
                <Link
                  href={`/rooms/${roomId}/calendar`}
                  className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#c9d7d2] bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:border-[#159a86]"
                >
                  <CalendarIcon className="h-4 w-4" />
                  달력
                </Link>
              </div>
            </div>

            {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            <div className="rounded-md border border-[#d8e3df] bg-white p-4 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#687a75]">선택일 일정</p>
                  <p className="mt-1 text-2xl font-bold text-[#14211f]">
                    {selectedDateLoading ? "-" : selectedDateEvents.length}
                  </p>
                </div>
                <p className="text-right text-xs font-semibold text-[#687a75]">이 날짜에 바로 추가할 수 있습니다.</p>
              </div>
            </div>

            {quickAddOpen ? (
              <section className="rounded-md border border-[#d8e3df] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#159a86]">Quick Add</p>
                    <h2 className="font-bold text-[#14211f]">선택한 날짜에 일정 추가</h2>
                  </div>
                  <button
                    onClick={() => setQuickAddOpen(false)}
                    className="h-8 rounded border border-[#c9d7d2] px-2.5 text-xs font-semibold"
                  >
                    닫기
                  </button>
                </div>
                <EventForm roomId={roomId} date={date} onCreated={() => setQuickAddOpen(false)} />
              </section>
            ) : null}

            <AgendaListPanel
              roomId={roomId}
              title="이번 달 일정"
              events={monthEvents}
              loading={monthLoading}
              grouped
              emptyMessage="이번 달에는 일정이 없습니다."
              onDateSelect={(nextDate) => router.push(`/rooms/${roomId}/schedule?date=${nextDate}`)}
              showFutureToggle
              showTodoProgress
              className="lg:hidden"
            />
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-[224px] max-h-[calc(100vh-248px)] overflow-y-auto border-l border-[#d8e3df] pl-6">
              <AgendaListPanel
                roomId={roomId}
                title="이번 달 일정"
                events={monthEvents}
                loading={monthLoading}
                grouped
                emptyMessage="이번 달에는 일정이 없습니다."
                onDateSelect={(nextDate) => router.push(`/rooms/${roomId}/schedule?date=${nextDate}`)}
                showFutureToggle
                showTodoProgress
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
