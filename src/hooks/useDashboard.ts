import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
    const unsubs: (() => void)[] = [];

    // Messages for this user
    const msgQ = query(
      collection(db, 'messages'),
      where('toUserId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    unsubs.push(onSnapshot(msgQ, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardMessage)));
      setLoading(false);
    }, () => setLoading(false)));

    // Courtesy calls assigned to this user
    const ccQ = query(
      collection(db, 'courtesy_calls'),
      where('assignedToUserId', '==', user.id),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    unsubs.push(onSnapshot(ccQ, snap => {
      setCourtesyCalls(snap.docs.map(d => ({ id: d.id, ...d.data() } as CourtesyCallTask)));
    }, () => {}));

    // Reminders for this user (assigned specifically or by role)
    const remQ = query(
      collection(db, 'reminders'),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'asc'),
      limit(30)
    );
    unsubs.push(onSnapshot(remQ, snap => {
      const allReminders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder));
      // Client side filter for simplicity in a multitenant/role-based demo
      const myReminders = allReminders.filter(r => 
        r.assignedToUserId === user.id || 
        r.assignedToRole === user.role ||
        (!r.assignedToUserId && !r.assignedToRole) // General reminders
      );
      setReminders(myReminders);
    }, () => {}));

    return () => unsubs.forEach(u => u());
  }, [user?.id, user?.role]);

  return { messages, courtesyCalls, pendingResults, reminders, loading };
}
