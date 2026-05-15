import { auth } from './clinicalFirestoreService';
import { mockDbService } from '../lib/mockDatabase';

export async function uploadSOP(title: string, content: string, version: string) {
  return mockDbService.addItem('sops', {
    title,
    content,
    version,
    status: 'active'
  });
}

export async function acknowledgeSOP(sopId: string) {
  const userId = auth.currentUser?.uid || 'system';
  mockDbService.addItem('sop_acknowledgments' as any, {
    sopId,
    userId,
    witnessedAt: { seconds: Math.floor(Date.now() / 1000) }
  });
}
