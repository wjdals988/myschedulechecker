import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { JoinPage } from "@/components/JoinPage";
import { getDb } from "@/lib/firebase";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}): Promise<Metadata> {
  const { inviteCode } = await params;
  const roomName = await getPublicInviteRoomName(inviteCode.toUpperCase());

  if (!roomName) {
    return {
      title: "공유방 초대",
    };
  }

  return {
    title: roomName,
    openGraph: {
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
    },
    twitter: {
      title: roomName,
      description: "초대 코드로 함께 쓰는, 우리만의 스마트 공유 일정",
      images: ["/og-image.png"],
    },
  };
}

async function getPublicInviteRoomName(inviteCode: string) {
  try {
    const snapshot = await getDoc(doc(getDb(), "roomCodePublic", inviteCode));
    const name = snapshot.data()?.name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  return <JoinPage inviteCode={inviteCode} />;
}
