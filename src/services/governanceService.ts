import { auth, clinicalService } from './clinicalFirestoreService';

export async function uploadSOP(title: string, content: string, version: string) {
  return clinicalService.addItem('sops', {
    title,
    content,
    version,
    status: 'active'
  });
}

export async function acknowledgeSOP(sopId: string) {
  const userId = auth.currentUser?.uid || 'system';
  await clinicalService.addItem('sop_acknowledgments', {
    sopId,
    userId,
    witnessedAt: { seconds: Math.floor(Date.now() / 1000) }
  });
}

