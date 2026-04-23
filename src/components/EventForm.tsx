"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FormEvent, useState } from "react";
import { EventAppearanceFields } from "@/components/EventAppearanceFields";
import { PlusIcon } from "@/components/icons";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { DEFAULT_EVENT_COLOR, normalizeEventColor, normalizeEventTag, type EventColorKey } from "@/lib/eventAppearance";
import { getDb } from "@/lib/firebase";
import { profileDisplayName } from "@/lib/profile";

export function EventForm({
  roomId,
  date,
  onCreated,
}: {
  roomId: string;
  date: string;
  onCreated?: () => void;
}) {
  const session = useAnonymousSession();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [memo, setMemo] = useState("");
  const [tag, setTag] = useState("");
  const [color, setColor] = useState<EventColorKey>(DEFAULT_EVENT_COLOR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    if (!session.uid || !session.profile) {
      setError("작성자 표시를 먼저 선택해 주세요.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await addDoc(collection(getDb(), "rooms", roomId, "events"), {
        title: title.trim(),
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        memo: memo.trim() || null,
        tag: normalizeEventTag(tag) || null,
        color: normalizeEventColor(color),
        authorUid: session.uid,
        authorLabel: profileDisplayName(session.profile),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");
      setStartTime("");
      setEndTime("");
      setMemo("");
      setTag("");
      setColor(DEFAULT_EVENT_COLOR);
      onCreated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "일정 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="일정 제목"
        className="h-11 w-full rounded border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          type="time"
          aria-label="시작 시간"
          className="h-11 rounded border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
        />
        <input
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          type="time"
          aria-label="종료 시간"
          className="h-11 rounded border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
        />
      </div>

      <EventAppearanceFields tag={tag} color={color} onTagChange={setTag} onColorChange={setColor} />

      <textarea
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        placeholder="메모"
        rows={3}
        className="w-full resize-none rounded border border-[#c9d7d2] px-3 py-2 outline-none transition focus:border-[#159a86]"
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        disabled={busy || !title.trim()}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-[#159a86] px-4 text-sm font-semibold text-white transition hover:bg-[#108270] disabled:opacity-50"
      >
        <PlusIcon />
        일정 추가
      </button>
    </form>
  );
}
