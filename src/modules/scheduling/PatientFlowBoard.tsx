import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../services/clinicalFirestoreService';
import { transitionAppointment, getRooms, Room } from '../../services/schedulingService';
import { 
  Clock, 
  User, 
  DoorOpen, 
  CheckCircle2, 
  AlertCircle, 
  MoreHorizontal,
  ChevronRight,
  Stethoscope,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  time: any;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_room' | 'completed' | 'cancelled' | 'no_show';
  roomId?: string;
  reason: string;
}

export function PatientFlowBoard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to today's appointments
    const q = query(collection(db, 'appointments'), orderBy('time', 'asc'));
    const unsubAppts = onSnapshot(q, (snap) => {
      const list: Appointment[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(list);
      setLoading(false);
    }, (error) => {
      console.warn("PatientFlowBoard appointments subscription error:", error);
      setLoading(false);
    });

    // Listen to rooms
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      const list: Room[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Room);
      });
      setRooms(list);
    }, (error) => {
      console.warn("PatientFlowBoard rooms subscription error:", error);
    });

    return () => {
      unsubAppts();
      unsubRooms();
    };
  }, []);

  const getStatusConfig = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return { label: 'Scheduled', color: 'bg-slate-100 text-slate-700', icon: Clock };
      case 'checked_in': return { label: 'Waiting', color: 'bg-amber-100 text-amber-700', icon: User };
      case 'in_room': return { label: 'In Room', color: 'bg-[#DEECF9] text-[#0078D4]', icon: DoorOpen };
      case 'completed': return { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
      default: return { label: status, color: 'bg-rose-100 text-rose-700', icon: AlertCircle };
    }
  };

  const columns: Appointment['status'][] = ['checked_in', 'in_room', 'completed'];

  return (
    <div className="p-8 space-y-8 font-segoe max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-[#0078D4]" />
            Patient Flow Command
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">Real-time clinical throughput and resource utilization</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-[#EDEBE9] p-3 rounded-2xl shadow-sm flex items-center gap-4">
             <div className="flex -space-x-2">
                {rooms.map((r, i) => (
                  <div key={r.id} title={r.name} className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black ${r.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                    {r.name.charAt(0)}
                  </div>
                ))}
             </div>
             <div className="border-l border-[#F3F2F1] pl-4">
                <p className="text-[10px] font-black uppercase text-[#A19F9D]">Available Rooms</p>
                <p className="text-sm font-black text-[#242424]">{rooms.filter(r => r.status === 'available').length} / {rooms.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {columns.map(status => (
          <div key={status} className="bg-[#FAFAFA] rounded-3xl border border-[#EDEBE9] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#EDEBE9] bg-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${getStatusConfig(status).color}`}>
                    {React.createElement(getStatusConfig(status).icon, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#242424] uppercase tracking-wider">{getStatusConfig(status).label}</h3>
                    <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest">{appointments.filter(a => a.status === status).length} Patients</p>
                  </div>
               </div>
               <Badge className="bg-[#F3F2F1] text-[#616161] border-none font-black text-[10px]">
                 Triage Ready
               </Badge>
            </div>

            <ScrollArea className="flex-1 p-4">
               <div className="space-y-4">
                  {appointments.filter(a => a.status === status).map(appt => (
                    <div key={appt.id} className="bg-white p-5 rounded-2xl border border-[#EDEBE9] shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative">
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-full bg-[#F3F2F1] flex items-center justify-center font-black text-[#616161]">
                                {appt.patientName?.charAt(0) || 'P'}
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#242424]">{appt.patientName || 'Anonymous Patient'}</p>
                                <p className="text-[11px] font-medium text-[#A19F9D] flex items-center gap-1">
                                   <Clock className="h-3 w-3" />
                                   Scheduled: {new Date(appt.time?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A19F9D] group-hover:text-[#0078D4]">
                             <MoreHorizontal className="h-4 w-4" />
                          </Button>
                       </div>

                       <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#F3F2F1] mb-4">
                          <p className="text-[10px] font-black uppercase text-[#A19F9D] mb-1">Encounter Reason</p>
                          <p className="text-xs font-bold text-[#242424] line-clamp-1">{appt.reason}</p>
                       </div>

                       <div className="flex items-center justify-between gap-3">
                          {status === 'checked_in' && (
                            <div className="flex gap-2 flex-1">
                               <select 
                                 className="flex-1 bg-white border border-[#EDEBE9] rounded-lg px-2 py-1.5 text-[10px] font-black outline-none focus:ring-1 focus:ring-[#0078D4]"
                                 onChange={(e) => transitionAppointment(appt.id, 'in_room', e.target.value)}
                               >
                                 <option value="">Assign Room</option>
                                 {rooms.filter(r => r.status === 'available').map(r => (
                                   <option key={r.id} value={r.id}>{r.name}</option>
                                 ))}
                               </select>
                            </div>
                          )}
                          {status === 'in_room' && (
                            <div className="flex items-center justify-between flex-1">
                               <div className="flex items-center gap-2 bg-[#DEECF9] px-3 py-1.5 rounded-lg border border-[#CFE4FA]">
                                  <Stethoscope className="h-3.5 w-3.5 text-[#0078D4]" />
                                  <span className="text-[10px] font-black text-[#0078D4] uppercase">Examining</span>
                               </div>
                               <Button 
                                 size="sm" 
                                 className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] font-black px-4"
                                 onClick={() => transitionAppointment(appt.id, 'completed')}
                               >
                                 Discharge
                               </Button>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
                  {appointments.filter(a => a.status === status).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                       <div className="h-16 w-16 bg-white rounded-2xl border-2 border-dashed border-[#EDEBE9] flex items-center justify-center mb-4">
                          <AlertCircle className="h-6 w-6 text-[#A19F9D]" />
                       </div>
                       <p className="text-xs font-black text-[#A19F9D] uppercase tracking-widest">Stage Empty</p>
                    </div>
                  )}
               </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}
