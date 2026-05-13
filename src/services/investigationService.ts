import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db, auth } from './clinicalFirestoreService';

export async function createInvestigationOrder(patientId: string, data: any) {
  const adminId = auth.currentUser?.uid;
  return await addDoc(collection(db, 'patients', patientId, 'investigations'), {
    ...data,
    authorId: adminId,
    status: 'ordered',
    createdAt: serverTimestamp()
  });
}

export async function uploadInvestigationResult(investigationId: string, resultData: any) {
  // 1. Add result to global results collection
  await addDoc(collection(db, 'results'), {
    investigationId,
    ...resultData,
    createdAt: serverTimestamp()
  });

  // 2. Update investigation status
  // Note: Needs patientId to target subcollection if using the nested structure
}

export async function acknowledgeResult(patientId: string, investigationId: string) {
  const adminId = auth.currentUser?.uid;
  const ref = doc(db, 'patients', patientId, 'investigations', investigationId);
  await updateDoc(ref, {
    status: 'reviewed',
    acknowledgedBy: adminId,
    acknowledgedAt: serverTimestamp()
  });
}
