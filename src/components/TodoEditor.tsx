"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { LinkifiedText } from "@/components/LinkifiedText";
import { ShareTargetButton } from "@/components/ShareTargetButton";
import { TodoComments } from "@/components/TodoComments";
import { deleteTodoWithComments } from "@/lib/eventMutations";
import { getDb } from "@/lib/firebase";
import type { TodoItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TodoEditor({
  roomId,
  eventId,
  author,
  highlightTodoId,
}: {
  roomId: string;
  eventId: string;
  author: { uid: string; label: string };
  highlightTodoId?: string | null;
}) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = collection(getDb(), "rooms", roomId, "events", eventId, "todos");

    return onSnapshot(
      query(ref, orderBy("order")),
      (snapshot) => {
        setTodos(snapshot.docs.map((todoDoc) => ({ id: todoDoc.id, ...todoDoc.data() }) as TodoItem));
        setLoading(false);
        setError(null);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [roomId, eventId]);

  async function addTodo() {
    const trimmed = text.trim();
    if (!trimmed) return;

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
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) addTodo();
          }}
          placeholder="할일을 입력하세요."
          rows={2}
          className="app-input min-h-16 flex-1 resize-none px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addTodo}
          disabled={!text.trim()}
          className="app-button-primary grid h-16 w-14 place-items-center disabled:opacity-50"
          title="할일 추가"
        >
          <PlusIcon />
        </button>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-[var(--muted)]">할일을 동기화하는 중입니다.</p> : null}

      <div className="space-y-3">
        {!loading && todos.length === 0 ? (
          <p className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-4 text-center text-sm text-[var(--muted)]">
            아직 등록된 할일이 없습니다.
          </p>
        ) : null}
        {todos.map((todo) => (
          <TodoRow
            key={todo.id}
            roomId={roomId}
            eventId={eventId}
            todo={todo}
            author={author}
            highlighted={todo.id === highlightTodoId}
          />
        ))}
      </div>
    </div>
  );
}

function TodoRow({
  roomId,
  eventId,
  todo,
  author,
  highlighted,
}: {
  roomId: string;
  eventId: string;
  todo: TodoItem;
  author: { uid: string; label: string };
  highlighted: boolean;
}) {
  const [draft, setDraft] = useState(todo.text);
  const [editing, setEditing] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const ref = doc(getDb(), "rooms", roomId, "events", eventId, "todos", todo.id);

  useEffect(() => {
    if (!highlighted) return;
    rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted]);

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

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      saveText();
    }
    if (event.key === "Escape") {
      setDraft(todo.text);
      setEditing(false);
    }
  }

  return (
    <div
      ref={rowRef}
      id={`todo-${todo.id}`}
      className={cn(
        "rounded-md border border-[var(--border)] bg-[var(--surface)] p-3",
        highlighted && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]",
      )}
    >
      <div className="flex min-h-14 items-start gap-3">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={(event) =>
            updateDoc(ref, {
              done: event.target.checked,
              updatedAt: serverTimestamp(),
            })
          }
          className="mt-2 h-5 w-5 accent-[var(--accent)]"
          aria-label="할일 완료 여부"
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
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
              className={cn("block text-sm leading-6 text-[var(--foreground)]", todo.done && "line-through opacity-60")}
            />
          )}
          <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">작성 {todo.authorLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ShareTargetButton
            path={`/rooms/${roomId}/schedule/${eventId}?todo=${todo.id}#todo-${todo.id}`}
            label="공유"
            title="할일 공유 링크 복사"
            iconOnly
          />
          <button
            type="button"
            onClick={() => {
              setDraft(todo.text);
              setEditing((value) => !value);
            }}
            className="grid h-9 w-9 place-items-center rounded border border-[var(--border)] text-[var(--foreground)]"
            title="할일 수정"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => deleteTodoWithComments(roomId, eventId, todo.id)}
            className="grid h-9 w-9 place-items-center rounded border border-red-200 text-red-600"
            title="할일 삭제"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <TodoComments roomId={roomId} eventId={eventId} todoId={todo.id} author={author} />
    </div>
  );
}
