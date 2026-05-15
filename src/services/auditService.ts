import { auth } from './clinicalFirestoreService';
import { mockDbService } from '../lib/mockDatabase';

export interface AuditEvent {
  id?: string;
  timestamp: any;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityId: string;
  entityType: 'appointment' | 'patient' | 'record' | 'role' | 'billing';
  details: string;
  metadata?: any;
}

export async function logAudit(event: Omit<AuditEvent, 'timestamp' | 'userId' | 'userName' | 'userRole'>) {
  const user = auth.currentUser;
  
  mockDbService.addItem('audit_logs', {
    ...event,
    userId: user?.uid || 'system',
    timestamp: { seconds: Math.floor(Date.now() / 1000) },
  });
}

export function subscribeToAuditLogs(callback: (logs: AuditEvent[]) => void, entityId?: string) {
  // Sync simulation
  const logs = mockDbService.getCollection('audit_logs');
  if (entityId) {
    callback(logs.filter((l: any) => l.entityId === entityId));
  } else {
    callback(logs);
  }
  
  return () => {}; // No-op cleanup
}
