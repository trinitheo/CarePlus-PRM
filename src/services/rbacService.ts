import { db, auth } from './clinicalFirestoreService';
import { mockDbService } from '../lib/mockDatabase';

export type AppRole = 'clinician' | 'nurse' | 'allied_health' | 'admin' | 'billing' | 'patient';

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

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const role = mockDbService.getDoc('roles', userId);
  return (role?.role as AppRole) || null;
}
