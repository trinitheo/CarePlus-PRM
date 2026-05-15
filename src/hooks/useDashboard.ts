import { useState, useEffect } from 'react';
import { mockDbService } from '../lib/mockDatabase';
import { User } from '../types';

export interface DashboardMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromRole: string;
  toUserId: string;
  patientId?: string;
  patientName?: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: any;
}

export interface CourtesyCallTask {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  priority: 'routine' | 'soon' | 'urgent';
  assignedToUserId: string;
  assignedToRole: string;
  createdByUserId: string;
  dueDate?: string;
  status: 'pending' | 'completed';
  createdAt: any;
}

export interface PendingResult {
  id: string;
  patientId: string;
  patientName?: string;
  category: string;
  tests: { testName: string }[];
  status: string;
  priority: string;
  createdAt: any;
}

export interface Reminder {
  id: string;
  patientId?: string;
  patientName?: string;
  assignedToUserId?: string;
  assignedToRole?: string;
  title: string;
  description?: string;
  dueDate: any;
  priority: 'routine' | 'urgent' | 'immediate';
  status: 'pending' | 'completed' | 'dismissed';
  frequency?: string;
  createdAt: any;
}

export function useDashboard(user: User | null) {
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [courtesyCalls, setCourtesyCalls] = useState<CourtesyCallTask[]>([]);
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Simulate real-time polling or just one-shot for mock
    const fetchData = () => {
      const allMsgs = mockDbService.getCollection('messages');
      setMessages(allMsgs.filter((m: any) => m.toUserId === user.id));

      const allCCs = mockDbService.getCollection('courtesy_calls' as any);
      setCourtesyCalls(allCCs.filter((c: any) => c.assignedToUserId === user.id && c.status === 'pending'));

      const allRems = mockDbService.getCollection('reminders');
      setReminders(allRems.filter((r: any) => 
        r.status === 'pending' && 
        (r.assignedToUserId === user.id || r.assignedToRole === user.role || (!r.assignedToUserId && !r.assignedToRole))
      ));

      setLoading(false);
    };

    fetchData();
  }, [user?.id, user?.role]);

  return { messages, courtesyCalls, pendingResults, reminders, loading };
}
