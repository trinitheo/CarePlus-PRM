
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { User as UserType } from '../../../types';
import { useQueryModel } from '../../../store/eventStore';
import { 
  Users, Activity, AlertTriangle, User, Heart, Wind, Droplets, Thermometer, Scale 
} from 'lucide-react';

export function useDashboardData(user: UserType | null) {
  const { patients, vitals: allVitals, appointments } = useQueryModel();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [courtesyCalls, setCourtesyCalls] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [flaggedMedications, setFlaggedMedications] = useState<any[]>([]);
  const [pendingResults, setPendingResults] = useState<any[]>([]);
  const [assignedPatientIds, setAssignedPatientIds] = useState<Set<string>>(new Set());
  const [referrals, setReferrals] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscriptions for user-specific data
  useEffect(() => {
    if (!user) return;
    const unsubs: (() => void)[] = [];

    // Messages
    const msgQ = query(
      collection(db, 'messages'),
      where('toUserId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    unsubs.push(onSnapshot(msgQ, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false)));

    // Courtesy Calls
    const ccQ = query(
      collection(db, 'courtesy_calls'),
      where('assignedToUserId', '==', user.id),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    unsubs.push(onSnapshot(ccQ, snap => {
      setCourtesyCalls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    // Reminders
    const remQ = query(
      collection(db, 'reminders'),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'asc'),
      limit(30)
    );
    unsubs.push(onSnapshot(remQ, snap => {
      const allReminders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const myReminders = allReminders.filter((r: any) => 
        r.assignedToUserId === user.id || 
        r.assignedToRole === user.role ||
        (!r.assignedToUserId && !r.assignedToRole)
      );
      setReminders(myReminders);
    }));

    // Staff Directory
    const staffQ = query(collection(db, 'users'), limit(50));
    unsubs.push(onSnapshot(staffQ, snap => {
      setStaffUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    return () => unsubs.forEach(u => u());
  }, [user?.id, user?.role]);

  // Subscriptions for patient-related cross-cutting data (Medications, Results, Care Team)
  useEffect(() => {
    if (!user || Object.keys(patients).length === 0) return;
    
    const unsubs: (() => void)[] = [];
    const patientIds = Object.keys(patients);
    const patientIdsKey = patientIds.sort().join(',');

    const subUnsubs: (() => void)[] = [];
    
    patientIds.forEach(pid => {
      // Medications
      const medsQ = query(
        collection(db, `patients/${pid}/prescriptions`),
        where('status', '==', 'active')
      );
      subUnsubs.push(onSnapshot(medsQ, snap => {
        const meds = snap.docs
          .map(d => ({ id: d.id, patientId: pid, patientName: (patients as any)[pid]?.name, ...d.data() }))
          .filter((m: any) => m.adherenceStatus && m.adherenceStatus !== 'optimal');
        
        setFlaggedMedications(prev => {
          const others = prev.filter(m => m.patientId !== pid);
          if (JSON.stringify(others.concat(meds)) === JSON.stringify(prev)) return prev;
          return [...others, ...meds];
        });
      }));

      // Investigations
      const invQ = query(
        collection(db, `patients/${pid}/investigations`),
        where('status', 'in', ['ordered', 'sample_collected']),
        orderBy('createdAt', 'desc'), 
        limit(10)
      );
      subUnsubs.push(onSnapshot(invQ, snap => {
        const items = snap.docs.map(d => ({
          id: d.id, patientId: pid,
          patientName: (patients as any)[pid]?.name || 'Unknown',
          ...d.data()
        }));
        setPendingResults(prev => {
          const others = prev.filter(r => r.patientId !== pid);
          if (JSON.stringify(others.concat(items)) === JSON.stringify(prev)) return prev;
          return [...others, ...items];
        });
      }));

      // Care Team (My Patients)
      const ctQ = query(
        collection(db, `patients/${pid}/care_teams`), 
        where('userId', '==', user.id), 
        where('status', '==', 'active')
      );
      subUnsubs.push(onSnapshot(ctQ, snap => {
        if (!snap.empty) {
          setAssignedPatientIds(prev => {
            if (prev.has(pid)) return prev;
            return new Set([...prev, pid]);
          });
        } else {
          setAssignedPatientIds(prev => {
            if (!prev.has(pid)) return prev;
            const n = new Set(prev); n.delete(pid); return n;
          });
        }
      }));

      // Referrals
      const refQ = query(collection(db, `patients/${pid}/referrals`), orderBy('createdAt', 'desc'), limit(5));
      subUnsubs.push(onSnapshot(refQ, snap => {
        const items = snap.docs.map(d => ({ id: d.id, patientId: pid, patientName: (patients as any)[pid]?.name, ...d.data() }));
        setReferrals(prev => {
          const others = prev.filter(r => r.patientId !== pid);
          if (JSON.stringify(others.concat(items)) === JSON.stringify(prev)) return prev;
          return [...others, ...items];
        });
      }));
    });

    return () => subUnsubs.forEach(u => u());
  }, [user?.id, Object.keys(patients).sort().join(',')]);

  // --- Derived Data Processing ---
  const processedData = useMemo(() => {
    // 1. Check-in Queue Processing
    const queue = Object.values(patients as Record<string, any>)
      .filter((p: any) => ['active', 'triage', 'pending'].includes(p.status || ''))
      .map((p: any) => {
        const pVitals = (allVitals[p.id] || []);
        const last = pVitals[pVitals.length - 1];
        const hoursAgo = last ? (Date.now() - last.timestamp) / 3600000 : Infinity;
        const vitalsStale = hoursAgo > 4;
        const isTriage = p.status === 'triage';
        return { ...p, last, hoursAgo, vitalsStale, isTriage };
      })
      .sort((a, b) => (b.isTriage ? 2 : b.vitalsStale ? 1 : 0) - (a.isTriage ? 2 : a.vitalsStale ? 1 : 0));

    // 2. Today's Schedule Processing
    const today = new Date().toDateString();
    const now = new Date();
    const todaySchedule = Object.values(appointments as any)
      .filter((a: any) => new Date(a.time).toDateString() === today)
      .map((a: any) => {
        const t = new Date(a.time);
        let status = 'upcoming';
        if (a.status === 'completed') status = 'done';
        else if (a.status === 'in_progress' || a.status === 'checked_in') status = 'active';
        else {
          const diff = (t.getTime() - now.getTime()) / 60000;
          if (diff < 0) status = 'overdue';
          else if (diff < 15) status = 'imminent';
        }
        return { 
          ...a, 
          patientName: (patients as any)[a.patientId]?.name || 'Unknown Patient',
          dashboardStatus: status
        };
      })
      .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // 3. System Stats (Admin)
    const pts = Object.values(patients as any);
    const systemStats = [
      { label: 'Total Patients', value: pts.length, icon: Users, color: 'bg-[#DEECF9] text-[#0078D4]', textColor: 'text-[#0078D4]' },
      { label: 'Active', value: pts.filter((p: any) => p.status === 'active').length, icon: Activity, color: 'bg-[#DFF6DD] text-[#107C10]', textColor: 'text-[#107C10]' },
      { label: 'Triage', value: pts.filter((p: any) => p.status === 'triage').length, icon: AlertTriangle, color: 'bg-red-50 text-red-600', textColor: 'text-red-700' },
      { label: 'Staff', value: staffUsers.length, icon: User, color: 'bg-amber-50 text-amber-600', textColor: 'text-amber-700' },
    ];

    // 4. Billing Stats (Financial)
    const billingStats = [
      { label: 'Active Encounters', value: pts.length, color: '#0078D4' },
      { label: 'Pending Claims', value: Math.ceil(pts.length * 0.6), color: '#CA5010' },
      { label: 'Approved This Month', value: Math.floor(pts.length * 0.3), color: '#107C10' },
      { label: 'Requires Review', value: 1, color: '#D13438' },
    ];

    // 5. Patient Vitals (My Vitals)
    const myVitalsList = allVitals[user?.id || ''] || [];
    const latestVital = myVitalsList[myVitalsList.length - 1];
    const patientMetrics = [
      { label: 'Heart Rate', value: latestVital?.hr || '--', unit: 'bpm', icon: Heart, color: '#D13438', ok: latestVital?.hr && latestVital.hr < 100 && latestVital.hr > 60 },
      { label: 'Blood Pressure', value: latestVital?.bp || '--', unit: 'mmHg', icon: Activity, color: '#0078D4', ok: true },
      { label: 'Resp Rate', value: latestVital?.rr || '--', unit: 'bpm', icon: Wind, color: '#107C10', ok: true },
      { label: 'SpO2', value: latestVital?.spo2 || '--', unit: '%', icon: Droplets, color: '#0078D4', ok: !latestVital?.spo2 || latestVital.spo2 >= 95 },
      { label: 'Temp', value: latestVital?.temp ? Number(latestVital.temp).toFixed(1) : '--', unit: '°C', icon: Thermometer, color: '#845701', ok: !latestVital?.temp || (latestVital.temp < 37.5 && latestVital.temp > 36.5) },
      { label: 'Weight', value: latestVital?.weight || '--', unit: 'kg', icon: Scale, color: '#616161', ok: true },
    ];
    const hasCriticalVitals = latestVital && (latestVital.hr > 110 || (latestVital.spo2 && latestVital.spo2 < 93));

    // 6. My Medications (Patient)
    const myMeds = flaggedMedications.filter(m => m.patientId === user?.id);

    // 7. My Assigned Patients (Allied/Clinician)
    const myPatients = Object.values(patients as Record<string, any>).filter(p => assignedPatientIds.has(p.id));

    return {
      queue,
      todaySchedule,
      systemStats,
      billingStats,
      patientMetrics,
      hasCriticalVitals,
      myMeds,
      myPatients,
      referrals: referrals // Filter later if specialty needed
    };
  }, [patients, allVitals, appointments, staffUsers, flaggedMedications, assignedPatientIds, referrals, user?.id]);

  return {
    messages,
    courtesyCalls,
    reminders,
    flaggedMedications,
    pendingResults,
    staffUsers,
    loading,
    ...processedData
  };
}
