import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { RoomShell } from "@/components/RoomShell";
import { getDb } from "@/lib/firebase";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  const roomName = await getPublicRoomName(roomId);

  return {
    title: roomName ?? "공유방",
    openGraph: roomName
      ? {
          title: roomName,
          description: "초대 코드로 함께 쓰는, 우리만의 스마트 공유 일정",
          images: [
            {
              url: "/og-image.png",
              width: 1792,
              height: 1024,
              alt: `${roomName} 공유 일정 미리보기`,
            },
          ],
        }
      : undefined,
    twitter: roomName
      ? {
          title: roomName,
          description: "초대 코드로 함께 쓰는, 우리만의 스마트 공유 일정",
          images: ["/og-image.png"],
        }
      : undefined,
    manifest: `/rooms/${encodeURIComponent(roomId)}/manifest.webmanifest`,
  };
}

async function getPublicRoomName(roomId: string) {
  try {
    const snapshot = await getDoc(doc(getDb(), "roomPublic", roomId));
    const name = snapshot.data()?.name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
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
