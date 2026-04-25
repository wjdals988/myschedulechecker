import { MonthlyCalendar } from "@/components/MonthlyCalendar";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ roomId }, query] = await Promise.all([params, searchParams]);
  const initialDate = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined;

  return <MonthlyCalendar roomId={roomId} initialDate={initialDate} />;
}
