import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from './clinicalFirestoreService';

export async function uploadSOP(title: string, content: string, version: string) {
  return await addDoc(collection(db, 'sops'), {
    title,
    content,
    version,
    status: 'active',
    updatedAt: serverTimestamp()
  });
}

export async function acknowledgeSOP(sopId: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  await addDoc(collection(db, 'sop_acknowledgments'), {
    sopId,
    userId,
    witnessedAt: serverTimestamp()
  });
}
