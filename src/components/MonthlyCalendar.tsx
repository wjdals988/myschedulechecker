"use client";

import { addMonths, format, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AgendaListPanel } from "@/components/AgendaListPanel";
import { EventForm } from "@/components/EventForm";
import { PlusIcon } from "@/components/icons";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import {
  dateKey,
  dayLabel,
  getMonthGrid,
  isCurrentMonth,
  isToday,
  monthTitle,
  parseDateKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export function MonthlyCalendar({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = useMemo(() => getMonthGrid(month), [month]);
  const bounds = useMemo(
    () => ({
      start: dateKey(days[0] ?? month),
      end: dateKey(days[days.length - 1] ?? month),
    }),
    [days, month],
  );
  const { events: rangeEvents, byDate, loading, error } = useEventsInRange(roomId, bounds.start, bounds.end);
  const selectedEvents = selectedDate ? byDate[selectedDate] ?? [] : [];
  const monthEvents = useMemo(
    () => rangeEvents.filter((event) => isCurrentMonth(parseDateKey(event.date), month)),
    [rangeEvents, month],
  );

  return (
    <main className="px-4 py-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#159a86]">Calendar</p>
              <h1 className="text-2xl font-bold">{monthTitle(month)}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMonth(subMonths(month, 1))}
                className="h-10 rounded border border-[#c9d7d2] bg-white px-3 text-sm font-semibold"
              >
                이전
              </button>
              <button
                onClick={() => setMonth(new Date())}
                className="h-10 rounded border border-[#c9d7d2] bg-white px-3 text-sm font-semibold"
              >
                오늘
              </button>
              <button
                onClick={() => setMonth(addMonths(month, 1))}
                className="h-10 rounded border border-[#c9d7d2] bg-white px-3 text-sm font-semibold"
              >
                다음
              </button>
            </div>
          </div>

          {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-semibold text-[#687a75] sm:gap-1">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {days.map((day) => {
              const key = dateKey(day);
              const events = byDate[key] ?? [];
              const muted = !isCurrentMonth(day, month);
              const hasMemo = events.some((event) => event.memo);
              const selected = selectedDate === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  aria-label={`${format(day, "yyyy.MM.dd")} 일정 ${events.length}개`}
                  className={cn(
                    "h-[50px] min-h-0 overflow-hidden rounded-md border bg-white px-1 py-1 text-left shadow-sm transition hover:border-[#159a86] sm:aspect-auto sm:h-auto sm:min-h-24 sm:rounded sm:p-2",
                    muted && "bg-[#eef3f1] text-[#9aa8a4]",
                    isToday(day) && "border-[#159a86]",
                    selected && "ring-2 ring-[#159a86]",
                  )}
                >
                  <div className="flex h-full flex-col justify-between sm:h-auto sm:block">
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={cn(
                          "inline-grid h-6 w-6 place-items-center rounded text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm",
                          isToday(day) && "bg-[#159a86] text-white",
                        )}
                      >
                        {dayLabel(day)}
                      </span>
                      {hasMemo ? <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#df7a2f]" title="메모 있음" /> : null}
                    </div>
                    <div className="mt-auto flex min-h-2 items-end gap-0.5 sm:hidden">
                      {events.length > 0 ? (
                        <>
                          {events.slice(0, 3).map((event) => (
                            <span key={event.id} className="h-1.5 w-1.5 rounded-full bg-[#159a86]" />
                          ))}
                          {events.length > 3 ? <span className="text-[9px] font-bold leading-none text-[#146c61]">+</span> : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 hidden max-h-14 space-y-1 overflow-hidden sm:block">
                    {events.slice(0, 2).map((event) => (
                      <div key={event.id} className="rounded bg-[#eefaf7] px-2 py-1 text-xs font-semibold text-[#146c61]">
                        <div className="truncate">{event.title}</div>
                        {event.startTime ? <div className="mt-0.5 text-[10px] text-[#4f7f76]">{event.startTime}</div> : null}
                      </div>
                    ))}
                    {events.length > 2 ? <div className="text-xs font-semibold text-[#687a75]">+{events.length - 2}</div> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <AgendaListPanel
            roomId={roomId}
            title="이번 달 일정"
            events={monthEvents}
            loading={loading}
            grouped
            onDateSelect={setSelectedDate}
            showFutureToggle
            showTodoProgress
            className="border-t border-[#d8e3df] pt-4 lg:hidden"
          />

          {loading ? <p className="text-sm text-[#687a75]">월간 일정을 동기화하는 중입니다.</p> : null}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-[92px] max-h-[calc(100vh-120px)] overflow-y-auto border-l border-[#d8e3df] pl-5">
            <AgendaListPanel
              roomId={roomId}
              title="이번 달 일정"
              events={monthEvents}
              loading={loading}
              grouped
              onDateSelect={setSelectedDate}
              showFutureToggle
              showTodoProgress
            />
          </div>
        </aside>
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/45 p-0 sm:block sm:p-4">
          <div className="mx-auto max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white p-4 shadow-xl sm:mt-10 sm:rounded-lg sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#159a86]">{format(parseDateKey(selectedDate), "yyyy.MM.dd")}</p>
                <h2 className="text-xl font-bold">일정</h2>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="h-9 rounded border border-[#c9d7d2] px-3 text-sm font-semibold"
              >
                닫기
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="rounded border border-[#d8e3df] bg-[#f8faf9] p-3 text-sm text-[#687a75]">등록된 일정이 없습니다.</p>
              ) : (
                selectedEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => router.push(`/rooms/${roomId}/schedule/${event.id}?date=${selectedDate}`)}
                    className="block w-full rounded border border-[#d8e3df] p-3 text-left transition hover:border-[#159a86]"
                  >
                    <div className="font-semibold">{event.title}</div>
                    <div className="mt-1 text-sm text-[#687a75]">
                      {event.startTime ?? "시간 없음"} {event.endTime ? `- ${event.endTime}` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-6 border-t border-[#d8e3df] pt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#273f3a]">
                <PlusIcon />
                새 일정
              </div>
              <EventForm roomId={roomId} date={selectedDate} />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
