import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export async function deleteEventWithTodos(roomId: string, eventId: string) {
  const firestore = getDb();
  const todosRef = collection(firestore, "rooms", roomId, "events", eventId, "todos");
  const todoSnapshot = await getDocs(todosRef);
  const batch = writeBatch(firestore);

  todoSnapshot.docs.forEach((todoDoc) => batch.delete(todoDoc.ref));

  if (!todoSnapshot.empty) {
    await batch.commit();
  }

  await deleteDoc(doc(firestore, "rooms", roomId, "events", eventId));
}
