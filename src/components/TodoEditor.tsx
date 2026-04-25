"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { hasLink, LinkifiedText } from "@/components/LinkifiedText";
import { getDb } from "@/lib/firebase";
import type { TodoItem } from "@/lib/types";

export function TodoEditor({
  roomId,
  eventId,
  author,
}: {
  roomId: string;
  eventId: string;
  author: { uid: string; label: string };
}) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firestore = getDb();
    const ref = collection(firestore, "rooms", roomId, "events", eventId, "todos");

    return onSnapshot(
      query(ref, orderBy("order")),
      (snapshot) => {
        setTodos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TodoItem));
        setLoading(false);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [roomId, eventId]);

  async function addTodo() {
    if (!text.trim()) return;

    await addDoc(collection(getDb(), "rooms", roomId, "events", eventId, "todos"), {
      text: text.trim(),
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
          placeholder="할 일을 입력하세요"
          rows={2}
          className="min-h-16 flex-1 resize-none rounded border border-[#c9d7d2] px-3 py-2 outline-none transition focus:border-[#159a86]"
        />
        <button
          onClick={addTodo}
          disabled={!text.trim()}
          className="grid h-16 w-14 place-items-center rounded bg-[#159a86] text-white transition hover:bg-[#108270] disabled:opacity-50"
          title="할 일 추가"
        >
          <PlusIcon />
        </button>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-[#687a75]">할 일을 동기화하는 중입니다.</p> : null}

      <div className="space-y-2">
        {!loading && todos.length === 0 ? (
          <p className="rounded border border-dashed border-[#c9d7d2] bg-[#f8faf9] p-4 text-center text-sm text-[#687a75]">
            아직 등록된 할 일이 없습니다.
          </p>
        ) : null}
        {todos.map((todo) => (
          <TodoRow key={`${todo.id}:${todo.text}`} roomId={roomId} eventId={eventId} todo={todo} />
        ))}
      </div>
    </div>
  );
}

function TodoRow({
  roomId,
  eventId,
  todo,
}: {
  roomId: string;
  eventId: string;
  todo: TodoItem;
}) {
  const [draft, setDraft] = useState(todo.text);
  const ref = doc(getDb(), "rooms", roomId, "events", eventId, "todos", todo.id);

  async function saveText() {
    if (draft.trim() === todo.text) return;
    await updateDoc(ref, {
      text: draft.trim(),
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
    <div className="flex min-h-14 items-start gap-3 rounded border border-[#d8e3df] bg-white p-3">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(event) =>
          updateDoc(ref, {
            done: event.target.checked,
            updatedAt: serverTimestamp(),
          })
        }
        className="mt-2 h-5 w-5 accent-[#159a86]"
      />
      <div className="min-w-0 flex-1">
        <input
          value={draft}
          onChange={handleChange}
          onBlur={saveText}
          onKeyDown={handleKeyDown}
          className="w-full border-0 bg-transparent outline-none"
        />
        <p className="mt-1 text-[11px] font-semibold text-[#687a75]">작성 {todo.authorLabel}</p>
        {hasLink(draft) ? (
          <LinkifiedText text={draft} className="mt-2 block rounded-md bg-[#f8faf9] px-3 py-2 text-xs leading-5 text-[#52645f]" />
        ) : null}
      </div>
      <button
        onClick={() => deleteDoc(ref)}
        className="grid h-9 w-9 place-items-center rounded border border-red-200 text-red-600"
        title="할 일 삭제"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
