import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './clinicalFirestoreService';

export interface InternalTask {
  id: string;
  title: string;
  description: string;
  category: 'clinical' | 'administrative' | 'billing' | 'followup';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string; // userId
  createdBy: string;
  patientId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  dueDate?: any;
  subtasks: { id: string; label: string; completed: boolean }[];
}

export async function createInternalTask(data: Omit<InternalTask, 'id' | 'createdBy'>) {
  const adminId = auth.currentUser?.uid;
  return await addDoc(collection(db, 'tasks'), {
    ...data,
    createdBy: adminId || 'system',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateTaskStatus(taskId: string, status: InternalTask['status']) {
  const ref = doc(db, 'tasks', taskId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function toggleSubtask(taskId: string, subtaskIndex: number, completed: boolean) {
  const ref = doc(db, 'tasks', taskId);
  // Real implementation would use array item update, but for POC:
  // we would fetch and update.
}
