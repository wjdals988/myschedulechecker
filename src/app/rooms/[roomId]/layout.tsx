import { RoomShell } from "@/components/RoomShell";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomShell roomId={roomId}>{children}</RoomShell>;
}
