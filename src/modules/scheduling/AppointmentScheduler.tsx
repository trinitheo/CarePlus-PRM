import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Video,
  Building,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  getAppointmentsByDateRange, 
  createAppointment, 
  updateAppointment,
  AppointmentData 
} from '../../services/schedulingService';
import { format, startOfWeek, addDays, startOfDay, endOfDay, isSameDay, addMinutes } from 'date-fns';

export function AppointmentScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data for providers and rooms
  const providers = [
    { id: 'p1', name: 'Dr. Sarah Smith', specialty: 'General Practice' },
    { id: 'p2', name: 'Dr. Michael Chen', specialty: 'Cardiology' },
    { id: 'p3', name: 'Dr. Emily Brown', specialty: 'Pediatrics' }
  ];

  const rooms = [
    { id: 'r1', name: 'Exam Room 1' },
    { id: 'r2', name: 'Exam Room 2' },
    { id: 'r3', name: 'Telehealth Room' }
  ];

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  async function fetchAppointments() {
    setLoading(true);
    const start = startOfWeek(currentDate);
    const end = addDays(start, 7);
    try {
      const data = await getAppointmentsByDateRange(start, end);
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate), i));

  return (
    <div className="p-8 space-y-8 font-segoe max-w-[1600px] mx-auto min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-[#0078D4]" />
            Advanced Scheduling
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">Provider capacity management and resource optimization</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-[#EDEBE9] rounded-xl flex items-center p-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="px-4 font-black text-sm text-[#242424]">
              {format(startOfWeek(currentDate), 'MMM d')} - {format(addDays(startOfWeek(currentDate), 6), 'MMM d, yyyy')}
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button className="bg-[#0078D4] hover:bg-[#005A9E] text-white px-6 h-12 rounded-xl flex gap-2 font-black shadow-lg shadow-[#0078D4]/20" onClick={() => setIsBookingOpen(true)}>
            <Plus className="h-5 w-5" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Filters & Stats */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
            <h3 className="text-[10px] font-black uppercase text-[#A19F9D] mb-6 tracking-widest px-2">Provider Availability</h3>
            <div className="space-y-4">
              {providers.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-[#DEECF9] hover:bg-[#F3F9FF] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#F3F2F1] flex items-center justify-center font-black text-[#616161]">
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#242424]">{p.name}</p>
                      <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-wider">{p.specialty}</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#242424] p-6 rounded-3xl text-white shadow-xl">
             <h3 className="text-[10px] font-black uppercase text-blue-400 mb-4 tracking-widest italic">Efficiency Index</h3>
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between items-end mb-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Slot Utilization</p>
                      <p className="text-sm font-black">84%</p>
                   </div>
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[84%]" />
                   </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                   High demand for Cardiology this week. 12 patients on waitlist.
                </p>
             </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden flex flex-col h-[75vh]">
          <div className="grid grid-cols-7 border-b border-[#F3F2F1] bg-[#FAFAFA]">
            {weekDays.map(day => (
              <div key={day.toString()} className={`py-4 text-center border-r border-[#F3F2F1] last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-white' : ''}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-1">{format(day, 'EEE')}</p>
                <p className={`text-lg font-black ${isSameDay(day, new Date()) ? 'text-[#0078D4]' : 'text-[#242424]'}`}>{format(day, 'd')}</p>
              </div>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-7 h-full min-h-[600px] divide-x divide-[#F3F2F1]">
              {weekDays.map(day => (
                <div key={day.toString()} className="p-2 space-y-2 relative group min-h-[100px]">
                  {appointments.filter(appt => {
                    const apptDate = appt.time instanceof Date ? appt.time : appt.time.toDate();
                    return isSameDay(apptDate, day);
                  }).map(appt => {
                    const apptDate = appt.time instanceof Date ? appt.time : appt.time.toDate();
                    return (
                      <div key={appt.id} className="p-3 rounded-2xl border border-[#EDEBE9] bg-white hover:border-[#0078D4] hover:shadow-md transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                          appt.priority === 'urgent' ? 'bg-rose-500' : 
                          appt.visitType === 'telehealth' ? 'bg-indigo-500' : 'bg-[#0078D4]'
                        }`} />
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[11px] font-black text-[#242424] leading-tight line-clamp-1">{appt.patientName}</p>
                           <MoreVertical className="h-3 w-3 text-[#A19F9D] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                           <Clock className="h-3 w-3 text-[#A19F9D]" />
                           <p className="text-[10px] font-bold text-[#A19F9D]">{format(apptDate, 'h:mm a')}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                           <Badge variant="ghost" className="h-4 p-0 px-1.5 text-[8px] font-black uppercase bg-[#F3F2F1] text-[#616161]">
                              {appt.providerName.split(' ')[1]}
                           </Badge>
                           {appt.visitType === 'telehealth' && (
                             <Badge variant="ghost" className="h-4 p-0 px-1.5 text-[8px] font-black uppercase bg-indigo-50 text-indigo-600">
                                <Video className="h-2 w-2 mr-1" />
                                Video
                             </Badge>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty state clickable area */}
                  <button className="w-full h-full min-h-[100px] opacity-0 group-hover:opacity-100 flex items-center justify-center border-2 border-dashed border-[#DEECF9] rounded-2xl transition-all">
                     <Plus className="h-6 w-6 text-[#0078D4] opacity-50" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Visits', value: '42', icon: User, color: 'text-[#0078D4]' },
           { label: 'Check-ins', value: '28', icon: CheckCircle2, color: 'text-emerald-500' },
           { label: 'Cancellations', value: '4', icon: XCircle, color: 'text-rose-500' },
           { label: 'Telehealth', value: '12', icon: Video, color: 'text-indigo-500' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm flex items-center gap-6">
              <div className={`h-12 w-12 rounded-2xl bg-[#FAFAFA] flex items-center justify-center ${stat.color}`}>
                 <stat.icon className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-2xl font-black text-[#242424]">{stat.value}</p>
                 <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest">{stat.label}</p>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
