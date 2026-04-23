"use client";

import { addMonths, format, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import {
  dateKey,
  dayLabel,
  getMonthBounds,
  getMonthGrid,
  isCurrentMonth,
  isToday,
  monthTitle,
  parseDateKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EventForm } from "@/components/EventForm";
import { PlusIcon } from "@/components/icons";

export function MonthlyCalendar({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const bounds = useMemo(() => getMonthBounds(month), [month]);
  const days = useMemo(() => getMonthGrid(month), [month]);
  const { byDate, loading, error } = useEventsInRange(roomId, bounds.start, bounds.end);
  const selectedEvents = selectedDate ? byDate[selectedDate] ?? [] : [];

  return (
    <main className="px-4 py-5">
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

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#687a75]">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
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
                className={cn(
                  "aspect-square min-h-0 rounded border bg-white p-1 text-left shadow-sm transition hover:border-[#159a86] sm:aspect-auto sm:min-h-24 sm:p-2",
                  muted && "bg-[#eef3f1] text-[#9aa8a4]",
                  isToday(day) && "border-[#159a86]",
                  selected && "ring-2 ring-[#159a86]",
                )}
              >
                <div className="flex h-full flex-col justify-between sm:block">
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
                  <div className="mt-1 flex items-center gap-1 sm:hidden">
                    {events.length > 0 ? (
                      <span className="rounded bg-[#eefaf7] px-1.5 py-0.5 text-[10px] font-semibold text-[#146c61]">
                        {events.length}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 hidden space-y-1 sm:block">
                  {events.slice(0, 2).map((event) => (
                    <div key={event.id} className="truncate rounded bg-[#eefaf7] px-2 py-1 text-xs text-[#146c61]">
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 ? (
                    <div className="text-xs font-semibold text-[#687a75]">+{events.length - 2}</div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {loading ? <p className="text-sm text-[#687a75]">월간 일정을 동기화하는 중입니다.</p> : null}
      </section>

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
