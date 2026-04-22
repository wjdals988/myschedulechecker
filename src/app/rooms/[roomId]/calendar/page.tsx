import { MonthlyCalendar } from "@/components/MonthlyCalendar";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <MonthlyCalendar roomId={roomId} />;
}
