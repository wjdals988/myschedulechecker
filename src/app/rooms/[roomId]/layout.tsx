import type { Metadata } from "next";
import { RoomShell } from "@/components/RoomShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;

  return {
    manifest: `/rooms/${encodeURIComponent(roomId)}/manifest.webmanifest`,
  };
}

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
