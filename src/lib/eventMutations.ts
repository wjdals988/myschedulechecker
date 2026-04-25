import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export async function deleteEventWithTodos(roomId: string, eventId: string) {
  const firestore = getDb();
  const todosRef = collection(firestore, "rooms", roomId, "events", eventId, "todos");
  const commentsRef = collection(firestore, "rooms", roomId, "events", eventId, "comments");
  const todoSnapshot = await getDocs(todosRef);
  const commentSnapshot = await getDocs(commentsRef);
  const todoCommentSnapshots = await Promise.all(
    todoSnapshot.docs.map((todoDoc) =>
      getDocs(collection(firestore, "rooms", roomId, "events", eventId, "todos", todoDoc.id, "comments")),
    ),
  );
  const batch = writeBatch(firestore);

  todoCommentSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((commentDoc) => batch.delete(commentDoc.ref));
  });
  todoSnapshot.docs.forEach((todoDoc) => batch.delete(todoDoc.ref));
  commentSnapshot.docs.forEach((commentDoc) => batch.delete(commentDoc.ref));

  if (!todoSnapshot.empty || !commentSnapshot.empty || todoCommentSnapshots.some((snapshot) => !snapshot.empty)) {
    await batch.commit();
  }

  await deleteDoc(doc(firestore, "rooms", roomId, "events", eventId));
}

export async function deleteTodoWithComments(roomId: string, eventId: string, todoId: string) {
  const firestore = getDb();
  const commentsRef = collection(firestore, "rooms", roomId, "events", eventId, "todos", todoId, "comments");
  const commentSnapshot = await getDocs(commentsRef);

  if (!commentSnapshot.empty) {
    const batch = writeBatch(firestore);
    commentSnapshot.docs.forEach((commentDoc) => batch.delete(commentDoc.ref));
    await batch.commit();
  }

  await deleteDoc(doc(firestore, "rooms", roomId, "events", eventId, "todos", todoId));
}
