"use client";

import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TodoEditor } from "@/components/TodoEditor";
import { TrashIcon } from "@/components/icons";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { useEvent } from "@/hooks/useEvent";
import { getDb } from "@/lib/firebase";

export function EventDetail({
  roomId,
  eventId,
  fallbackDate,
}: {
  roomId: string;
  eventId: string;
  fallbackDate: string;
}) {
  const router = useRouter();
  const session = useAnonymousSession();
  const { event, loading, error } = useEvent(roomId, eventId);

  async function saveField(field: "title" | "startTime" | "endTime" | "memo", value: string) {
    if (!event) return;
    await updateDoc(doc(getDb(), "rooms", roomId, "events", eventId), {
      [field]: value.trim() || null,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeEvent() {
    if (!event) return;
    await deleteDoc(doc(getDb(), "rooms", roomId, "events", eventId));
    router.push(`/rooms/${roomId}/schedule?date=${event.date}`);
  }

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

  const author = session.uid && session.profile ? { uid: session.uid, label: session.profile.label } : null;

  return (
    <main className="space-y-5 px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/rooms/${roomId}/schedule?date=${event.date}`} className="text-sm font-semibold text-[#159a86]">
          목록으로
        </Link>
        <button
          onClick={removeEvent}
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-red-200 bg-white px-3 text-sm font-semibold text-red-600"
        >
          <TrashIcon />
          삭제
        </button>
      </div>

      <section className="rounded-lg border border-[#d8e3df] bg-white p-4 shadow-sm">
        <label className="block text-sm font-semibold text-[#40534f]">
          제목
          <input
            key={`title-${event.title}`}
            defaultValue={event.title}
            onBlur={(change) => saveField("title", change.target.value)}
            className="mt-2 h-12 w-full rounded border border-[#c9d7d2] px-3 text-xl font-bold outline-none transition focus:border-[#159a86]"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold text-[#40534f]">
            시작
            <input
              key={`start-${event.startTime ?? ""}`}
              defaultValue={event.startTime ?? ""}
              onBlur={(change) => saveField("startTime", change.target.value)}
              type="time"
              className="mt-2 h-11 w-full rounded border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
            />
          </label>
          <label className="block text-sm font-semibold text-[#40534f]">
            종료
            <input
              key={`end-${event.endTime ?? ""}`}
              defaultValue={event.endTime ?? ""}
              onBlur={(change) => saveField("endTime", change.target.value)}
              type="time"
              className="mt-2 h-11 w-full rounded border border-[#c9d7d2] px-3 outline-none transition focus:border-[#159a86]"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold text-[#40534f]">
          메모
          <textarea
            key={`memo-${event.memo ?? ""}`}
            defaultValue={event.memo ?? ""}
            onBlur={(change) => saveField("memo", change.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded border border-[#c9d7d2] px-3 py-2 outline-none transition focus:border-[#159a86]"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#687a75]">
          <span className="rounded bg-[#eefaf7] px-2 py-1 font-semibold text-[#146c61]">{event.authorLabel}</span>
          <span className="rounded bg-[#f2f5f4] px-2 py-1">{event.date}</span>
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
