import { auth } from './clinicalFirestoreService';
import { mockDbService } from '../lib/mockDatabase';

export async function createInvestigationOrder(patientId: string, data: any) {
  const adminId = auth.currentUser?.uid || 'system';
  return mockDbService.addItem('investigations', {
    ...data,
    authorId: adminId,
    status: 'ordered'
  }, patientId);
}

export async function uploadInvestigationResult(investigationId: string, resultData: any) {
  mockDbService.addItem('results', {
    investigationId,
    ...resultData
  });
}

export async function acknowledgeResult(patientId: string, investigationId: string) {
  const adminId = auth.currentUser?.uid || 'system';
  mockDbService.updateItem('investigations', investigationId, {
    status: 'reviewed',
    acknowledgedBy: adminId,
    acknowledgedAt: { seconds: Math.floor(Date.now() / 1000) }
  }, patientId);
}
