import { auth, clinicalService } from './clinicalFirestoreService';

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
  return clinicalService.addItem('tasks', {
    ...data,
    createdBy: adminId
  });
}

export async function updateTaskStatus(taskId: string, status: InternalTask['status']) {
  await clinicalService.updateItem('tasks', taskId, { status });
}

export async function toggleSubtask(taskId: string, subtaskIndex: number, completed: boolean) {
  // Logic simplified for mock
}

