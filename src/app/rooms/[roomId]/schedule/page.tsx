import { ScheduleTab } from "@/components/ScheduleTab";
import { todayKey } from "@/lib/dates";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ roomId }, query] = await Promise.all([params, searchParams]);
  return <ScheduleTab roomId={roomId} date={query.date ?? todayKey()} />;
}
