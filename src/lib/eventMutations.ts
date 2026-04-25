import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export async function deleteEventWithTodos(roomId: string, eventId: string) {
  const firestore = getDb();
  const todosRef = collection(firestore, "rooms", roomId, "events", eventId, "todos");
  const commentsRef = collection(firestore, "rooms", roomId, "events", eventId, "comments");
  const todoSnapshot = await getDocs(todosRef);
  const commentSnapshot = await getDocs(commentsRef);
  const batch = writeBatch(firestore);

  todoSnapshot.docs.forEach((todoDoc) => batch.delete(todoDoc.ref));
  commentSnapshot.docs.forEach((commentDoc) => batch.delete(commentDoc.ref));

  if (!todoSnapshot.empty || !commentSnapshot.empty) {
    await batch.commit();
  }

  await deleteDoc(doc(firestore, "rooms", roomId, "events", eventId));
}
