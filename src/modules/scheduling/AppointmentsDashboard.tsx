import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Activity, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Video,
  History,
  DoorOpen,
  ArrowRight,
  UserPlus,
  Check,
  Bot,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Input } from '../../components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { 
  transitionAppointment, 
  getRooms, 
  Room, 
  createAppointment 
} from '../../services/schedulingService';
import { subscribeToAuditLogs, AuditEvent } from '../../services/auditService';
import { subscribeToCollection } from '../../services/clinicalFirestoreService';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { AppointmentSchedulingAgentPanel } from './AppointmentSchedulingAgentPanel';
import { motion, AnimatePresence } from 'motion/react';

// --- Sub-components (MFE Style) ---

const AppointmentAuditTrail = ({ appointmentId }: { appointmentId: string }) => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);

  useEffect(() => {
    return subscribeToAuditLogs(setLogs, appointmentId);
  }, [appointmentId]);

  return (
    <div className="space-y-4 py-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#616161] mb-2 px-1">Encounter History</h4>
      {logs.map((log, i) => (
        <div key={log.id || i} className="flex gap-3 relative pl-4 border-l border-[#EDEBE9]">
          <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#0078D4]" />
          <div>
            <p className="text-[11px] font-bold text-[#242424]">{log.action.replace(/_/g, ' ')}</p>
            <p className="text-[10px] text-[#616161]">{log.details}</p>
            <p className="text-[9px] font-medium text-[#A19F9D] uppercase mt-0.5">
              {log.timestamp?.seconds 
                ? new Date(log.timestamp.seconds * 1000).toLocaleString() 
                : new Date(log.timestamp || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
      {logs.length === 0 && <p className="text-[10px] text-center text-[#A19F9D] py-4">No history recorded yet</p>}
    </div>
  );
};

export function AppointmentsDashboard() {
  const { userProfile } = useCurrentUser();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  // Booking Form State
  const [bookingPatientId, setBookingPatientId] = useState('');
  const [bookingProviderId, setBookingProviderId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingVisitType, setBookingVisitType] = useState<'clinic' | 'virtual'>('clinic');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingPriority, setBookingPriority] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [bookingDuration, setBookingDuration] = useState(30);
  const [bookingError, setBookingError] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // Sync with Mock DB & Live Collections
  useEffect(() => {
    const unsubAppts = subscribeToCollection('appointments', (data) => {
      setAppointments(data);
    });

    const unsubRooms = subscribeToCollection('rooms', (data) => {
      setRooms(data);
    });

    const unsubPatients = subscribeToCollection('patients', (data) => {
      setPatients(data);
    });

    const unsubUsers = subscribeToCollection('users', (data) => {
      setProviders(data.filter((u: any) => ['clinician', 'nurse', 'allied_health', 'admin'].includes(u.role)));
    });

    return () => {
      unsubAppts();
      unsubRooms();
      unsubPatients();
      unsubUsers();
    };
  }, []);

  const patientsMap = useMemo(() => {
    return patients.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);
  }, [patients]);

  const providersMap = useMemo(() => {
    return providers.reduce((acc, p) => {
      acc[p.id || p.userId] = p;
      return acc;
    }, {} as Record<string, any>);
  }, [providers]);

  const searchedPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 5);
    return patients.filter(p => {
      const name = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).trim();
      return name.toLowerCase().includes(patientSearch.toLowerCase()) || p.id.toLowerCase().includes(patientSearch.toLowerCase());
    }).slice(0, 5);
  }, [patients, patientSearch]);

  const formatApptTime = (timeVal: any) => {
    if (!timeVal) return '00:00';
    if (timeVal.toDate) {
      return timeVal.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (timeVal.seconds) {
      return new Date(timeVal.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(timeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const apptDate = appt.time?.seconds 
        ? new Date(appt.time.seconds * 1000) 
        : new Date(appt.time);
      const isSameDay = apptDate.toDateString() === selectedDate.toDateString();
      const patientNameRaw = (patientsMap[appt.patientId]?.name || `${patientsMap[appt.patientId]?.firstName || ''} ${patientsMap[appt.patientId]?.lastName || ''}`).trim();
      const matchesSearch = appt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            appt.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            patientNameRaw.toLowerCase().includes(searchTerm.toLowerCase());
      return isSameDay && matchesSearch;
    });
  }, [appointments, selectedDate, searchTerm, patientsMap]);

  const handleStatusChange = async (id: string, status: string, roomId?: string) => {
    await transitionAppointment(id, status, roomId);
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(null);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPatientId) {
      setBookingError('Please choose of one of our registered patients.');
      return;
    }
    if (!bookingProviderId) {
      setBookingError('Please choose a staff provider.');
      return;
    }
    if (!bookingReason.trim()) {
      setBookingError('Please provide a reason for scheduling.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError('');

    try {
      const datetime = new Date(`${bookingDate}T${bookingTime}:00`);
      const payload = {
        patientId: bookingPatientId,
        providerId: bookingProviderId,
        time: datetime.toISOString(),
        duration: Number(bookingDuration),
        status: 'scheduled' as const,
        visitType: bookingVisitType,
        reason: bookingReason,
        priority: bookingPriority,
      };

      await createAppointment(payload);
      setIsBookingOpen(false);

      // Reset
      setBookingPatientId('');
      setBookingReason('');
      setBookingPriority('routine');
      setBookingVisitType('clinic');
      setPatientSearch('');
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err.message || 'Failure scheduling appointment.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-1">
      {/* Header - Adaptive Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tighter uppercase leading-none">Scheduler</h1>
          <div className="flex items-center gap-3 mt-2">
             <Badge className="bg-[#DEECF9] text-[#0078D4] border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
               {filteredAppointments.length} Appts Today
             </Badge>
             <div className="h-1 w-1 rounded-full bg-[#EDEBE9]" />
             <p className="text-[10px] font-bold text-[#616161] uppercase tracking-wider">
               {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAgent(!showAgent)}
            className={`rounded-xl h-10 px-4 font-black uppercase text-[11px] tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              showAgent 
                ? 'bg-slate-900 text-white hover:bg-black' 
                : 'bg-gradient-to-r from-indigo-600 to-[#0078D4] text-white hover:opacity-95 shadow-indigo-500/20'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>{showAgent ? 'Hide AI Agent' : 'AI Scheduling Agent'}</span>
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A19F9D]" />
            <Input 
              placeholder="SEARCH PATIENT OR MRN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-64 bg-white border-[#EDEBE9] rounded-xl text-xs font-bold uppercase tracking-tight placeholder:text-[#A19F9D] focus:ring-[#0078D4]/10 shadow-sm" 
            />
          </div>
          <Button 
            className="bg-[#0078D4] hover:bg-[#005A9E] text-white rounded-xl h-10 px-4 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-[#0078D4]/20"
            onClick={() => setIsBookingOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Book
          </Button>
        </div>
      </div>

      {/* AI Agent Panel */}
      <AnimatePresence>
        {showAgent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AppointmentSchedulingAgentPanel onClose={() => setShowAgent(false)} embedded={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid View */}
      <div className="flex-1 min-h-0 grid lg:grid-cols-4 gap-6">
        {/* Sidebar: Rooms & Analytics */}
        <div className="hidden lg:flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-[#F8F8F8] border-b border-[#F3F2F1] py-4 px-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#616161]">Room Utilization</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F3F2F1]">
                {rooms.map(room => (
                  <div key={room.id} className="p-4 flex items-center justify-between group hover:bg-[#F9FCFF] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        room.status === 'available' ? 'bg-[#DFF6DD] text-[#107C10]' : 
                        room.status === 'occupied' ? 'bg-[#FDE7E9] text-[#D13438]' : 'bg-[#F3F2F1] text-[#616161]'
                      }`}>
                        <DoorOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-[#242424]">{room.name}</p>
                        <p className="text-[9px] font-bold text-[#A19F9D] uppercase">{room.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 h-4 ${
                      room.status === 'available' ? 'bg-[#DFF6DD] text-[#107C10]' : 'bg-[#FDE7E9] text-[#D13438]'
                    }`}>
                      {room.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-[#0078D4] text-white p-6 relative overflow-hidden group">
            <Activity className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Wait Time Efficiency</p>
            <div className="flex items-end gap-2">
              <h4 className="text-4xl font-black tracking-tighter">18m</h4>
              <span className="text-[10px] font-bold opacity-60 mb-1.5">-4m vs yesterday</span>
            </div>
          </Card>
        </div>

        {/* Center: Appointment List/Calendar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card className="flex-1 border-none shadow-sm bg-white overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#F3F2F1] px-6 py-4">
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 rounded-lg hover:bg-[#F3F2F1]"
                     onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
                   >
                     <ChevronLeft className="h-4 w-4" />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 rounded-lg hover:bg-[#F3F2F1]"
                     onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
                   >
                     <ChevronRight className="h-4 w-4" />
                   </Button>
                 </div>
                 <div className="flex bg-[#F3F2F1] p-1 rounded-lg">
                    {['list', 'calendar'].map(v => (
                      <button
                        key={v}
                        onClick={() => setView(v as any)}
                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${view === v ? 'bg-white text-[#0078D4] shadow-sm' : 'text-[#616161] hover:text-[#242424]'}`}
                      >
                        {v}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <Badge variant="outline" className="border-[#EDEBE9] text-[#616161] text-[9px] font-black uppercase px-2 h-6">
                    Sort: Priority
                 </Badge>
              </div>
            </CardHeader>
             <CardContent className="p-0 flex-[1] min-h-[500px] relative">
              <ScrollArea className="h-full">
                {view === 'list' ? (
                  <div className="divide-y divide-[#F3F2F1]">
                    {filteredAppointments.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-40 opacity-20">
                        <CalendarIcon className="h-16 w-16 mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">No Encounters Scheduled</p>
                      </div>
                    )}
                    {filteredAppointments.map((appt, i) => {
                      const patientDoc = patientsMap[appt.patientId];
                      const patientName = patientDoc ? (patientDoc.name || `${patientDoc.firstName || ''} ${patientDoc.lastName || ''}`).trim() : `Patient #${appt.patientId.slice(0, 8).toUpperCase()}`;
                      return (
                        <motion.div 
                          key={appt.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-4 hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                          onClick={() => setSelectedAppointment(appt)}
                        >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-6">
                                <div className="w-16 text-center border-r border-[#F3F2F1] pr-6">
                                   <p className="text-[14px] font-black text-[#242424] tabular-nums leading-none">
                                     {formatApptTime(appt.time)}
                                   </p>
                                   <p className="text-[9px] font-bold text-[#A19F9D] uppercase mt-1">{appt.duration || 30}m</p>
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                     <h4 className="text-[14px] font-black text-[#242424] group-hover:text-[#0078D4] transition-colors">
                                       {patientName}
                                     </h4>
                                     <Badge className={`h-4 text-[8px] font-black uppercase ${
                                       appt.priority === 'emergency' ? 'bg-[#FDE7E9] text-[#D13438]' :
                                       appt.priority === 'urgent' ? 'bg-[#FFF4CE] text-[#794500]' : 'bg-[#DFF6DD] text-[#107C10]'
                                     }`}>
                                       {appt.priority}
                                     </Badge>
                                   </div>
                                   <p className="text-[11px] font-medium text-[#616161] line-clamp-1 mt-0.5">{appt.reason}</p>
                                   {appt.providerId && providersMap[appt.providerId] && (
                                     <p className="text-[9px] font-bold text-[#A19F9D] uppercase mt-0.5">
                                       Provider: {providersMap[appt.providerId]?.name || providersMap[appt.providerId]?.displayName || 'Staff'}
                                     </p>
                                   )}
                                </div>
                             </div>
                             <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">
                                   {appt.visitType === 'virtual' ? (
                                     <Video className="h-3.5 w-3.5 text-[#0078D4]" />
                                   ) : (
                                     <MapPin className="h-3.5 w-3.5 text-[#616161]" />
                                   )}
                                   <span className="text-[10px] font-black uppercase tracking-tight text-[#616161]">{appt.visitType}</span>
                                </div>
                                <div className="flex items-center gap-2 min-w-[120px] justify-end">
                                   <Badge className={`uppercase text-[9px] font-black tracking-widest h-6 px-3 rounded-md ${
                                     appt.status === 'checked_in' ? 'bg-[#DFF6DD] text-[#107C10]' :
                                     appt.status === 'in_progress' ? 'bg-[#DEECF9] text-[#0078D4]' : 'bg-[#F3F2F1] text-[#616161]'
                                   }`}>
                                     {appt.status.replace('_', ' ')}
                                   </Badge>
                                   <button className="h-8 w-8 rounded-lg hover:bg-[#EDEBE9] flex items-center justify-center text-[#A19F9D] group-hover:text-[#242424] transition-all">
                                     <MoreVertical className="h-4 w-4" />
                                   </button>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* Hourly Timeline Calendar */
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#F3F2F1]">
                      <div>
                        <p className="text-xs font-black text-[#A19F9D] uppercase tracking-wider">Today's Hourly Load</p>
                        <p className="text-[10px] font-bold text-[#616161] mt-0.5 uppercase">8:00 AM — 6:00 PM Timeline</p>
                      </div>
                      <Badge className="bg-[#DEECF9] text-[#0078D4] border-none font-black text-[9px] uppercase tracking-wide px-2 py-0.5">
                        Daily Planner Mode
                      </Badge>
                    </div>
                    
                    <div className="relative">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => {
                        const timeString = `${hour.toString().padStart(2, '0')}:00`;
                        const readableHour = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                        
                        const hourAppts = filteredAppointments.filter((a) => {
                          const t = a.time?.seconds ? new Date(a.time.seconds * 1000) : new Date(a.time);
                          return t.getHours() === hour;
                        });

                        return (
                          <div key={hour} className="flex gap-4 min-h-[90px] border-b border-[#F3F2F1] last:border-none py-1 group">
                            <div className="w-20 pt-2 shrink-0 text-right pr-4 border-r border-[#EDEBE9]">
                              <span className="text-[11px] font-black text-[#242424] tabular-nums block">{readableHour}</span>
                              <span className="text-[9px] font-medium text-[#A19F9D] block mt-0.5">{timeString}</span>
                            </div>
                            
                            <div className="flex-1 flex flex-wrap gap-3 items-start p-1.5 min-w-0">
                              {hourAppts.length === 0 ? (
                                <div className="h-full flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 rounded-lg text-[9px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9]"
                                    onClick={() => {
                                      setBookingTime(`${hour.toString().padStart(2, '0')}:00`);
                                      setIsBookingOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Quick Book at {readableHour}
                                  </Button>
                                </div>
                              ) : (
                                hourAppts.map((appt) => {
                                  const patientDoc = patientsMap[appt.patientId];
                                  const patientName = patientDoc ? (patientDoc.name || `${patientDoc.firstName || ''} ${patientDoc.lastName || ''}`).trim() : `Patient #${appt.patientId.slice(0, 8).toUpperCase()}`;
                                  return (
                                    <div 
                                      key={appt.id}
                                      onClick={() => setSelectedAppointment(appt)}
                                      className="bg-white hover:bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl p-3 pr-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-3 items-center min-w-[240px] max-w-[325px] border-l-4 border-l-[#0078D4]"
                                    >
                                      <div className="bg-[#F0F4F8] text-[#0078D4] h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                                        {appt.visitType === 'virtual' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-black text-[#242424] truncate">{patientName}</p>
                                        <p className="text-[10px] text-[#616161] truncate leading-tight mt-0.5">{appt.reason}</p>
                                        <div className="flex gap-2 items-center mt-1">
                                          <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${
                                            appt.priority === 'emergency' ? 'bg-[#FDE7E9] text-[#D13438]' :
                                            appt.priority === 'urgent' ? 'bg-[#FFF4CE] text-[#794500]' : 'bg-[#DFF6DD] text-[#107C10]'
                                          }`}>
                                            {appt.priority}
                                          </span>
                                          <span className="text-[8px] text-[#A19F9D] font-bold">{appt.duration} Min</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </ScrollArea>
             </CardContent>
           </Card>
         </div>
       </div>

       {/* Book Appointment Dialog */}
       <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
         <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
           <DialogHeader className="bg-[#F8F8F8] border-b border-[#F3F2F1] p-6">
             <DialogTitle className="text-xl font-black text-[#242424] flex items-center gap-2 uppercase tracking-tight">
               <CalendarIcon className="h-6 w-6 text-[#0078D4]" />
               New Encounter Scheduling
             </DialogTitle>
           </DialogHeader>
           
           <form onSubmit={handleBookAppointment} className="p-6 space-y-6">
             {bookingError && (
               <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold uppercase flex gap-2 items-center">
                 <AlertCircle className="h-4 w-4 shrink-0" />
                 {bookingError}
               </div>
             )}

             <div className="grid md:grid-cols-2 gap-4">
               {/* Patient Lookup */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block">Select Patient</label>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A19F9D]" />
                   <Input 
                     placeholder="Search registered patients..." 
                     value={patientSearch}
                     onChange={(e) => setPatientSearch(e.target.value)}
                     className="pl-9 h-10 w-full bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-xs font-bold uppercase"
                   />
                 </div>
                 
                 {/* Quick Results */}
                 <div className="border border-[#F3F2F1] rounded-xl overflow-hidden bg-white max-h-[140px] overflow-y-auto divide-y divide-[#F3F2F1]">
                   {searchedPatients.map((p) => {
                     const isSelected = bookingPatientId === p.id;
                     return (
                       <button
                         key={p.id}
                         type="button"
                         onClick={() => {
                           setBookingPatientId(p.id);
                           setPatientSearch(p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim());
                         }}
                         className={`w-full text-left p-2.5 text-xs font-bold flex justify-between items-center transition-colors ${isSelected ? 'bg-[#DEECF9] text-[#0078D4]' : 'hover:bg-[#F9FAFB] text-slate-700'}`}
                       >
                         <div>
                           <p className="uppercase tracking-tight">{p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()}</p>
                           <p className="text-[9px] text-[#A19F9D] font-mono mt-0.5">ID: {p.id.slice(0, 10).toUpperCase()}</p>
                         </div>
                         {isSelected && <Check className="h-3.5 w-3.5" />}
                       </button>
                     );
                   })}
                   {searchedPatients.length === 0 && (
                     <p className="p-3 text-[10px] text-[#A19F9D] text-center uppercase font-bold">No patients match search</p>
                   )}
                 </div>
               </div>

               {/* Provider Select */}
               <div className="space-y-2 flex flex-col justify-between">
                 <div>
                   <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block mb-2">Assigned Care Staff</label>
                   <Select value={bookingProviderId} onValueChange={setBookingProviderId}>
                     <SelectTrigger className="h-10 bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-xs font-bold uppercase text-slate-700">
                       <SelectValue placeholder="CHOOSE DOCTOR OR CLINICIAN" />
                     </SelectTrigger>
                     <SelectContent className="bg-white border-[#EDEBE9]">
                       {providers.map((prov) => (
                         <SelectItem key={prov.id || prov.userId} value={prov.id || prov.userId} className="text-xs font-bold uppercase">
                           {(prov.name || prov.displayName || 'Staff').toUpperCase()} — {(prov.role || 'Provider').toUpperCase()}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                 {/* Visit Type */}
                 <div>
                   <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block mb-1">Encounter Medium</label>
                   <div className="grid grid-cols-2 gap-2 bg-[#F3F2F1] p-1 rounded-xl">
                     {(['clinic', 'virtual'] as const).map((vt) => (
                       <button
                         key={vt}
                         type="button"
                         onClick={() => setBookingVisitType(vt)}
                         className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all text-center ${bookingVisitType === vt ? 'bg-white text-[#0078D4] shadow-sm' : 'text-[#616161] hover:text-[#242424]'}`}
                       >
                         {vt === 'clinic' ? '🏥 Physical' : '📱 Telehealth'}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
             </div>

             <div className="grid md:grid-cols-4 gap-3">
               {/* Booking Date */}
               <div className="space-y-1.5 md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block">Date</label>
                 <Input 
                   type="date" 
                   value={bookingDate} 
                   onChange={(e) => setBookingDate(e.target.value)} 
                   className="h-10 bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-xs font-bold"
                 />
               </div>

               {/* Booking Time */}
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block">Time Slot</label>
                 <Input 
                   type="time" 
                   value={bookingTime} 
                   onChange={(e) => setBookingTime(e.target.value)} 
                   className="h-10 bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-xs font-bold"
                 />
               </div>

               {/* Duration */}
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block">Time Slot</label>
                 <Select value={bookingDuration.toString()} onValueChange={(val) => setBookingDuration(Number(val))}>
                   <SelectTrigger className="h-10 bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-xs font-bold uppercase text-slate-700">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-white border-[#EDEBE9]">
                     <SelectItem value="15" className="text-xs font-bold">15 MIN</SelectItem>
                     <SelectItem value="30" className="text-xs font-bold">30 MIN</SelectItem>
                     <SelectItem value="45" className="text-xs font-bold">45 MIN</SelectItem>
                     <SelectItem value="60" className="text-xs font-bold">60 MIN</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>

             {/* Encounter Priority */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block">Priority/Severity Tier</label>
               <div className="grid grid-cols-3 gap-2">
                 {(['routine', 'urgent', 'emergency'] as const).map((pr) => (
                   <button
                     key={pr}
                     type="button"
                     onClick={() => setBookingPriority(pr)}
                     className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all text-center ${
                       bookingPriority === pr 
                         ? pr === 'emergency' ? 'bg-[#FDE7E9] border-[#D13438] text-[#D13438]' 
                         : pr === 'urgent' ? 'bg-[#FFF4CE] border-[#794500] text-[#794500]'
                         : 'bg-[#DFF6DD] border-[#107C10] text-[#107C10]' 
                         : 'bg-[#FAFAFA] border-[#EDEBE9] text-[#616161] hover:bg-slate-50'
                     }`}
                   >
                     {pr}
                   </button>
                 ))}
               </div>
             </div>

             {/* Reason */}
             <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest block">Clinical Focus & Reasoning</label>
               <textarea 
                 value={bookingReason}
                 onChange={(e) => setBookingReason(e.target.value)}
                 placeholder="State diagnostic symptoms, chief complaint, or purpose of the outpatient follow-up..." 
                 className="w-full min-h-[90px] p-3 text-xs font-bold uppercase tracking-tight placeholder:text-[#A19F9D] bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/10"
               />
             </div>

             <DialogFooter className="pt-4 border-t border-[#F3F2F1] flex gap-3">
               <Button 
                 type="button"
                 variant="outline" 
                 onClick={() => setIsBookingOpen(false)}
                 className="rounded-xl h-12 font-black uppercase text-[11px] tracking-widest border-[#EDEBE9] text-[#242424]"
               >
                 Cancel
               </Button>
               <Button 
                 type="submit"
                 disabled={isSubmittingBooking}
                 className="rounded-xl h-12 bg-[#0078D4] hover:bg-[#005A9E] text-white font-black uppercase text-[11px] tracking-widest shadow-lg shadow-[#0078D4]/20"
               >
                 {isSubmittingBooking ? 'SCHEDULING...' : 'CONFIRM APPOINTMENT'}
               </Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>

       {/* Appointment Detail Dialog */}
       <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
         <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
           {selectedAppointment && (() => {
             const patientDoc = patientsMap[selectedAppointment.patientId];
             const patientName = patientDoc ? (patientDoc.name || `${patientDoc.firstName || ''} ${patientDoc.lastName || ''}`).trim() : `Patient #${selectedAppointment.patientId.slice(0, 8).toUpperCase()}`;
             const providerDoc = providersMap[selectedAppointment.providerId];
             const providerName = providerDoc ? (providerDoc.name || providerDoc.displayName || 'Staff') : 'Unassigned';
             return (
               <div className="flex h-[600px]">
                 {/* Left Column: Summary & Actions */}
                 <div className="flex-1 p-8 space-y-8 flex flex-col justify-between overflow-y-auto">
                   <div>
                      <div className="flex items-center gap-3 mb-6">
                         <div className="h-12 w-12 rounded-2xl bg-[#F0F0F0] flex items-center justify-center">
                           <Users className="h-6 w-6 text-[#0078D4]" />
                         </div>
                         <div>
                            <h2 className="text-2xl font-black text-[#242424] tracking-tight">{patientName}</h2>
                            <p className="text-xs font-bold text-[#A19F9D] uppercase tracking-widest">ID: {selectedAppointment.patientId.toUpperCase()}</p>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <label className="text-[10px] font-black uppercase text-[#A19F9D] tracking-widest">Encounter Reason</label>
                            <p className="text-base font-bold text-[#242424] leading-snug mt-1">{selectedAppointment.reason}</p>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-[#F8F8F8] border border-[#F3F2F1]">
                               <p className="text-[9px] font-black text-[#A19F9D] uppercase">Time Slot</p>
                               <p className="text-sm font-black text-[#242424] mt-1">{formatApptTime(selectedAppointment.time)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#F8F8F8] border border-[#F3F2F1]">
                               <p className="text-[9px] font-black text-[#A19F9D] uppercase">Priority / Severity</p>
                               <p className="text-sm font-black text-[#242424] mt-1 capitalize">{selectedAppointment.priority}</p>
                            </div>
                         </div>

                         {selectedAppointment.providerId && (
                           <div className="p-4 rounded-xl bg-[#F8F8F8] border border-[#F3F2F1]">
                             <p className="text-[9px] font-black text-[#A19F9D] uppercase">Assigned Care Staff</p>
                             <p className="text-sm font-black text-[#0078D4] mt-1 uppercase">{providerName}</p>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#616161]">Assign to Encounter Room</h4>
                      <div className="grid grid-cols-3 gap-2">
                         {rooms.filter(r => r.status === 'available').map(room => (
                           <Button 
                             key={room.id}
                             variant="outline"
                             className="h-12 rounded-xl text-[10px] font-black uppercase border-[#EDEBE9] hover:bg-[#DEECF9] hover:text-[#0078D4] hover:border-[#0078D4]/20 overflow-hidden"
                             onClick={() => handleStatusChange(selectedAppointment.id, 'in_progress', room.id)}
                           >
                             <MapPin className="h-3 w-3 mr-1" />
                             {room.name}
                           </Button>
                         ))}
                      </div>
                      <div className="pt-6 border-t border-[#F3F2F1] flex gap-3">
                         <Button 
                           variant="outline" 
                           className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] border-red-100 text-red-600 hover:bg-red-50"
                           onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                         >
                           Cancel Encounter
                         </Button>
                         <Button 
                           className="flex-1 rounded-xl h-12 bg-[#107C10] hover:bg-[#0E6D0E] font-black uppercase text-[10px] text-white"
                           onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                         >
                           Complete Visit
                         </Button>
                      </div>
                   </div>
                 </div>

                 {/* Right Column: History & Metadata */}
                 <div className="w-80 bg-[#FAFAFA] border-l border-[#F3F2F1] flex flex-col">
                    <div className="p-6 border-b border-[#F3F2F1]">
                       <h3 className="text-xs font-black text-[#242424] flex items-center gap-2 uppercase tracking-widest">
                          <History className="h-4 w-4 text-[#0078D4]" />
                          Audit Trail
                       </h3>
                    </div>
                    <ScrollArea className="flex-1 px-6">
                       <AppointmentAuditTrail appointmentId={selectedAppointment.id} />
                    </ScrollArea>
                    <div className="p-6 bg-white border-t border-[#F3F2F1]">
                       <Button variant="ghost" className="w-full text-[10px] font-bold text-[#A19F9D] uppercase hover:text-foreground" onClick={() => setSelectedAppointment(null)}>
                          Close Details
                       </Button>
                    </div>
                 </div>
               </div>
             );
           })()}
         </DialogContent>
       </Dialog>
    </div>
  );
}
