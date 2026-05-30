import { db, auth } from './clinicalFirestoreService';
import { mockDbService } from '../lib/mockDatabase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type AppRole = 'clinician' | 'nurse' | 'allied_health' | 'admin' | 'billing' | 'patient' | 'manager' | 'front_desk' | 'read_only';

export interface UserRoleRecord {
  userId: string;
  role: AppRole;
  assignedBy: string;
  updatedAt: any;
}

export async function updateUserRole(userId: string, role: AppRole) {
  const adminId = auth.currentUser?.uid || 'system';
  
  mockDbService.updateItem('roles', userId, {
    userId,
    role,
    assignedBy: adminId
  });

  // Log to Audit
  mockDbService.addItem('audit_logs' as any, {
    action: 'ROLE_UPDATE',
    performedBy: adminId,
    resourceId: userId,
    resourceType: 'user_role',
    details: { newRole: role }
  });
}

export async function updateUserPatientLink(userId: string, patientId: string | null) {
  const adminId = auth.currentUser?.uid || 'system';
  
  mockDbService.updateItem('users', userId, {
    patientId: patientId || undefined
  });

  // Sync to real Firestore user record
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      patientId: patientId || null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to sync user patient linkage to Firestore:', error);
  }

  // Log to Audit
  mockDbService.addItem('audit_logs' as any, {
    action: 'USER_PATIENT_LINK',
    performedBy: adminId,
    resourceId: userId,
    resourceType: 'user_patient_link',
    details: { patientId: patientId }
  });
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const role = mockDbService.getDoc('roles', userId);
  return (role?.role as AppRole) || null;
}

