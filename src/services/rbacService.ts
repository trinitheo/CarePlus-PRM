import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { db, auth } from './clinicalFirestoreService'; // Assuming shared db instance

export type AppRole = 'admin' | 'manager' | 'clinician' | 'front_desk' | 'read_only';

export interface UserRoleRecord {
  userId: string;
  role: AppRole;
  assignedBy: string;
  updatedAt: any;
}

export async function updateUserRole(userId: string, role: AppRole) {
  const adminId = auth.currentUser?.uid;
  if (!adminId) throw new Error("Unauthorized");

  const roleRef = doc(db, 'roles', userId);
  
  await setDoc(roleRef, {
    userId,
    role,
    assignedBy: adminId,
    updatedAt: serverTimestamp()
  });

  // Log to Audit
  await addDoc(collection(db, 'audit_logs'), {
    action: 'ROLE_UPDATE',
    performedBy: adminId,
    resourceId: userId,
    resourceType: 'user_role',
    timestamp: serverTimestamp(),
    details: { newRole: role }
  });
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const docSnap = await getDoc(doc(db, 'roles', userId));
  if (docSnap.exists()) {
    return docSnap.data().role as AppRole;
  }
  return null;
}
