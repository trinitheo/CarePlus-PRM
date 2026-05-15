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
  ArrowRight
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
  transitionAppointment, 
  getRooms, 
  Room, 
  createAppointment 
} from '../../services/schedulingService';
import { subscribeToAuditLogs, AuditEvent } from '../../services/auditService';
import { subscribeToCollection } from '../../services/clinicalFirestoreService';
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
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // Sync with Mock DB
  useEffect(() => {
    const unsubAppts = subscribeToCollection('appointments', (data) => {
      setAppointments(data);
    });

    const unsubRooms = subscribeToCollection('rooms', (data) => {
      setRooms(data);
    });

    return () => {
      unsubAppts();
      unsubRooms();
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const apptDate = appt.time?.seconds 
        ? new Date(appt.time.seconds * 1000) 
        : new Date(appt.time);
      const isSameDay = apptDate.toDateString() === selectedDate.toDateString();
      const matchesSearch = appt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            appt.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
      return isSameDay && matchesSearch;
    });
  }, [appointments, selectedDate, searchTerm]);

  const handleStatusChange = async (id: string, status: string, roomId?: string) => {
    await transitionAppointment(id, status, roomId);
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(null);
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
            <CardContent className="p-0 flex-1 relative">
              <ScrollArea className="h-full">
                <div className="divide-y divide-[#F3F2F1]">
                  {filteredAppointments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20">
                      <CalendarIcon className="h-16 w-16 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">No Encounters Scheduled</p>
                    </div>
                  )}
                  {filteredAppointments.map((appt, i) => (
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
                                {appt.time?.toDate ? appt.time.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                              </p>
                              <p className="text-[9px] font-bold text-[#A19F9D] uppercase mt-1">30m</p>
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-[14px] font-black text-[#242424] group-hover:text-[#0078D4] transition-colors">
                                  Patient: {appt.patientId.slice(0, 8).toUpperCase()}
                                </h4>
                                <Badge className={`h-4 text-[8px] font-black uppercase ${
                                  appt.priority === 'emergency' ? 'bg-[#FDE7E9] text-[#D13438]' :
                                  appt.priority === 'urgent' ? 'bg-[#FFF4CE] text-[#794500]' : 'bg-[#DFF6DD] text-[#107C10]'
                                }`}>
                                  {appt.priority}
                                </Badge>
                              </div>
                              <p className="text-[11px] font-medium text-[#616161] line-clamp-1 mt-0.5">{appt.reason}</p>
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
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
          {selectedAppointment && (
            <div className="flex h-[600px]">
              {/* Left Column: Summary & Actions */}
              <div className="flex-1 p-8 space-y-8 flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-[#F0F0F0] flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#0078D4]" />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-[#242424] tracking-tight">Patient Context</h2>
                         <p className="text-xs font-bold text-[#A19F9D] uppercase tracking-widest">ID: {selectedAppointment.patientId}</p>
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
                            <p className="text-sm font-black text-[#242424] mt-1">{selectedAppointment.time?.toDate ? selectedAppointment.time.toDate().toLocaleTimeString() : 'N/A'}</p>
                         </div>
                         <div className="p-4 rounded-xl bg-[#F8F8F8] border border-[#F3F2F1]">
                            <p className="text-[9px] font-black text-[#A19F9D] uppercase">Priority</p>
                            <p className="text-sm font-black text-[#242424] mt-1 capitalize">{selectedAppointment.priority}</p>
                         </div>
                      </div>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
