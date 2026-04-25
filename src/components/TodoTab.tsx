"use client";

import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { addMonths, addWeeks, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { LinkifiedText } from "@/components/LinkifiedText";
import { ShareTargetButton } from "@/components/ShareTargetButton";
import { TodoComments } from "@/components/TodoComments";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { useEventsInRange } from "@/hooks/useEventsInRange";
import { useTodosForEvents } from "@/hooks/useTodosForEvents";
import { dateKey, parseDateKey, todayKey } from "@/lib/dates";
import { deleteTodoWithComments } from "@/lib/eventMutations";
import { getEventColorOption, normalizeEventTag } from "@/lib/eventAppearance";
import { getDb } from "@/lib/firebase";
import { profileDisplayName } from "@/lib/profile";
import type { EventItem, TodoWithEvent } from "@/lib/types";
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
  const title =
    range === "week"
      ? `${format(rangeStartDate, "M월 d일", { locale: ko })} - ${format(rangeEndDate, "M월 d일", { locale: ko })}`
      : format(rangeStartDate, "yyyy년 M월", { locale: ko });

  const { events, loading: eventsLoading, error: eventsError } = useEventsInRange(roomId, rangeStart, rangeEnd);
  const { todos, loading: todosLoading, error: todosError } = useTodosForEvents(roomId, events);
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [targetEventId, setTargetEventId] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const effectiveTargetEventId = events.some((event) => event.id === targetEventId) ? targetEventId : (events[0]?.id ?? "");

  const visibleTodos = useMemo(() => (incompleteOnly ? todos.filter((todo) => !todo.done) : todos), [incompleteOnly, todos]);
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
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventItem[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [events]);

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
      setQuickAddOpen(false);
      window.setTimeout(() => setMessage(null), 1800);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "할일 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const quickAddPanel = (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">연결할 일정</p>
        <EventChoiceList
          events={events}
          selectedEventId={effectiveTargetEventId}
          onSelect={setTargetEventId}
          emptyLabel="기간 내 일정 없음"
          className="mt-2 max-h-44 overflow-y-auto pr-1"
          showDate
        />
      </div>

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
  );

  return (
    <main className="min-h-[calc(100vh-148px)] px-4 py-5 lg:px-6 lg:py-6">
      <section className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-kicker text-[0.72rem] font-bold">To-do</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">{range === "week" ? "이번주 할일" : "이번달 할일"}</h1>
            <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{title}</p>
          </div>

          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="app-button-primary grid h-11 w-11 shrink-0 place-items-center xl:hidden"
            aria-label="할일 빠른 추가"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="grid grid-cols-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-0.5">
            <Link
              href={`/rooms/${roomId}/todos?date=${date}&range=week`}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded px-3 text-sm font-semibold",
                range === "week" ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]" : "text-[var(--muted)]",
              )}
            >
              이번주
            </Link>
            <Link
              href={`/rooms/${roomId}/todos?date=${date}&range=month`}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded px-3 text-sm font-semibold",
                range === "month" ? "border border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]" : "text-[var(--muted)]",
              )}
            >
              이번달
            </Link>
          </div>

          <div className="grid grid-cols-[2.75rem_minmax(4.75rem,1fr)_2.75rem] overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--surface)]">
            <Link href={`/rooms/${roomId}/todos?date=${previousDate}&range=${range}`} className="inline-flex h-10 items-center justify-center text-base font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]" aria-label="이전 기간">
              {"<"}
            </Link>
            <Link href={`/rooms/${roomId}/todos?date=${todayKey()}&range=${range}`} className="inline-flex h-10 items-center justify-center border-x border-[var(--border)] px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
              오늘
            </Link>
            <Link href={`/rooms/${roomId}/todos?date=${nextDate}&range=${range}`} className="inline-flex h-10 items-center justify-center text-base font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]" aria-label="다음 기간">
              {">"}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <TodoStat label="전체" value={todos.length} />
            <TodoStat label="미완료" value={activeCount} />
            <TodoStat label="완료" value={doneCount} />
          </div>

          <button
            type="button"
            onClick={() => setIncompleteOnly((value) => !value)}
            className={cn(
              "app-button-secondary inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-semibold hover:border-[var(--accent)]",
              incompleteOnly && "border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]",
            )}
          >
            <span className="grid h-4 w-4 place-items-center rounded-sm border border-current text-[10px] leading-none">
              {incompleteOnly ? "✓" : ""}
            </span>
            미완료만 보기
          </button>

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
                할일은 일정에 연결됩니다. 모바일에서는 우상단 + 버튼으로 빠르게 추가할 수 있습니다.
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
                      <TodoListItem key={`${todo.eventId}:${todo.id}`} roomId={roomId} todo={todo} author={author} />
                    ))}
                  </div>
                  <DateTodoQuickAdd roomId={roomId} events={eventsByDate[group.date] ?? []} author={author} />
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
          <section className="app-panel p-4">
            <div className="mb-4">
              <p className="app-kicker text-[0.7rem] font-bold">Quick Add</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">일정에 할일 추가</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">선택한 기간의 일정 중 하나에 할일을 연결합니다.</p>
            </div>

            {quickAddPanel}
          </section>
        </aside>
      </section>

      {quickAddOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/45 xl:hidden" onClick={() => setQuickAddOpen(false)} role="presentation">
          <section
            className="max-h-[82dvh] w-full overflow-y-auto rounded-t-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="할일 빠른 추가"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="app-kicker text-[0.7rem] font-bold">Quick Add</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">일정에 할일 추가</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">선택한 기간의 일정 중 하나에 할일을 연결합니다.</p>
              </div>
              <button type="button" onClick={() => setQuickAddOpen(false)} className="app-button-secondary h-9 shrink-0 px-3 text-sm font-semibold">
                닫기
              </button>
            </div>
            {quickAddPanel}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function DateTodoQuickAdd({
  roomId,
  events,
  author,
}: {
  roomId: string;
  events: EventItem[];
  author: { uid: string; label: string } | null;
}) {
  const [text, setText] = useState("");
  const [targetEventId, setTargetEventId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const effectiveTargetEventId = events.some((event) => event.id === targetEventId) ? targetEventId : (events[0]?.id ?? "");

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
      setMessage("추가했습니다.");
      window.setTimeout(() => setMessage(null), 1600);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "할일 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
      <div className="mb-2">
        <p className="text-xs font-bold text-[var(--muted)]">이 날짜에 할일 추가</p>
        {events.length > 1 ? (
          <EventChoiceList
            events={events}
            selectedEventId={effectiveTargetEventId}
            onSelect={setTargetEventId}
            emptyLabel="이 날짜에 일정이 없습니다."
            className="mt-2"
          />
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addTodo();
          }}
          placeholder={events[0] ? `${events[0].title}에 추가` : "이 날짜에 일정이 없습니다."}
          disabled={events.length === 0}
          className="app-input h-10 min-w-0 flex-1 px-3 text-sm"
        />
        <button
          type="button"
          onClick={addTodo}
          disabled={!text.trim() || !effectiveTargetEventId || !author || saving}
          className="app-button-primary inline-flex h-10 shrink-0 items-center justify-center gap-1.5 px-3 text-sm font-semibold disabled:opacity-45"
        >
          <PlusIcon className="h-4 w-4" />
          추가
        </button>
      </div>

      {message ? <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}

function EventChoiceList({
  events,
  selectedEventId,
  onSelect,
  emptyLabel,
  className,
  showDate = false,
}: {
  events: EventItem[];
  selectedEventId: string;
  onSelect: (eventId: string) => void;
  emptyLabel: string;
  className?: string;
  showDate?: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className={cn("rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--muted)]", className)}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-1.5", className)} role="radiogroup" aria-label="연결할 일정 선택">
      {events.map((event) => {
        const selected = event.id === selectedEventId;

        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelect(event.id)}
            className={cn(
              "flex min-h-9 w-full min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition",
              selected
                ? "border-[var(--selection-border)] bg-[var(--selection-surface)] text-[var(--selection-foreground)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]",
            )}
            role="radio"
            aria-checked={selected}
          >
            <span className="shrink-0 text-[var(--accent)]">{event.startTime ?? "시간 없음"}</span>
            <span className="min-w-0 flex-1 truncate">
              {showDate ? `${event.date} ` : ""}
              {event.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TodoStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="app-subtle-panel p-3 text-center sm:p-4 sm:text-left">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--foreground)] sm:text-2xl">{value}</p>
    </div>
  );
}

function TodoListItem({
  roomId,
  todo,
  author,
}: {
  roomId: string;
  todo: TodoWithEvent;
  author: { uid: string; label: string } | null;
}) {
  const [draft, setDraft] = useState(todo.text);
  const [editing, setEditing] = useState(false);
  const ref = doc(getDb(), "rooms", roomId, "events", todo.eventId, "todos", todo.id);
  const colorOption = getEventColorOption(todo.eventColor);
  const tag = normalizeEventTag(todo.eventTag);

  async function saveText() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(todo.text);
      setEditing(false);
      return;
    }
    if (trimmed === todo.text) {
      setEditing(false);
      return;
    }

    await updateDoc(ref, {
      text: trimmed,
      updatedAt: serverTimestamp(),
    });
    setEditing(false);
  }

  return (
    <article className="px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={(event) =>
            updateDoc(ref, {
              done: event.target.checked,
              updatedAt: serverTimestamp(),
            })
          }
          className="mt-1 h-5 w-5 accent-[var(--accent)]"
          aria-label="할일 완료 여부"
        />

        <div className="min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveText();
                  if (event.key === "Escape") {
                    setDraft(todo.text);
                    setEditing(false);
                  }
                }}
                className="app-input h-10 w-full px-3 text-sm"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={saveText} className="app-button-primary h-8 px-3 text-xs font-semibold">
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(todo.text);
                    setEditing(false);
                  }}
                  className="app-button-secondary h-8 px-3 text-xs font-semibold"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <LinkifiedText
              text={todo.text}
              className={cn(
                "block text-base font-semibold leading-6 text-[var(--foreground)]",
                todo.done && "text-[var(--muted)] line-through",
              )}
            />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            {tag ? <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", colorOption.badgeClass)}>{tag}</span> : null}
            <span className={cn("h-2 w-2 rounded-full", colorOption.dotClass)} />
            <Link href={`/rooms/${roomId}/schedule/${todo.eventId}?date=${todo.eventDate}`} className="truncate text-[var(--accent)] hover:underline">
              {todo.eventTitle}
            </Link>
            <span>{todo.eventStartTime ?? "시간 없음"}</span>
            {todo.eventLocation ? <span className="truncate">장소 {todo.eventLocation}</span> : null}
            <span>작성 {todo.authorLabel}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <ShareTargetButton
            path={`/rooms/${roomId}/schedule/${todo.eventId}?date=${todo.eventDate}&todo=${todo.id}#todo-${todo.id}`}
            label="공유"
            title="할일 공유 링크 복사"
            iconOnly
          />
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="app-button-secondary inline-flex h-9 items-center justify-center gap-1.5 px-2.5 text-xs font-semibold hover:border-[var(--accent)]"
            title="할일 수정"
          >
            <EditIcon className="h-4 w-4" />
            <span className="hidden sm:inline">수정</span>
          </button>
          <Link href={`/rooms/${roomId}/schedule/${todo.eventId}?date=${todo.eventDate}&todo=${todo.id}#todo-${todo.id}`} className="app-button-secondary inline-flex h-9 items-center justify-center px-3 text-xs font-semibold hover:border-[var(--accent)]">
            상세
          </Link>
          <button
            type="button"
            onClick={() => deleteTodoWithComments(roomId, todo.eventId, todo.id)}
            className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-600"
            title="할일 삭제"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {author ? (
        <div className="mt-3 sm:ml-8">
          <TodoComments roomId={roomId} eventId={todo.eventId} todoId={todo.id} author={author} />
        </div>
      ) : null}
    </article>
  );
}
