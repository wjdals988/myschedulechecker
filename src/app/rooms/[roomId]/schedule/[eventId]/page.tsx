import { EventDetail } from "@/components/EventDetail";
import { todayKey } from "@/lib/dates";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string; eventId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ roomId, eventId }, query] = await Promise.all([params, searchParams]);
  return <EventDetail roomId={roomId} eventId={eventId} fallbackDate={query.date ?? todayKey()} />;
}
