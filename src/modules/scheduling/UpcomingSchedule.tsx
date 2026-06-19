import React, { useState, useMemo, useEffect } from 'react';
import { useQueryModel, Appointment, Patient } from '../../store/eventStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Clock, Calendar, User, ChevronRight, Search, 
  Filter, Video, MapPin, MoreHorizontal, CheckCircle2,
  AlertCircle, ArrowUpCircle, Info, Phone, Mail,
  Activity, FileText, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '../../components/ui/dialog';
import { calculatePriority } from '../../lib/triageLogic';
import { transition } from '../../lib/motion';
import { updateAppointmentStatus } from '../../services/clinicalFirestoreService';

export function UpcomingSchedule({ onNavigateToPatient }: { onNavigateToPatient?: (id: string) => void }) {
  const { appointments, patients } = useQueryModel();
  const { userProfile } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  // Selected appointment details lookup
  const selectedAppt = useMemo(() => {
    if (!selectedApptId) return null;
    const appt = appointments[selectedApptId];
    if (!appt) return null;
    const patient = patients[appt.patientId];
    return { ...appt, patient };
  }, [selectedApptId, appointments, patients]);

  // Simulate loading state for "State Awareness" (Point 6)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Sorting & Filtering "Brain" (Point 4)
  const processedAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = today + (24 * 60 * 60 * 1000);

    return (Object.values(appointments) as Appointment[])
      .filter(appt => {
        const apptDate = new Date(appt.time).getTime();
        // Point 4: Calculate what counts as "Today"
        const isToday = apptDate >= today && apptDate < endOfToday;
        
        // Filter by patient if the user is a patient
        const matchesUser = userProfile?.role === 'patient' ? appt.patientId === userProfile.id : true;
        
        return isToday && matchesUser;
      })
      .filter(appt => {
        // Point 3: Cross-Reference System (Looking up patient name)
        const patient = patients[appt.patientId];
        const searchLower = searchTerm.toLowerCase();
        return (
          appt.reason.toLowerCase().includes(searchLower) ||
          (patient?.name.toLowerCase().includes(searchLower)) ||
          appt.id.toLowerCase().includes(searchLower)
        );
      })
      .map(appt => {
        // Point 5: Triage Logic Engine
        const triage = calculatePriority(appt.reason);
        return {
          ...appt,
          priority: triage.priority,
          priorityColor: triage.color
        };
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()); // Point 4: Sorted chronologically
  }, [appointments, patients, searchTerm]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateAppointmentStatus(id, status);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search & Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#242424] flex items-center gap-3">
            <Calendar className="h-7 w-7 text-[#0078D4]" />
            Upcoming Schedule
          </h1>
          <p className="text-[11px] font-bold text-[#616161] uppercase tracking-[0.2em] opacity-60">Clinical Encounter Queue · Today</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A19F9D] group-focus-within:text-[#0078D4] transition-colors" />
            <input 
              type="text"
              placeholder="Search patients, MRN or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-[#EDEBE9] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-[#0078D4]/10 focus:border-[#0078D4] transition-all w-80 shadow-sm"
            />
          </div>
          <Button variant="outline" className="rounded-xl border-[#EDEBE9] shadow-sm flex gap-2 h-11 px-4 bg-white hover:bg-[#FAFAFA]">
            <Filter className="h-4 w-4 text-[#616161]" />
            <span className="text-xs font-bold text-[#242424]">Filter By</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
        {/* Main List Area - Point 6 */}
        <Card className="flex-1 border-[#EDEBE9] shadow-md rounded-2xl overflow-hidden bg-white flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 w-full bg-[#FAFAFA] rounded-2xl animate-pulse flex items-center px-6 gap-6">
                    <div className="h-12 w-12 rounded-xl bg-[#F0F0F0]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/4 bg-[#F0F0F0] rounded" />
                      <div className="h-3 w-1/2 bg-[#F0F0F0] rounded" />
                    </div>
                  </div>
                ))
              ) : processedAppointments.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {processedAppointments.map((appt, idx) => {
                    const patient = patients[appt.patientId];
                    const isSelected = selectedApptId === appt.id;
                    
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...transition.entrance, delay: idx * 0.05 }}
                        className="group"
                        onClick={() => setSelectedApptId(appt.id)}
                      >
                        <div className={`relative flex items-center p-4 rounded-2xl border transition-all cursor-pointer bg-white overflow-hidden shadow-sm hover:shadow-md ${isSelected ? 'border-[#0078D4] ring-1 ring-[#0078D4]' : 'border-[#EDEBE9] hover:border-[#0078D4]/40'}`}>
                          {/* Priority Indicator - Point 5 */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5" 
                            style={{ backgroundColor: appt.priorityColor }} 
                          />

                          <div className="flex items-center justify-between w-full gap-6 pl-2">
                            {/* Time Column */}
                            <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-[#F3F2F1] pr-6">
                              <span className="text-[17px] font-black text-[#242424] tabular-nums">
                                {new Date(appt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                              <div className="mt-1.5 flex flex-col items-center gap-1">
                                {appt.visitType === 'telehealth' ? (
                                  <Badge className="bg-[#E7F4FF] text-[#0078D4] border-none text-[9px] font-black uppercase rounded-lg px-2 py-0.5 flex items-center gap-1.5">
                                    <Video className="h-2.5 w-2.5" />
                                    Virtual
                                  </Badge>
                                ) : (
                                  <Badge className="bg-[#F3F2F1] text-[#616161] border-none text-[9px] font-black uppercase rounded-lg px-2 py-0.5 flex items-center gap-1.5">
                                    <MapPin className="h-2.5 w-2.5" />
                                    In-Clinic
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Patient Info - Point 3 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-base font-black text-[#242424] truncate group-hover:text-[#0078D4] transition-colors">
                                  {patient?.name || 'Unknown Patient'}
                                </h3>
                                <Badge variant="outline" className="h-5 text-[10px] font-bold border-[#EDEBE9] text-[#616161] px-2">MRN: {patient?.mrn}</Badge>
                                {appt.priority !== 'routine' && (
                                  <Badge 
                                    style={{ backgroundColor: `${appt.priorityColor}15`, color: appt.priorityColor }} 
                                    className="border-none text-[10px] font-bold uppercase py-0.5 px-2 rounded-md animate-pulse"
                                  >
                                    {appt.priority}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-sm font-medium text-[#484644] truncate">{appt.reason}</p>
                                <div className="h-1 w-1 rounded-full bg-[#BDBDBD]" />
                                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                                  appt.status === 'checked_in' ? 'text-[#107C10]' : 
                                  appt.status === 'in_progress' ? 'text-[#0078D4]' : 'text-[#616161]'
                                }`}>
                                  {appt.status.replace('_', ' ')}
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions - Point 7 */}
                            <div className="flex items-center gap-2 shrink-0">
                               <Button 
                                 size="sm" 
                                 className={`h-9 rounded-xl font-bold text-xs px-5 shadow-sm transition-all ${
                                   appt.status === 'scheduled' 
                                   ? 'bg-[#107C10] hover:bg-[#0E6D0E] text-white' 
                                   : 'bg-[#F3F2F1] text-[#242424] hover:bg-[#EDEBE9]'
                                 }`}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (appt.status === 'scheduled') {
                                     handleStatusUpdate(appt.id, 'checked_in');
                                   } else {
                                     onNavigateToPatient?.(appt.patientId);
                                   }
                                 }}
                               >
                                 {appt.status === 'scheduled' ? 'Confirm Arrival' : 'View record'}
                               </Button>
                               <div className="h-9 w-9 rounded-xl hover:bg-[#F3F2F1] flex items-center justify-center transition-colors border border-transparent hover:border-[#EDEBE9]">
                                <ChevronRight className="h-5 w-5 text-[#A19F9D]" />
                               </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="h-24 w-24 rounded-full bg-[#FAFAFA] flex items-center justify-center border-2 border-dashed border-[#EDEBE9] mb-6">
                    <Calendar className="h-12 w-12 text-[#A19F9D]" />
                  </div>
                  <h3 className="text-lg font-black text-[#242424]">Dashboard Clear</h3>
                  <p className="text-sm text-[#616161] max-w-[280px] mt-2">No clinical encounters match your current filters for today.</p>
                  <Button variant="outline" className="mt-6 rounded-xl font-bold h-11 px-8 border-[#EDEBE9]" onClick={() => setSearchTerm('')}>
                    Reset View
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Real-time Side Metric Panel - Point 6 Extension */}
        <div className="hidden lg:flex flex-col w-80 gap-4 shrink-0">
           <Card className="p-6 border-[#EDEBE9] shadow-sm rounded-2xl bg-[#0078D4] text-white flex flex-col justify-between h-[200px] relative overflow-hidden">
             <div className="relative z-10">
               <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-2">Wait Time Efficiency</p>
               <h4 className="text-4xl font-black tracking-tight">94%</h4>
             </div>
             <ArrowUpCircle className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10" />
             <div className="relative z-10 flex items-center gap-2 text-xs font-bold py-2 px-3 bg-white/10 rounded-xl w-fit">
               <Activity className="h-3 w-3" />
               +2.1% from yesterday
             </div>
           </Card>

           <Card className="flex-1 p-6 border-[#EDEBE9] shadow-sm rounded-2xl bg-white flex flex-col">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-black text-[#242424] text-sm uppercase tracking-widest flex items-center gap-2">
                 <History className="h-4 w-4 text-[#0078D4]" />
                 Recent Activity
               </h3>
             </div>
             <ScrollArea className="flex-1">
               <div className="space-y-4 pr-3">
                 {[
                   { user: 'Elena Rostova', action: 'Checked in Marcus', time: '14 mins ago' },
                   { user: 'Nurse Tamara', action: 'Finished vitals for Marcus', time: '28 mins ago' },
                   { user: 'System', action: 'Auto-triaged appt-2', time: '1 hour ago' }
                 ].map((act, i) => (
                   <div key={i} className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-[#F3F2F1] flex items-center justify-center shrink-0">
                       <User className="h-4 w-4 text-[#616161]" />
                     </div>
                     <div>
                       <p className="text-[13px] font-bold text-[#242424] leading-tight">
                         <span className="font-black text-[#0078D4]">{act.user}</span> {act.action}
                       </p>
                       <p className="text-[10px] font-bold text-[#A19F9D] mt-0.5">{act.time}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </ScrollArea>
           </Card>
        </div>
      </div>

      {/* Appointment Detail Portal - Point 7 */}
      <Dialog open={!!selectedApptId} onOpenChange={(open) => !open && setSelectedApptId(null)}>
        <DialogContent className="sm:max-w-[1050px] w-[95vw] h-[85vh] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white flex flex-col">
          {selectedAppt && (
            <div className="flex flex-col h-full">
               <div className="bg-[#FAFAFA] p-8 lg:p-10 border-b border-[#F3F2F1] relative shrink-0">
                 <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: calculatePriority(selectedAppt.reason).color }} />
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-6">
                     <div className="h-20 w-20 rounded-2xl bg-white border border-[#EDEBE9] shadow-sm flex items-center justify-center shrink-0">
                       <User className="h-10 w-10 text-[#0078D4]" />
                     </div>
                     <div>
                       <Badge className="mb-3 bg-[#0078D4]/10 text-[#0078D4] border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">
                         {selectedAppt.visitType?.replace('_', ' ')} Encounter
                       </Badge>
                       <h2 className="text-4xl font-black text-[#242424] tracking-tight">{selectedAppt.patient?.name}</h2>
                       <div className="flex items-center gap-6 mt-3">
                         <div className="flex items-center gap-2 text-[13px] font-bold text-[#616161]">
                           <Calendar className="h-4 w-4 text-[#0078D4]" />
                           {new Date(selectedAppt.time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                         </div>
                         <div className="flex items-center gap-2 text-[13px] font-bold text-[#616161]">
                           <Clock className="h-4 w-4 text-[#0078D4]" />
                           {new Date(selectedAppt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black uppercase text-[#A19F9D] tracking-[0.2em] mb-2">Patient Status</p>
                     <Badge className={`text-[12px] font-black uppercase px-4 py-1.5 rounded-xl ${
                       selectedAppt.status === 'checked_in' ? 'bg-[#DFF6DD] text-[#107C10]' : 'bg-[#F3F2F1] text-[#616161]'
                     }`}>
                       {selectedAppt.status.replace('_', ' ')}
                     </Badge>
                   </div>
                 </div>
               </div>
               <ScrollArea className="flex-1">
                 <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-7 space-y-10">
                     {/* Clinical Context Section */}
                     <section>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A19F9D] flex items-center gap-2 mb-4">
                         <FileText className="h-4 w-4" />
                         Clinical Presentation & Reason
                       </h4>
                       <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-[#EDEBE9] relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Activity className="h-12 w-12 text-[#0078D4]" />
                         </div>
                         <p className="text-xl font-bold text-[#242424] leading-tight mb-4">{selectedAppt.reason}</p>
                         <div className="flex flex-wrap gap-3">
                           <div className="bg-white border border-[#EDEBE9] px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: calculatePriority(selectedAppt.reason).color }} />
                              <span className="text-[11px] font-black uppercase tracking-wider text-[#616161]">{calculatePriority(selectedAppt.reason).priority} Priority</span>
                           </div>
                           <div className="bg-white border border-[#EDEBE9] px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <Clock className="h-3 w-3 text-[#616161]" />
                              <span className="text-[11px] font-black uppercase tracking-wider text-[#616161]">30 Min Duration</span>
                           </div>
                         </div>
                       </div>
                     </section>
 
                     {/* Patient Demographics / Context */}
                     <section className="grid grid-cols-2 gap-6">
                       <div className="bg-white p-5 rounded-2xl border border-[#EDEBE9]">
                          <h5 className="text-[9px] font-black uppercase tracking-[0.15em] text-[#A19F9D] mb-3">Encounter Type</h5>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#FAFAFA] flex items-center justify-center border border-[#EDEBE9]">
                              {selectedAppt.visitType === 'telehealth' ? <Video className="h-5 w-5 text-[#0078D4]" /> : <MapPin className="h-5 w-5 text-[#616161]" />}
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-[#242424] capitalize">{selectedAppt.visitType?.replace('_', ' ')} Visit</p>
                              <p className="text-[10px] font-bold text-[#616161]">Standard Protocol</p>
                            </div>
                          </div>
                       </div>
                       <div className="bg-white p-5 rounded-2xl border border-[#EDEBE9]">
                          <h5 className="text-[9px] font-black uppercase tracking-[0.15em] text-[#A19F9D] mb-3">Insurance Verification</h5>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                               <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-[#242424]">Active Plan</p>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase">Verified</p>
                            </div>
                          </div>
                       </div>
                     </section>
                   </div>
 
                   <div className="lg:col-span-5 space-y-10 lg:border-l lg:border-[#F3F2F1] lg:pl-12">
                      {/* Patient Contact Area */}
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A19F9D] flex items-center gap-2 mb-5">
                          <User className="h-4 w-4" />
                          Patient Engagement
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 group cursor-pointer p-2 -m-2 rounded-xl hover:bg-[#F3F2F1] transition-colors">
                            <div className="h-10 w-10 rounded-xl bg-[#FAFAFA] flex items-center justify-center border border-[#EDEBE9] group-hover:bg-white transition-colors">
                              <Phone className="h-5 w-5 text-[#616161]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-0.5">Primary Contact</p>
                              <p className="text-sm font-black text-[#242424]">{selectedAppt.patient?.phone || '(555) 012-3456'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 group cursor-pointer p-2 -m-2 rounded-xl hover:bg-[#F3F2F1] transition-colors">
                            <div className="h-10 w-10 rounded-xl bg-[#FAFAFA] flex items-center justify-center border border-[#EDEBE9] group-hover:bg-white transition-colors">
                              <Mail className="h-5 w-5 text-[#616161]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-0.5">Secure Email</p>
                              <p className="text-sm font-black text-[#242424]">{selectedAppt.patient?.email || 'p.patient@example.com'}</p>
                            </div>
                          </div>
                        </div>
                      </section>
 
                      {/* Quick Administrative Tools */}
                      <section className="pt-8 border-t border-[#F3F2F1]">
                         <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A19F9D] mb-5">Workflow Controls</h4>
                         <div className="grid grid-cols-2 gap-3">
                           <Button variant="outline" className="rounded-xl text-[10px] font-black uppercase h-11 border-[#EDEBE9] hover:bg-[#F5F4F3] tracking-widest">Reschedule</Button>
                           <Button variant="outline" className="rounded-xl text-[10px] font-black uppercase h-11 border-[#EDEBE9] hover:bg-[#F5F4F3] tracking-widest">Edit Reason</Button>
                          <Button 
                             variant="outline" 
                             className="col-span-2 rounded-xl text-[10px] font-black uppercase h-11 border-red-100 text-[#D13438] hover:bg-red-50 tracking-widest mt-2"
                             onClick={() => {
                               handleStatusUpdate(selectedAppt.id, 'cancelled');
                               setSelectedApptId(null);
                             }}
                           >
                             <AlertCircle className="h-3 w-3 mr-2" />
                             Cancel Appointment
                           </Button>
                         </div>
                      </section>
                   </div>
                 </div>
               </ScrollArea>

               <div className="bg-[#F8F8F8] p-6 border-t border-[#F3F2F1] flex justify-between items-center">
                 <Button variant="ghost" className="text-[#616161] font-bold" onClick={() => setSelectedApptId(null)}>
                   Discard changes
                 </Button>
                 <div className="flex gap-3">
                   {selectedAppt.status === 'scheduled' && (
                     <Button 
                       className="bg-[#107C10] hover:bg-[#0E6D0E] text-white shadow-lg shadow-[#107C10]/20 rounded-xl px-8 font-black uppercase tracking-widest text-[11px]"
                       onClick={() => {
                         handleStatusUpdate(selectedAppt.id, 'checked_in');
                         setSelectedApptId(null);
                       }}
                     >
                       Confirm Check-In
                     </Button>
                   )}
                   <Button 
                     className="bg-[#0078D4] hover:bg-[#005A9E] text-white shadow-lg shadow-[#0078D4]/20 rounded-xl px-8 font-black uppercase tracking-widest text-[11px]"
                     onClick={() => onNavigateToPatient?.(selectedAppt.patientId)}
                   >
                     Launch Exam Room
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
