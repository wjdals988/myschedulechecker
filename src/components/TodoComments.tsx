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
} from "firebase/firestore";
import { KeyboardEvent, useEffect, useState } from "react";
import { TrashIcon } from "@/components/icons";
import { LinkifiedText } from "@/components/LinkifiedText";
import { getDb } from "@/lib/firebase";
import type { CommentItem } from "@/lib/types";

export function TodoComments({
  roomId,
  eventId,
  todoId,
  author,
}: {
  roomId: string;
  eventId: string;
  todoId: string;
  author: { uid: string; label: string };
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = collection(getDb(), "rooms", roomId, "events", eventId, "todos", todoId, "comments");

    return onSnapshot(
      query(ref, orderBy("createdAt")),
      (snapshot) => {
        setComments(snapshot.docs.map((commentDoc) => ({ id: commentDoc.id, ...commentDoc.data() }) as CommentItem));
        setLoading(false);
        setError(null);
      },
      (caught) => {
        setError(caught.message);
        setLoading(false);
      },
    );
  }, [eventId, roomId, todoId]);

  async function addComment() {
    const nextText = text.trim();
    if (!nextText || busy) return;

    setBusy(true);
    setError(null);

    try {
      await addDoc(collection(getDb(), "rooms", roomId, "events", eventId, "todos", todoId, "comments"), {
        text: nextText,
        authorUid: author.uid,
        authorLabel: author.label,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setText("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "의견 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      addComment();
    }
  }

  return (
    <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[var(--muted)]">이 할일의 의견</p>
        {loading ? <span className="text-[11px] font-semibold text-[var(--muted)]">불러오는 중</span> : null}
      </div>

      {comments.length > 0 ? (
        <div className="mb-2 space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm leading-6 text-[var(--foreground)]">
                  <span className="font-bold text-[var(--accent)]">{comment.authorLabel}</span>
                  <span className="mx-1 text-[var(--muted)]">·</span>
                  <LinkifiedText text={comment.text} />
                </p>
                {comment.authorUid === author.uid ? (
                  <button
                    type="button"
                    onClick={() => deleteDoc(doc(getDb(), "rooms", roomId, "events", eventId, "todos", todoId, "comments", comment.id))}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded border border-red-200 text-red-600"
                    title="의견 삭제"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="의견 입력"
          className="app-input h-9 min-w-0 flex-1 px-3 text-sm"
        />
        <button
          type="button"
          onClick={addComment}
          disabled={!text.trim() || busy}
          className="app-button-primary inline-flex h-9 shrink-0 items-center justify-center px-3 text-xs font-semibold disabled:opacity-45"
        >
          추가
        </button>
      </div>

      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
