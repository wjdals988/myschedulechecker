"use client";

import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { addMonths, addWeeks, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { ChangeEvent, KeyboardEvent, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { useTodosForEvents } from "@/hooks/useTodosForEvents";
import { dateKey, parseDateKey, todayKey } from "@/lib/dates";
import { getEventColorOption, normalizeEventTag } from "@/lib/eventAppearance";
import { getDb } from "@/lib/firebase";
import { profileDisplayName } from "@/lib/profile";
import type { TodoWithEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TodoRange = "week" | "month";

export function TodoTab({ roomId, date, range }: { roomId: string; date: string; range: TodoRange }) {
  const session = useAnonymousSession();
  const selected = parseDateKey(date);
  const rangeStartDate = range === "week" ? startOfWeek(selected, { weekStartsOn: 0 }) : startOfMonth(selected);
  const rangeEndDate = range === "week" ? endOfWeek(selected, { weekStartsOn: 0 }) : endOfMonth(selected);
  const rangeStart = dateKey(rangeStartDate);
  const rangeEnd = dateKey(rangeEndDate);
  const previousDate = dateKey(range === "week" ? subWeeks(selected, 1) : subMonths(selected, 1));
  const nextDate = dateKey(range === "week" ? addWeeks(selected, 1) : addMonths(selected, 1));
  const title = range === "week" ? `${format(rangeStartDate, "M월 d일", { locale: ko })} - ${format(rangeEndDate, "M월 d일", { locale: ko })}` : format(rangeStartDate, "yyyy년 M월", { locale: ko });
  const { events, loading: eventsLoading, error: eventsError } = useEventsInRange(roomId, rangeStart, rangeEnd);
  const { todos, loading: todosLoading, error: todosError } = useTodosForEvents(roomId, events);
  const [incompleteOnly, setIncompleteOnly] = useState(true);
  const [targetEventId, setTargetEventId] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const effectiveTargetEventId = events.some((event) => event.id === targetEventId) ? targetEventId : (events[0]?.id ?? "");

  const visibleTodos = useMemo(() => {
    return incompleteOnly ? todos.filter((todo) => !todo.done) : todos;
  }, [incompleteOnly, todos]);

  const groupedTodos = useMemo(() => {
    const groups = visibleTodos.reduce<Record<string, TodoWithEvent[]>>((acc, todo) => {
      acc[todo.eventDate] = [...(acc[todo.eventDate] ?? []), todo];
      return acc;
    }, {});

    return Object.entries(groups).map(([groupDate, groupTodos]) => ({
      date: groupDate,
      todos: groupTodos,
    }));
  }, [visibleTodos]);

  const doneCount = todos.filter((todo) => todo.done).length;
  const activeCount = todos.length - doneCount;
  const author =
    session.uid && session.profile
      ? {
          uid: session.uid,
          label: profileDisplayName(session.profile),
        }
      : null;

  async function addTodo() {
    const trimmed = text.trim();
    if (!trimmed || !effectiveTargetEventId || !author) return;

    setSaving(true);
    setMessage(null);

    try {
      await addDoc(collection(getDb(), "rooms", roomId, "events", effectiveTargetEventId, "todos"), {
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
      window.setTimeout(() => setMessage(null), 1800);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "할일 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-148px)] px-4 py-5 lg:px-6 lg:py-6">
      <section className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker text-[0.72rem] font-bold">To-do</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">{range === "week" ? "이번주 할일" : "이번달 할일"}</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{title}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-0.5">
            <Link
              href={`/rooms/${roomId}/todos?date=${date}&range=week`}
              className={cn(
                "inline-flex h-9 items-center rounded px-3 text-sm font-semibold",
                range === "week" ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]" : "text-[var(--muted)]",
              )}
            >
              이번주
            </Link>
            <Link
              href={`/rooms/${roomId}/todos?date=${date}&range=month`}
              className={cn(
                "inline-flex h-9 items-center rounded px-3 text-sm font-semibold",
                range === "month" ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]" : "text-[var(--muted)]",
              )}
            >
              이번달
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIncompleteOnly((value) => !value)}
            className={cn(
              "app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold hover:border-[var(--accent)]",
              incompleteOnly && "border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]",
            )}
          >
            미완료만
          </button>

          <div className="grid grid-cols-3 gap-2">
            <Link href={`/rooms/${roomId}/todos?date=${previousDate}&range=${range}`} className="app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold hover:border-[var(--accent)]">
              이전
            </Link>
            <Link href={`/rooms/${roomId}/todos?date=${todayKey()}&range=${range}`} className="app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold hover:border-[var(--accent)]">
              오늘
            </Link>
            <Link href={`/rooms/${roomId}/todos?date=${nextDate}&range=${range}`} className="app-button-secondary inline-flex h-10 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold hover:border-[var(--accent)]">
              다음
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <TodoStat label="전체" value={todos.length} />
            <TodoStat label="미완료" value={activeCount} />
            <TodoStat label="완료" value={doneCount} />
          </div>

          {(eventsError || todosError) && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {eventsError ?? todosError}
            </p>
          )}

          {eventsLoading || todosLoading ? (
            <p className="app-panel p-4 text-sm font-semibold text-[var(--muted)]">할일을 불러오는 중입니다.</p>
          ) : groupedTodos.length === 0 ? (
            <div className="app-panel p-5 text-center">
              <p className="font-bold text-[var(--foreground)]">{incompleteOnly && todos.length > 0 ? "미완료 할일이 없습니다." : "표시할 할일이 없습니다."}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                할일은 일정에 연결됩니다. 빠른 추가 영역에서 일정 하나를 선택해 추가할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedTodos.map((group) => (
                <section key={group.date} className="app-panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <div>
                      <h2 className="text-base font-bold text-[var(--foreground)]">{format(parseDateKey(group.date), "M월 d일 EEEE", { locale: ko })}</h2>
                      <p className="mt-0.5 text-xs font-semibold text-[var(--muted)]">{group.todos.length}개</p>
                    </div>
                    <Link href={`/rooms/${roomId}/schedule?date=${group.date}`} className="text-xs font-bold text-[var(--accent)]">
                      일정 보기
                    </Link>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {group.todos.map((todo) => (
                      <TodoListItem key={`${todo.eventId}:${todo.id}:${todo.text}`} roomId={roomId} todo={todo} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="app-panel p-4">
            <div className="mb-4">
              <p className="app-kicker text-[0.7rem] font-bold">Quick Add</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">일정에 할일 추가</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">선택한 기간의 일정 중 하나에 할일을 연결합니다.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--muted)]">
                연결할 일정
                <select
                  value={effectiveTargetEventId}
                  onChange={(event) => setTargetEventId(event.target.value)}
                  disabled={events.length === 0}
                  className="app-input mt-2 h-11 w-full px-3 text-sm"
                >
                  {events.length === 0 ? <option value="">기간 내 일정 없음</option> : null}
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.date} {event.startTime ? `${event.startTime} ` : ""}
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[var(--muted)]">
                할일
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) addTodo();
                  }}
                  rows={3}
                  placeholder="해야 할 일을 입력하세요."
                  className="app-input mt-2 min-h-24 w-full resize-none px-3 py-2 text-sm"
                />
              </label>

              <button
                type="button"
                onClick={addTodo}
                disabled={!text.trim() || !effectiveTargetEventId || !author || saving}
                className="app-button-primary inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-45"
              >
                <PlusIcon className="h-4 w-4" />
                {saving ? "추가 중" : "할일 추가"}
              </button>

              {message ? <p className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">{message}</p> : null}

              {events.length === 0 ? (
                <Link href={`/rooms/${roomId}/schedule?date=${date}`} className="app-button-secondary inline-flex h-10 w-full items-center justify-center px-3 text-sm font-semibold hover:border-[var(--accent)]">
                  일정 먼저 만들기
                </Link>
              ) : null}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function TodoStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="app-subtle-panel p-4">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function TodoListItem({ roomId, todo }: { roomId: string; todo: TodoWithEvent }) {
  const [draft, setDraft] = useState(todo.text);
  const ref = doc(getDb(), "rooms", roomId, "events", todo.eventId, "todos", todo.id);
  const colorOption = getEventColorOption(todo.eventColor);
  const tag = normalizeEventTag(todo.eventTag);

  async function saveText() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(todo.text);
      return;
    }
    if (trimmed === todo.text) return;

    await updateDoc(ref, {
      text: trimmed,
      updatedAt: serverTimestamp(),
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  return (
    <article className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(event) =>
          updateDoc(ref, {
            done: event.target.checked,
            updatedAt: serverTimestamp(),
          })
        }
        className="h-5 w-5 accent-[var(--accent)]"
        aria-label="할일 완료 여부"
      />

      <div className="min-w-0">
        <input
          value={draft}
          onChange={handleChange}
          onBlur={saveText}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full border-0 bg-transparent text-base font-semibold text-[var(--foreground)] outline-none",
            todo.done && "text-[var(--muted)] line-through",
          )}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          {tag ? <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", colorOption.badgeClass)}>{tag}</span> : null}
          <span className={cn("h-2 w-2 rounded-full", colorOption.dotClass)} />
          <Link href={`/rooms/${roomId}/schedule/${todo.eventId}?date=${todo.eventDate}`} className="truncate text-[var(--accent)] hover:underline">
            {todo.eventTitle}
          </Link>
          <span>{todo.eventStartTime ?? "시간 없음"}</span>
          <span>작성자 {todo.authorLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link href={`/rooms/${roomId}/schedule/${todo.eventId}?date=${todo.eventDate}`} className="app-button-secondary inline-flex h-9 items-center justify-center px-3 text-xs font-semibold hover:border-[var(--accent)]">
          상세
        </Link>
        <button
          type="button"
          onClick={() => deleteDoc(ref)}
          className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-600"
          title="할일 삭제"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
