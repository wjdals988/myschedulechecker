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

export function EventComments({
  roomId,
  eventId,
  author,
}: {
  roomId: string;
  eventId: string;
  author: { uid: string; label: string };
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = collection(getDb(), "rooms", roomId, "events", eventId, "comments");

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
  }, [eventId, roomId]);

  async function addComment() {
    const nextText = text.trim();
    if (!nextText || busy) return;

    setBusy(true);
    setError(null);

    try {
      await addDoc(collection(getDb(), "rooms", roomId, "events", eventId, "comments"), {
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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      addComment();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="의견이나 참고할 내용을 남겨보세요."
          rows={2}
          className="min-h-16 flex-1 resize-none rounded border border-[#c9d7d2] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none transition focus:border-[#159a86]"
        />
        <button
          type="button"
          onClick={addComment}
          disabled={!text.trim() || busy}
          className="inline-flex h-16 w-16 items-center justify-center rounded bg-[#159a86] text-sm font-semibold !text-white transition hover:bg-[#108270] disabled:opacity-50"
        >
          등록
        </button>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-[#687a75]">의견을 불러오는 중입니다.</p> : null}

      <div className="space-y-2">
        {!loading && comments.length === 0 ? (
          <p className="rounded border border-dashed border-[#c9d7d2] bg-[#f8faf9] p-4 text-center text-sm text-[#687a75]">
            아직 등록된 의견이 없습니다.
          </p>
        ) : null}

        {comments.map((comment) => (
          <div key={comment.id} className="rounded border border-[#d8e3df] bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#159a86]">{comment.authorLabel}</p>
                <LinkifiedText text={comment.text} className="mt-1 block text-sm leading-6 text-[#273f3a]" />
              </div>
              {comment.authorUid === author.uid ? (
                <button
                  type="button"
                  onClick={() => deleteDoc(doc(getDb(), "rooms", roomId, "events", eventId, "comments", comment.id))}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded border border-red-200 text-red-600"
                  title="의견 삭제"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
