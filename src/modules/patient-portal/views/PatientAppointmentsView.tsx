import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  Calendar, Clock, Video, MapPin, User, CheckCircle, 
  XCircle, AlertCircle, Sparkles, ChevronRight, ExternalLink, 
  RefreshCw, FileText, Send, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryModel } from '../../../store/eventStore';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { updateAppointmentStatus, clinicalService } from '../../../services/clinicalFirestoreService';
import { transition } from '../../../lib/motion';

export function PatientAppointmentsView() {
  const { appointments, patients } = useQueryModel();
  const { userProfile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [preferredDateTime, setPreferredDateTime] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter appointments for the logged-in patient
  const patientAppointments = useMemo(() => {
    const patientId = userProfile?.patientId || userProfile?.id;
    return Object.values(appointments).filter(appt => appt.patientId === patientId);
  }, [appointments, userProfile]);

  // Separate into Upcoming and Past
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    patientAppointments.forEach((appt) => {
      const apptDate = new Date(appt.time);
      if (apptDate >= now && appt.status !== 'completed' && appt.status !== 'cancelled') {
        upcomingList.push(appt);
      } else {
        pastList.push(appt);
      }
    });

    // Sort upcoming ascending (soonest first)
    upcomingList.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    // Sort past descending (most recent first)
    pastList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return { upcoming: upcomingList, past: pastList };
  }, [patientAppointments]);

  const handleRSVP = async (apptId: string, confirm: boolean) => {
    try {
      const newStatus = confirm ? 'confirmed' : 'cancelled';
      await updateAppointmentStatus(apptId, newStatus);
      
      // Also write an audit log or create clinical team task/message if declined
      if (!confirm) {
        // Send a secure notification/portal message to front desk
        await clinicalService.createMessage({
          senderId: userProfile?.id || 'patient',
          senderName: userProfile?.displayName || 'Patient',
          recipientId: 'front-desk',
          subject: 'Appointment RSVP Decline Notification',
          content: `Patient ${userProfile?.displayName || 'Marcus Everett'} declined their scheduled appointment (${apptId}) and requested cancellation.`,
          timestamp: Date.now(),
          read: false
        });
      }
      
      setSuccessMessage(confirm ? "Appointment RSVP Confirmed!" : "Appointment cancelled successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error updating RSVP status:", err);
    }
  };

  const handleRequestReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppointmentId) return;

    setIsSubmittingReschedule(true);
    try {
      const appt = appointments[rescheduleAppointmentId];
      // Store the reschedule request within the appointment doc or send a secure portal message
      const requestPayload = {
        rescheduleRequested: true,
        rescheduleRequest: {
          requestedAt: new Date().toISOString(),
          reason: rescheduleReason,
          preferredDateTime: preferredDateTime,
          status: 'pending'
        }
      };

      // Since updateAppointmentStatus only updates status field, let's use direct collection or secure messaging to deliver the request
      await clinicalService.createMessage({
        senderId: userProfile?.id || 'patient',
        senderName: userProfile?.displayName || 'Patient',
        recipientId: 'front-desk',
        subject: 'Appointment Rescheduling Request',
        content: `Patient requested rescheduling for appointment on ${new Date(appt.time).toLocaleString()}.\nPreferred date/time: ${preferredDateTime || 'Flexible'}\nReason: ${rescheduleReason}`,
        timestamp: Date.now(),
        read: false
      });

      // Update the appointment status to reflect a pending reschedule
      await updateAppointmentStatus(rescheduleAppointmentId, 'scheduled'); 

      setSuccessMessage("Reschedule request submitted successfully. Our front desk team will contact you shortly.");
      setRescheduleAppointmentId(null);
      setRescheduleReason('');
      setPreferredDateTime('');
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err) {
      console.error("Error submitting reschedule request:", err);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6 font-sans">
      {/* Banner Card */}
      <Card className="border border-sky-100 shadow-sm bg-gradient-to-r from-sky-50/50 via-white to-blue-50/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-full opacity-10 pointer-events-none">
          <Calendar className="w-full h-full text-sky-600 transform translate-x-8 translate-y-2 scale-110" />
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 text-[10px] font-black uppercase tracking-wider rounded-full border border-sky-100">
                <Calendar className="h-3 w-3" />
                <span>Patient Access Center</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">My Consultations & Appointments</h2>
              <p className="text-xs text-slate-500 font-medium max-w-xl">
                Review your upcoming clinic check-ins, join virtual secure telehealth rooms, or submit formal rescheduling directives directly to the Front Desk team.
              </p>
            </div>

            {/* Upcoming / Past Tab Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upcoming' 
                    ? 'bg-[#0078D4] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'past' 
                    ? 'bg-[#0078D4] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Past ({past.length})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold uppercase flex gap-2.5 items-center shadow-xs"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="space-y-4">
        {activeTab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <Card className="border border-dashed border-slate-200 text-center p-12 bg-white rounded-2xl">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No Scheduled Visits</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                You do not have any clinical encounters scheduled at this time. If you require scheduling attention, please contact the front desk or message your care coordinator.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcoming.map((appt) => {
                const isVirtual = appt.visitType === 'telehealth' || appt.visitType === 'virtual';
                const isDeclined = appt.status === 'cancelled';
                const isConfirmed = appt.status === 'confirmed';

                return (
                  <motion.div
                    key={appt.id}
                    layoutId={`appt-${appt.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition.entrance}
                  >
                    <Card className="border border-slate-200 shadow-xs bg-white hover:border-sky-300 transition-all rounded-2xl overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        {/* Time Left Header Panel */}
                        <div className="sm:w-48 bg-slate-50 border-r border-slate-100 p-5 flex flex-col justify-between gap-3 shrink-0">
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Date & Time</span>
                            <div className="text-sm font-black text-slate-800 mt-1 leading-snug">{formatDate(appt.time)}</div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 w-fit">
                            <Clock className="h-3.5 w-3.5 text-sky-600" />
                            <span>{formatTime(appt.time)}</span>
                          </div>
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Badge className={`uppercase text-[9px] font-black tracking-widest h-5 px-2 rounded-md ${
                                isVirtual ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              }`}>
                                {isVirtual ? '💻 Telehealth' : '🏥 Outpatient Clinic'}
                              </Badge>

                              <Badge className={`uppercase text-[9px] font-black tracking-widest h-5 px-2 rounded-md ${
                                appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 
                                appt.status === 'checked_in' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {appt.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 mt-3 tracking-tight">{appt.reason}</h3>
                            
                            {appt.providerId && (
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
                                <User className="h-3.5 w-3.5 text-sky-600" />
                                <span>Assigned Specialist ID: <span className="font-bold text-slate-700 uppercase">{appt.providerId.slice(0, 8)}</span></span>
                              </div>
                            )}
                          </div>

                          {/* Quick Interactive Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                            {/* RSVP Section */}
                            {!isConfirmed && appt.status === 'scheduled' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Please RSVP:</span>
                                <Button 
                                  size="sm" 
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer"
                                  onClick={() => handleRSVP(appt.id, true)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-3 border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer"
                                  onClick={() => handleRSVP(appt.id, false)}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Decline
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                <CheckCircle className="h-4 w-4" />
                                <span>Confirmed Seat</span>
                              </div>
                            )}

                            {/* Telehealth Room Entry or Location */}
                            <div className="flex items-center gap-2">
                              {isVirtual ? (
                                <a 
                                  href={`https://meet.google.com/prm-secure-room-${appt.id}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="h-8 px-4 bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                  <Video className="h-3.5 w-3.5" /> Join Telehealth <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Suite 404, Main Floor</span>
                                </div>
                              )}

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setRescheduleAppointmentId(appt.id)}
                                className="h-8 px-3 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 border-slate-200 rounded-lg cursor-pointer"
                              >
                                Request Reschedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          past.length === 0 ? (
            <Card className="border border-dashed border-slate-200 text-center p-12 bg-white rounded-2xl">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No Consultation History</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                You do not have any past encounters recorded. Past clinic visits, consultation summaries, and notes will appear here once finalized.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {past.map((appt) => {
                const isVirtual = appt.visitType === 'telehealth' || appt.visitType === 'virtual';
                return (
                  <motion.div
                    key={appt.id}
                    layoutId={`appt-${appt.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition.entrance}
                  >
                    <Card className="border border-slate-150 shadow-xs bg-white/85 hover:bg-white transition-colors rounded-2xl">
                      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 shrink-0">
                            {isVirtual ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">{appt.reason}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                              <span>{formatDate(appt.time)}</span>
                              <span>•</span>
                              <span>{formatTime(appt.time)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold uppercase text-[9px]">
                            {appt.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Rescheduling Dialog Request Form */}
      {rescheduleAppointmentId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Request Rescheduling</h3>
                <p className="text-[11px] text-slate-500 font-medium">Your request will be delivered to our Front Desk staff immediately.</p>
              </div>
            </div>

            <form onSubmit={handleRequestReschedule} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Preferred Date & Time</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Next Tuesday morning, or June 14th around 2pm"
                  value={preferredDateTime}
                  onChange={(e) => setPreferredDateTime(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reason for Rescheduling</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Please state the clinical or personal reasons requiring the appointment shift..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50 justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setRescheduleAppointmentId(null)}
                  className="rounded-xl h-10 px-4 font-bold uppercase text-[10px] border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingReschedule}
                  className="rounded-xl h-10 px-5 bg-[#0078D4] hover:bg-[#005A9E] text-white font-black uppercase text-[10px] tracking-wider shadow-sm flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmittingReschedule ? 'SUBMITTING...' : 'SUBMIT DIRECTIVE'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default PatientAppointmentsView;
