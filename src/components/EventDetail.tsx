"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EventAppearanceFields } from "@/components/EventAppearanceFields";
import { TodoEditor } from "@/components/TodoEditor";
import { EditIcon, TrashIcon } from "@/components/icons";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { useEvent } from "@/hooks/useEvent";
import { getEventColorOption, normalizeEventColor, normalizeEventTag, type EventColorKey } from "@/lib/eventAppearance";
import { deleteEventWithTodos } from "@/lib/eventMutations";
import { getDb } from "@/lib/firebase";
import { profileDisplayName } from "@/lib/profile";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventDraft = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  memo: string;
  tag: string;
  color: EventColorKey;
};

export function EventDetail({
  roomId,
  eventId,
  fallbackDate,
}: {
  roomId: string;
  eventId: string;
  fallbackDate: string;
}) {
  const { event, loading, error } = useEvent(roomId, eventId);

  if (loading) {
    return <main className="p-4 text-sm text-[#687a75]">일정 상세를 불러오는 중입니다.</main>;
  }

  if (error || !event) {
    return (
      <main className="p-4">
        <div className="rounded-lg border border-[#d8e3df] bg-white p-5">
          <h1 className="text-lg font-semibold">일정을 찾을 수 없습니다</h1>
          <Link href={`/rooms/${roomId}/schedule?date=${fallbackDate}`} className="mt-4 inline-flex text-sm font-semibold text-[#159a86]">
            일정 목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return <EventEditor key={event.id} roomId={roomId} eventId={eventId} event={event} />;
}

function EventEditor({
  roomId,
  eventId,
  event,
}: {
  roomId: string;
  eventId: string;
  event: EventItem;
}) {
  const router = useRouter();
  const session = useAnonymousSession();
  const [draft, setDraft] = useState<EventDraft>(() => toDraft(event));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    return (
      draft.title.trim() !== event.title ||
      draft.date !== event.date ||
      normalizedOptional(draft.startTime) !== normalizedOptional(event.startTime) ||
      normalizedOptional(draft.endTime) !== normalizedOptional(event.endTime) ||
      normalizedOptional(draft.memo) !== normalizedOptional(event.memo) ||
      normalizeEventTag(draft.tag) !== normalizeEventTag(event.tag) ||
      normalizeEventColor(draft.color) !== normalizeEventColor(event.color)
    );
  }, [draft, event]);

  const colorOption = getEventColorOption(draft.color);

  function updateDraft(field: keyof EventDraft, value: string | EventColorKey) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function resetDraft() {
    setDraft(toDraft(event));
    setMessage(null);
    setDeleteConfirmOpen(false);
  }

  async function saveEvent() {
    const title = draft.title.trim();
    if (!title) {
      setMessage("일정 제목을 입력해 주세요.");
      return;
    }
    if (!draft.date) {
      setMessage("일정 날짜를 선택해 주세요.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updateDoc(doc(getDb(), "rooms", roomId, "events", eventId), {
        title,
        date: draft.date,
        startTime: draft.startTime || null,
        endTime: draft.endTime || null,
        memo: draft.memo.trim() || null,
        tag: normalizeEventTag(draft.tag) || null,
        color: normalizeEventColor(draft.color),
        updatedAt: serverTimestamp(),
      });

      setMessage("일정을 저장했습니다.");
      if (draft.date !== event.date) {
        router.replace(`/rooms/${roomId}/schedule/${eventId}?date=${draft.date}`);
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "일정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent() {
    setDeleting(true);
    setMessage(null);

    try {
      await deleteEventWithTodos(roomId, eventId);
      router.replace(`/rooms/${roomId}/schedule?date=${event.date}`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "일정 삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  const author = session.uid && session.profile ? { uid: session.uid, label: profileDisplayName(session.profile) } : null;

  return (
    <main className="space-y-5 px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/rooms/${roomId}/schedule?date=${draft.date || event.date}`} className="text-sm font-semibold text-[#159a86]">
          목록으로
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetDraft}
            disabled={!hasChanges || saving || deleting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#c9d7d2] bg-white px-3 text-sm font-semibold text-[#273f3a] transition hover:border-[#159a86] disabled:opacity-45"
          >
            취소
          </button>
          <button
            type="button"
            onClick={saveEvent}
            disabled={!hasChanges || saving || deleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#14211f] px-3 text-sm font-semibold text-white transition hover:bg-[#243a35] disabled:opacity-45"
          >
            <EditIcon className="h-4 w-4" />
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-[#d8e3df] bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#d8e3df] pb-4">
          <div>
            <p className="text-sm font-semibold text-[#159a86]">Edit Schedule</p>
            <h1 className="mt-1 text-2xl font-bold text-[#14211f]">일정 수정</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {normalizeEventTag(draft.tag) ? (
              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", colorOption.badgeClass)}>
                {normalizeEventTag(draft.tag)}
              </span>
            ) : null}
            <span className="rounded bg-[#eefaf7] px-2 py-1 text-xs font-semibold text-[#146c61]">
              작성자 {event.authorLabel}
            </span>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#52645f]">
          <span className={cn("h-2.5 w-2.5 rounded-full", colorOption.dotClass)} />
          <span>{colorOption.label} 일정</span>
        </div>

        <div className="grid gap-4">
          <label className="block text-sm font-semibold text-[#40534f]">
            제목
            <input
              value={draft.title}
              onChange={(change) => updateDraft("title", change.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-[#c9d7d2] px-3 text-xl font-bold outline-none transition focus:border-[#159a86]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-[#40534f]">
              날짜
              <input
                value={draft.date}
                onChange={(change) => updateDraft("date", change.target.value)}
                type="date"
                className="mt-2 h-11 w-full rounded-md border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#40534f]">
              시작
              <input
                value={draft.startTime}
                onChange={(change) => updateDraft("startTime", change.target.value)}
                type="time"
                className="mt-2 h-11 w-full rounded-md border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#40534f]">
              종료
              <input
                value={draft.endTime}
                onChange={(change) => updateDraft("endTime", change.target.value)}
                type="time"
                className="mt-2 h-11 w-full rounded-md border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
              />
            </label>
          </div>

          <EventAppearanceFields
            tag={draft.tag}
            color={draft.color}
            onTagChange={(value) => updateDraft("tag", value)}
            onColorChange={(value) => updateDraft("color", value)}
          />

          <label className="block text-sm font-semibold text-[#40534f]">
            메모
            <textarea
              value={draft.memo}
              onChange={(change) => updateDraft("memo", change.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-md border border-[#c9d7d2] px-3 py-2 outline-none transition focus:border-[#159a86]"
              placeholder="일정에 필요한 메모를 적어두세요."
            />
          </label>
        </div>

        {message ? (
          <p className="mt-4 rounded-md border border-[#d8e3df] bg-[#f8faf9] px-3 py-2 text-sm font-semibold text-[#52645f]">
            {message}
          </p>
        ) : null}

        <div className="mt-5 rounded-md border border-red-100 bg-red-50 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-700">일정 삭제</p>
              <p className="mt-1 text-xs leading-5 text-red-600">삭제하면 이 일정과 연결된 To-do도 함께 삭제됩니다.</p>
            </div>
            {deleteConfirmOpen ? (
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleting}
                  className="h-10 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={removeEvent}
                  disabled={deleting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  {deleting ? "삭제 중" : "삭제 확인"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
                삭제
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#d8e3df] bg-white p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#159a86]">To-do</p>
          <h2 className="text-xl font-bold">해야 할 일</h2>
        </div>
        {author ? (
          <TodoEditor roomId={roomId} eventId={eventId} author={author} />
        ) : (
          <p className="text-sm text-[#687a75]">작성자 정보를 준비하는 중입니다.</p>
        )}
      </section>
    </main>
  );
}

function toDraft(event: EventItem): EventDraft {
  return {
    title: event.title,
    date: event.date,
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    memo: event.memo ?? "",
    tag: normalizeEventTag(event.tag),
    color: normalizeEventColor(event.color),
  };
}

function normalizedOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || "";
}
