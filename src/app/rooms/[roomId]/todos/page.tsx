import { TodoTab, type TodoRange } from "@/components/TodoTab";
import { todayKey } from "@/lib/dates";

export default async function TodosPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ date?: string; range?: string }>;
}) {
  const [{ roomId }, query] = await Promise.all([params, searchParams]);
  const range: TodoRange = query.range === "month" ? "month" : "week";

  return <TodoTab roomId={roomId} date={query.date ?? todayKey()} range={range} />;
}
