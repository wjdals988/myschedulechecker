"use client";

import { addMonths, format, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AgendaListPanel } from "@/components/AgendaListPanel";
import { EventForm } from "@/components/EventForm";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { LinkifiedText } from "@/components/LinkifiedText";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { dateKey, dayLabel, getMonthGrid, isCurrentMonth, isToday, monthTitle, parseDateKey } from "@/lib/dates";
import { getEventColorOption, normalizeEventTag } from "@/lib/eventAppearance";
import { deleteEventWithTodos } from "@/lib/eventMutations";
import { getKoreanHoliday, getKoreanHolidayMapForDates } from "@/lib/koreanHolidays";
import { cn } from "@/lib/utils";

export function MonthlyCalendar({ roomId, initialDate }: { roomId: string; initialDate?: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(() => (initialDate ? parseDateKey(initialDate) : new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventActionMessage, setEventActionMessage] = useState<string | null>(null);
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
  const selectedHoliday = selectedDate ? getKoreanHoliday(selectedDate) : undefined;
  const monthEvents = useMemo(
    () => rangeEvents.filter((event) => isCurrentMonth(parseDateKey(event.date), month)),
    [rangeEvents, month],
  );
  const holidayMap = useMemo(() => getKoreanHolidayMapForDates(days.map((day) => dateKey(day))), [days]);

  function openDateModal(nextDate: string) {
    setSelectedDate(nextDate);
    setEventActionMessage(null);
    setDeletingEventId(null);
  }

  function closeDateModal() {
    setSelectedDate(null);
    setEventActionMessage(null);
    setDeletingEventId(null);
  }

  async function handleDeleteEvent(eventId: string, title: string) {
    if (!window.confirm(`"${title}" 일정을 삭제할까요? 연결된 To-do도 함께 삭제됩니다.`)) {
      return;
    }

    setDeletingEventId(eventId);
    setEventActionMessage(null);

    try {
      await deleteEventWithTodos(roomId, eventId);
      setEventActionMessage(`"${title}" 일정을 삭제했습니다.`);
    } catch (caught) {
      setEventActionMessage(caught instanceof Error ? caught.message : "일정 삭제에 실패했습니다.");
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <main className="px-4 py-5 lg:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4 xl:space-y-5">
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

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-semibold text-[#687a75] sm:gap-1 lg:gap-1.5">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-1.5">
            {days.map((day) => {
              const key = dateKey(day);
              const events = byDate[key] ?? [];
              const muted = !isCurrentMonth(day, month);
              const hasMemo = events.some((event) => event.memo);
              const holiday = holidayMap[key];
              const selected = selectedDate === key;

              return (
                <button
                  key={key}
                  onClick={() => openDateModal(key)}
                  aria-label={`${format(day, "yyyy.MM.dd")} 일정 ${events.length}개`}
                  className={cn(
                    "h-[50px] min-h-0 overflow-hidden rounded-md border bg-white px-1 py-1 text-left shadow-sm transition hover:border-[#159a86] sm:aspect-auto sm:h-auto sm:min-h-[6.25rem] sm:rounded sm:px-2 sm:pb-2 sm:pt-1.5 lg:min-h-[8.5rem] lg:px-3 lg:pb-3 lg:pt-1.5 xl:min-h-[9.25rem]",
                    muted && "bg-[#eef3f1] text-[#9aa8a4]",
                    isToday(day) && "border-[#159a86]",
                    selected && "ring-2 ring-[#159a86]",
                  )}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 items-start justify-between gap-1 lg:gap-2">
                      <span
                        className={cn(
                          "inline-grid h-6 w-6 place-items-center rounded text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm lg:h-8 lg:w-8 lg:text-[0.95rem]",
                          holiday && !isToday(day) && "text-[#d95b43]",
                          isToday(day) && "bg-[#159a86] text-white",
                        )}
                      >
                        {dayLabel(day)}
                      </span>
                      {hasMemo ? <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#df7a2f]" title="메모 있음" /> : null}
                    </div>

                    {holiday ? (
                      <div
                        className={cn(
                          "mt-1 hidden truncate text-[11px] font-bold leading-4 sm:block lg:text-xs",
                          muted ? "text-[#d38a7f]" : "text-[#d95b43]",
                        )}
                        title={holiday.name}
                      >
                        {holiday.name}
                      </div>
                    ) : null}

                    <div className="mt-auto flex min-h-2 items-end gap-0.5 sm:hidden">
                      {events.length > 0 ? (
                        <>
                          {events.slice(0, 3).map((event) => {
                            const tone = getEventColorOption(event.color);
                            return <span key={event.id} className={cn("h-1.5 w-1.5 rounded-full", tone.dotClass)} />;
                          })}
                          {events.length > 3 ? <span className="text-[9px] font-bold leading-none text-[#146c61]">+</span> : null}
                        </>
                      ) : null}
                    </div>

                    <div className="mt-2 hidden min-h-0 flex-1 space-y-1 overflow-hidden sm:block lg:mt-3 lg:max-h-[5.75rem]">
                      {events.slice(0, 2).map((event) => {
                        const tone = getEventColorOption(event.color);

                        return (
                          <div key={event.id} className={cn("rounded border px-2 py-1 text-xs font-semibold", tone.badgeClass)}>
                            <div className="flex items-center gap-1">
                              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dotClass)} />
                              {normalizeEventTag(event.tag) ? (
                                <span className="truncate text-[10px] font-bold">{normalizeEventTag(event.tag)}</span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 truncate">{event.title}</div>
                            {event.startTime ? <div className="mt-0.5 text-[10px] opacity-80">{event.startTime}</div> : null}
                          </div>
                        );
                      })}
                      {events.length > 2 ? <div className="text-xs font-semibold text-[#687a75]">+{events.length - 2}</div> : null}
                    </div>
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
              onDateSelect={openDateModal}
              showFutureToggle
              showTodoProgress
              className="border-t border-[#d8e3df] pt-4 lg:hidden"
          />

          {loading ? <p className="text-sm text-[#687a75]">월간 일정 데이터를 불러오는 중입니다.</p> : null}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-[92px] max-h-[calc(100vh-120px)] overflow-y-auto border-l border-[#d8e3df] pl-5">
            <AgendaListPanel
              roomId={roomId}
              title="이번 달 일정"
              events={monthEvents}
              loading={loading}
              grouped
              onDateSelect={openDateModal}
              showFutureToggle
              showTodoProgress
            />
          </div>
        </aside>
      </div>

      {selectedDate ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/45 p-0 sm:block sm:p-4"
          onClick={closeDateModal}
          role="presentation"
        >
          <div
            className="mx-auto max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white p-4 shadow-xl sm:mt-10 sm:rounded-lg sm:p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedDate} 일정`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#159a86]">{format(parseDateKey(selectedDate), "yyyy.MM.dd")}</p>
                <h2 className="text-xl font-bold">일정</h2>
                {selectedHoliday ? <p className="mt-1 text-sm font-semibold text-[#d95b43]">{selectedHoliday.name}</p> : null}
              </div>
              <button
                onClick={closeDateModal}
                className="h-9 rounded border border-[#c9d7d2] px-3 text-sm font-semibold"
              >
                닫기
              </button>
            </div>

            {eventActionMessage ? (
              <p className="mt-4 rounded-md border border-[#d8e3df] bg-[#f8faf9] px-3 py-2 text-sm font-semibold text-[#52645f]">
                {eventActionMessage}
              </p>
            ) : null}

            <div className="mt-5 space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="rounded border border-[#d8e3df] bg-[#f8faf9] p-3 text-sm text-[#687a75]">등록된 일정이 없습니다.</p>
              ) : (
                selectedEvents.map((event) => {
                  const tone = getEventColorOption(event.color);
                  const normalizedTag = normalizeEventTag(event.tag);

                  return (
                    <div key={event.id} className={cn("rounded border p-3", tone.badgeClass)}>
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => router.push(`/rooms/${roomId}/schedule/${event.id}?date=${selectedDate}`)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", tone.dotClass)} />
                            {normalizedTag ? (
                              <span className="truncate rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-bold">
                                {normalizedTag}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 font-semibold">{event.title}</div>
                          <div className="mt-1 text-sm opacity-80">
                            {event.startTime ?? "시간 없음"} {event.endTime ? `- ${event.endTime}` : ""}
                          </div>
                          {event.location ? <div className="mt-1 truncate text-sm opacity-80">장소 {event.location}</div> : null}
                          <div className="mt-1 text-[11px] font-semibold opacity-70">작성 {event.authorLabel}</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          disabled={deletingEventId === event.id}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          {deletingEventId === event.id ? "삭제 중" : "삭제"}
                        </button>
                      </div>
                      {event.memo ? <LinkifiedText text={event.memo} className="mt-2 line-clamp-2 block text-sm opacity-80" /> : null}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 border-t border-[#d8e3df] pt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#273f3a]">
                <PlusIcon />
                일정 추가
              </div>
              <EventForm roomId={roomId} date={selectedDate} />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
