import { auth } from './clinicalFirestoreService';
import { mockDbService } from '../lib/mockDatabase';

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
  const adminId = auth.currentUser?.uid || 'system';
  return mockDbService.addItem('tasks', {
    ...data,
    createdBy: adminId
  });
}

export async function updateTaskStatus(taskId: string, status: InternalTask['status']) {
  mockDbService.updateItem('tasks', taskId, { status });
}

export async function toggleSubtask(taskId: string, subtaskIndex: number, completed: boolean) {
  // Logic simplified for mock
}
