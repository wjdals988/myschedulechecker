export type RecentRoom = {
  roomId: string;
  name: string;
  inviteCode: string;
  lastVisitedAt: number;
};

const recentRoomsKey = "recentRooms";
const maxRecentRooms = 6;

export function readRecentRooms() {
  if (typeof window === "undefined") return [] as RecentRoom[];

  const raw = window.localStorage.getItem(recentRoomsKey);
  if (!raw) return [] as RecentRoom[];

  try {
    const parsed = JSON.parse(raw) as RecentRoom[];
    if (!Array.isArray(parsed)) return [] as RecentRoom[];

    return parsed
      .filter((room) => room.roomId && room.name && room.inviteCode)
      .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
      .slice(0, maxRecentRooms);
  } catch {
    return [] as RecentRoom[];
  }
}

export function saveRecentRoom(room: Omit<RecentRoom, "lastVisitedAt"> & { lastVisitedAt?: number }) {
  if (typeof window === "undefined") return [] as RecentRoom[];

  const nextRoom: RecentRoom = {
    ...room,
    lastVisitedAt: room.lastVisitedAt ?? Date.now(),
  };

  const nextRooms = [
    nextRoom,
    ...readRecentRooms().filter((item) => item.roomId !== room.roomId),
  ].slice(0, maxRecentRooms);

  window.localStorage.setItem(recentRoomsKey, JSON.stringify(nextRooms));
  return nextRooms;
}
