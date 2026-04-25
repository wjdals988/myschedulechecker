"use client";

import { addDays, addMonths, format, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgendaListPanel } from "@/components/AgendaListPanel";
import { EventForm } from "@/components/EventForm";
import { CalendarIcon, CheckListIcon, PlusIcon } from "@/components/icons";
import { LinkifiedText } from "@/components/LinkifiedText";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { useEventsByDate } from "@/hooks/useEventsByDate";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { useTodosForEvents } from "@/hooks/useTodosForEvents";
import { dateKey, isCurrentMonth, parseDateKey, todayKey } from "@/lib/dates";
import { getEventColorOption, normalizeEventTag } from "@/lib/eventAppearance";
import { getDb } from "@/lib/firebase";
import { getKoreanHoliday, getKoreanHolidayMapForDates } from "@/lib/koreanHolidays";
import { profileDisplayName } from "@/lib/profile";
import type { EventItem, TodoWithEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScheduleTab({ roomId, date }: { roomId: string; date: string }) {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(parseDateKey(date)));
  const selected = parseDateKey(date);
  const selectedMonth = startOfMonth(selected);
  const days = Array.from({ length: 42 }, (_, index) => addDays(selectedMonth, index));
  const pickerDays = Array.from(
    { length: 42 },
    (_, index) => addDays(startOfWeek(pickerMonth, { weekStartsOn: 0 }), index),
  );
  const dayRefs = useRef(new Map<string, HTMLAnchorElement>());
  const { events: selectedDateEvents, loading: selectedDateLoading, error } = useEventsByDate(roomId, date);
  const {
    todos: selectedDateTodos,
    loading: selectedDateTodosLoading,
    error: selectedDateTodosError,
  } = useTodosForEvents(roomId, selectedDateEvents);
  const selectedTodosByEvent = useMemo(() => {
    return selectedDateTodos.reduce<Record<string, TodoWithEvent[]>>((acc, todo) => {
      acc[todo.eventId] = [...(acc[todo.eventId] ?? []), todo];
      return acc;
    }, {});
  }, [selectedDateTodos]);
  const rangeStart = dateKey(days[0] ?? selected);
  const rangeEnd = dateKey(days[days.length - 1] ?? selected);
  const { events: rangeEvents, byDate: stripByDate, loading: monthLoading } = useEventsInRange(roomId, rangeStart, rangeEnd);
  const pickerRangeStart = dateKey(pickerDays[0] ?? pickerMonth);
  const pickerRangeEnd = dateKey(pickerDays[pickerDays.length - 1] ?? pickerMonth);
  const { byDate: pickerByDate, loading: pickerLoading } = useEventsInRange(roomId, pickerRangeStart, pickerRangeEnd);
  const pickerMarkerByDate = useMemo(
    () => ({
      ...stripByDate,
      ...pickerByDate,
    }),
    [pickerByDate, stripByDate],
  );
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

  useEffect(() => {
    if (!monthPickerOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMonthPickerOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [monthPickerOpen]);

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

          <div className="relative">
            {monthPickerOpen ? (
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="날짜 선택 닫기"
                onClick={() => setMonthPickerOpen(false)}
              />
            ) : null}
            <button
              type="button"
              onClick={() => {
                setPickerMonth(selectedMonth);
                setMonthPickerOpen((open) => !open);
              }}
              className="app-button-secondary relative z-20 inline-flex h-10 w-10 items-center justify-center shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
              title="날짜 선택"
              aria-haspopup="dialog"
              aria-expanded={monthPickerOpen}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>

            {monthPickerOpen ? (
              <ScheduleMonthPicker
                pickerMonth={pickerMonth}
                selectedDate={date}
                days={pickerDays}
                byDate={pickerMarkerByDate}
                loading={pickerLoading}
                onPreviousMonth={() => setPickerMonth((month) => subMonths(month, 1))}
                onNextMonth={() => setPickerMonth((month) => addMonths(month, 1))}
                onToday={() => {
                  setMonthPickerOpen(false);
                  router.push(`/rooms/${roomId}/schedule?date=${todayKey()}`);
                }}
                onSelectDate={(nextDate) => {
                  setMonthPickerOpen(false);
                  router.push(`/rooms/${roomId}/schedule?date=${nextDate}`);
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 touch-pan-x [-webkit-overflow-scrolling:touch] lg:gap-2.5">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const active = key === date;
            const eventsForDay = stripByDate[key] ?? [];
            const hasEvents = eventsForDay.length > 0;
            const hasMemo = eventsForDay.some((event) => event.memo);
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
                  "relative grid h-[4.65rem] w-[4.35rem] flex-none snap-center place-items-center rounded-lg border px-2.5 text-center shadow-[var(--shadow-soft)] transition sm:w-[4.85rem] lg:h-[5rem] lg:w-[5.25rem] xl:w-[5.5rem]",
                  active
                    ? "border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]",
                )}
              >
                <span className={cn("text-[0.7rem] font-semibold", holiday && !active && "text-[#d95b43]")}>
                  {format(day, "EEE", { locale: ko })}
                </span>
                <span className={cn("text-[1.35rem] font-bold leading-none lg:text-[1.48rem]", holiday && !active && "text-[#d95b43]")}>
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
                {hasEvents ? (
                  <span
                    className={cn(
                      "absolute right-4 top-2 h-1.5 w-1.5 rounded-full",
                      "bg-[#d95b43]",
                    )}
                    title="일정 있음"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <span className="text-[#d95b43]">빨간 날짜</span>
            공휴일
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d95b43]" />
            일정 있음
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#df7a2f]" />
            메모 있음
          </span>
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
                  className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#14211f] px-3 py-2 text-sm font-semibold !text-white shadow-sm transition hover:bg-[#223632]"
                >
                  <PlusIcon className="h-4 w-4" />
                  빠른 추가
                </button>
                <Link
                  href={`/rooms/${roomId}/calendar?date=${date}`}
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

            {!selectedDateLoading && selectedDateEvents.length > 0 ? (
              <SelectedDateEventList
                roomId={roomId}
                date={date}
                events={selectedDateEvents}
                todosByEvent={selectedTodosByEvent}
                todosLoading={selectedDateTodosLoading}
                todosError={selectedDateTodosError}
              />
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

function SelectedDateEventList({
  roomId,
  date,
  events,
  todosByEvent,
  todosLoading,
  todosError,
}: {
  roomId: string;
  date: string;
  events: EventItem[];
  todosByEvent: Record<string, TodoWithEvent[]>;
  todosLoading: boolean;
  todosError: string | null;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">선택일 일정</h2>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{events.length}개</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/rooms/${roomId}/todos?date=${date}&range=week`}
            className="app-button-secondary inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-xs font-semibold hover:border-[var(--accent)]"
          >
            <CheckListIcon className="h-4 w-4" />
            할일 탭
          </Link>
          {todosLoading ? <span className="text-xs font-semibold text-[var(--muted)]">To-do 불러오는 중</span> : null}
        </div>
      </div>

      {todosError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {todosError}
        </p>
      ) : null}

      <div className="mt-3 space-y-3">
        {events.map((event) => {
          const tone = getEventColorOption(event.color);
          const tag = normalizeEventTag(event.tag);
          const todos = todosByEvent[event.id] ?? [];
          const doneCount = todos.filter((todo) => todo.done).length;

          return (
            <article
              key={event.id}
              className={cn(
                "rounded-md border border-[var(--border)] border-l-4 bg-[var(--surface)] p-3 shadow-sm",
                tone.accentClass,
              )}
            >
              <Link href={`/rooms/${roomId}/schedule/${event.id}?date=${date}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {tag ? (
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", tone.badgeClass)}>
                          {tag}
                        </span>
                      ) : null}
                      <h3 className="truncate font-semibold text-[var(--foreground)]">{event.title}</h3>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                      {event.startTime ?? "종일"} {event.endTime ? `- ${event.endTime}` : ""}
                    </p>
                    {event.location ? <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">장소 {event.location}</p> : null}
                    <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">작성 {event.authorLabel}</p>
                  </div>
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", tone.dotClass)} />
                </div>
              </Link>
              {event.memo ? <LinkifiedText text={event.memo} className="mt-2 line-clamp-2 block text-sm leading-5 text-[var(--muted)]" /> : null}

              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--muted)]">
                  <span>To-do 리스트</span>
                  {todos.length > 0 ? (
                    <span>
                      {doneCount}/{todos.length} 완료
                    </span>
                  ) : null}
                </div>

                {todos.length > 0 ? (
                  <ul className="space-y-1.5">
                    {todos.map((todo) => (
                      <li key={todo.id} className="flex items-start gap-2 rounded-md bg-[var(--surface-muted)] px-2.5 py-2">
                        <input
                          type="checkbox"
                          checked={todo.done}
                          onChange={(change) =>
                            updateDoc(doc(getDb(), "rooms", roomId, "events", todo.eventId, "todos", todo.id), {
                              done: change.target.checked,
                              updatedAt: serverTimestamp(),
                            })
                          }
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                          aria-label={`${todo.text} 완료 상태 변경`}
                        />
                        <span className="min-w-0 flex-1">
                          <LinkifiedText
                            text={todo.text}
                            className={cn(
                              "block text-sm leading-5 text-[var(--foreground)]",
                              todo.done && "line-through opacity-60",
                            )}
                          />
                          <span className="mt-1 block text-[11px] font-semibold text-[var(--muted)]">
                            작성 {todo.authorLabel}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : todosLoading ? (
                  <p className="rounded-md bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted)]">
                    To-do를 불러오는 중입니다.
                  </p>
                ) : (
                  <p className="rounded-md bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted)]">
                    연결된 할일이 없습니다.
                  </p>
                )}
                <InlineTodoAdd roomId={roomId} eventId={event.id} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InlineTodoAdd({ roomId, eventId }: { roomId: string; eventId: string }) {
  const session = useAnonymousSession();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const author =
    session.uid && session.profile
      ? {
          uid: session.uid,
          label: profileDisplayName(session.profile),
        }
      : null;

  async function addTodo() {
    const trimmed = text.trim();
    if (!trimmed || !author || saving) return;

    setSaving(true);
    setMessage(null);

    try {
      await addDoc(collection(getDb(), "rooms", roomId, "events", eventId, "todos"), {
        text: trimmed,
        done: false,
        order: Date.now(),
        authorUid: author.uid,
        authorLabel: author.label,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setText("");
      setMessage("할일을 추가했습니다.");
      window.setTimeout(() => setMessage(null), 1600);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "할일 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-2 sm:flex-row">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") addTodo();
        }}
        placeholder="이 일정에 할일 추가"
        className="app-input h-9 min-w-0 flex-1 px-3 text-sm"
      />
      <button
        type="button"
        onClick={addTodo}
        disabled={!text.trim() || !author || saving}
        className="app-button-primary inline-flex h-9 shrink-0 items-center justify-center gap-1.5 px-3 text-xs font-semibold disabled:opacity-45"
      >
        <PlusIcon className="h-4 w-4" />
        {saving ? "추가 중" : "할일 추가"}
      </button>
      {message ? <p className="text-xs font-semibold text-[var(--muted)] sm:self-center">{message}</p> : null}
    </div>
  );
}

function ScheduleMonthPicker({
  pickerMonth,
  selectedDate,
  days,
  byDate,
  loading,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: {
  pickerMonth: Date;
  selectedDate: string;
  days: Date[];
  byDate: Record<string, EventItem[]>;
  loading: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (date: string) => void;
}) {
  const today = todayKey();
  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div
      className="absolute right-0 top-12 z-20 w-[calc(100vw-2rem)] max-w-[21rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]"
      role="dialog"
      aria-label="작은 달력"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="app-button-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center text-xl font-bold leading-none hover:border-[var(--accent)]"
          aria-label="이전달"
          title="이전달"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-[var(--foreground)]">
            {format(pickerMonth, "yyyy년 M월", { locale: ko })}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
            일정 있는 날은 빨간 점으로 표시됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="app-button-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center text-xl font-bold leading-none hover:border-[var(--accent)]"
          aria-label="다음달"
          title="다음달"
        >
          ›
        </button>
      </div>

      <button
        type="button"
        onClick={onToday}
        className="app-button-primary mt-3 inline-flex h-9 w-full items-center justify-center text-xs font-semibold"
      >
        오늘 날짜로 이동
      </button>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--muted)]">
        {weekdayLabels.map((label) => (
          <span key={label} className={cn(label === "일" && "text-[#d95b43]")}>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = dateKey(day);
          const active = key === selectedDate;
          const isToday = key === today;
          const outside = !isCurrentMonth(day, pickerMonth);
          const hasEvents = (byDate[key]?.length ?? 0) > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-md border text-sm font-bold transition",
                active
                  ? "border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                  : "border-transparent text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]",
                outside && !active && "text-[var(--muted)] opacity-45",
                isToday && !active && "border-[var(--accent)]",
              )}
              aria-label={format(day, "M월 d일 EEEE", { locale: ko })}
            >
              {format(day, "d")}
              {hasEvents ? (
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#d95b43]"
                  title="일정 있음"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d95b43]" />
          일정 있음
        </span>
        {loading ? <span>일정 표시 확인 중</span> : null}
      </div>
    </div>
  );
}
