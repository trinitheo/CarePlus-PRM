import { auth, clinicalService } from './clinicalFirestoreService';

export async function createInvestigationOrder(patientId: string, data: any) {
  const adminId = auth.currentUser?.uid || 'system';
  return clinicalService.addItem('investigations', {
    ...data,
    authorId: adminId,
    status: 'ordered'
  }, patientId);
}

export async function uploadInvestigationResult(investigationId: string, resultData: any) {
  await clinicalService.addItem('results', {
    investigationId,
    ...resultData
  });
}

export async function acknowledgeResult(patientId: string, investigationId: string) {
  const adminId = auth.currentUser?.uid || 'system';
  await clinicalService.updateItem('investigations', investigationId, {
    status: 'reviewed',
    acknowledgedBy: adminId,
    acknowledgedAt: { seconds: Math.floor(Date.now() / 1000) }
  }, patientId);
}

