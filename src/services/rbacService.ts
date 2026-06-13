import { auth, clinicalService } from './clinicalFirestoreService';

export type AppRole = 'clinician' | 'nurse' | 'allied_health' | 'admin' | 'billing' | 'patient' | 'manager' | 'front_desk' | 'read_only';

export interface UserRoleRecord {
  userId: string;
  role: AppRole;
  assignedBy: string;
  updatedAt: any;
}

export async function updateUserRole(userId: string, role: AppRole) {
  const adminId = auth.currentUser?.uid || 'system';
  
  await clinicalService.updateItem('roles', userId, {
    userId,
    role,
    assignedBy: adminId
  });

  // Log to Audit
  await clinicalService.addItem('audit_logs', {
    action: 'ROLE_UPDATE',
    performedBy: adminId,
    resourceId: userId,
    resourceType: 'user_role',
    details: { newRole: role }
  });
}

export async function updateUserPatientLink(userId: string, patientId: string | null) {
  const adminId = auth.currentUser?.uid || 'system';
  
  await clinicalService.updateItem('users', userId, {
    patientId: patientId || undefined
  });

  // Log to Audit
  await clinicalService.addItem('audit_logs', {
    action: 'USER_PATIENT_LINK',
    performedBy: adminId,
    resourceId: userId,
    resourceType: 'user_patient_link',
    details: { patientId: patientId }
  });
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const role = await clinicalService.getDoc('roles', userId);
  return (role?.role as AppRole) || null;
}


