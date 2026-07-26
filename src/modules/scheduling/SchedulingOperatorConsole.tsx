import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Calendar, Clock, Video, MapPin, User, CheckCircle, 
  XCircle, AlertCircle, Sparkles, ChevronRight, Filter, 
  Search, Users, Activity, HelpCircle, ArrowRight, CheckCircle2,
  CalendarDays, UserCheck, ShieldAlert, Ban, RefreshCcw, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryModel } from '../../store/eventStore';
import { transition } from '../../lib/motion';
import { updateAppointmentStatus, subscribeToCollection, clinicalService } from '../../services/clinicalFirestoreService';
import { AppointmentSchedulingAgentPanel } from './AppointmentSchedulingAgentPanel';

export function SchedulingOperatorConsole() {
  const { appointments, patients } = useQueryModel();
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('users', (data) => {
      setProviders(data.filter((u: any) => ['clinician', 'nurse', 'allied_health', 'admin'].includes(u.role)));
    });
    return unsub;
  }, []);

  const clinicians = providers;

  // Unified roster query & filtering
  const filteredRoster = useMemo(() => {
    return Object.values(appointments)
      .filter((appt) => {
        // 1. Date Filter
        const apptDate = new Date(appt.time).toISOString().split('T')[0];
        const matchesDate = apptDate === selectedDate;

        // 2. Provider Filter
        const matchesProvider = selectedProvider === 'all' || appt.providerId === selectedProvider;

        // 3. Status Filter
        const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;

        // 4. Search term (Patient name or reason)
        const patientName = patients[appt.patientId]?.name || 'Patient';
        const matchesSearch = searchTerm === '' || 
          patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appt.id.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesDate && matchesProvider && matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [appointments, selectedDate, selectedProvider, statusFilter, searchTerm, patients]);

  // Live status counts for the selected date
  const statusCounts = useMemo(() => {
    const counts = {
      total: 0,
      scheduled: 0,
      confirmed: 0,
      checked_in: 0,
      in_progress: 0,
      cancelled: 0,
      completed: 0,
    };

    Object.values(appointments).forEach((appt) => {
      const apptDate = new Date(appt.time).toISOString().split('T')[0];
      if (apptDate === selectedDate) {
        counts.total++;
        if (appt.status in counts) {
          counts[appt.status as keyof typeof counts]++;
        }
      }
    });

    return counts;
  }, [appointments, selectedDate]);

  const handleUpdateStatus = async (apptId: string, nextStatus: string) => {
    try {
      await updateAppointmentStatus(apptId, nextStatus);
      setSuccessMessage(`Appointment status set to ${nextStatus.replace('_', ' ')}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error setting appointment status:", err);
    }
  };

  const getProviderName = (providerId: string) => {
    const user = providers.find((u: any) => u.id === providerId || u.userId === providerId);
    return user ? (user.name || user.displayName || 'Clinical Specialist') : 'Unassigned';
  };

  return (
    <div className="space-y-6 h-full p-6 bg-slate-50/50 font-sans overflow-y-auto">
      {/* Banner / Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="h-7 w-7 text-[#0078D4]" />
            Scheduling Operator Console
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time monitoring panel and control center for managing patient check-ins, tele-consultation sessions, and provider schedules.
          </p>
        </div>

        {/* Date Selector and Search Input */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowAgent(!showAgent)}
            className={`rounded-xl h-10 px-4 font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              showAgent 
                ? 'bg-slate-900 text-white hover:bg-black' 
                : 'bg-gradient-to-r from-indigo-600 to-[#0078D4] text-white hover:opacity-95'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>{showAgent ? 'Close Agent' : 'AI Scheduling Agent'}</span>
          </Button>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/10 shadow-xs"
            />
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              type="text"
              placeholder="SEARCH PATIENT NAME OR REASON..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-xs font-bold uppercase placeholder:text-slate-400 focus:ring-[#0078D4]/10 shadow-xs"
            />
          </div>
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

      {/* Roster Live Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'ALL ENCOUNTERS', count: statusCounts.total, color: 'bg-slate-100 text-slate-800' },
          { label: 'AWAITING RSVP', count: statusCounts.scheduled, color: 'bg-amber-50 text-amber-800 border-amber-100' },
          { label: 'CONFIRMED', count: statusCounts.confirmed, color: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
          { label: 'CHECKED IN', count: statusCounts.checked_in, color: 'bg-blue-50 text-blue-800 border-blue-100' },
          { label: 'IN PROGRESS', count: statusCounts.in_progress, color: 'bg-purple-50 text-purple-800 border-purple-100' },
          { label: 'COMPLETED', count: statusCounts.completed, color: 'bg-teal-50 text-teal-800 border-teal-100' },
          { label: 'DECLINED / CANCELLED', count: statusCounts.cancelled, color: 'bg-rose-50 text-rose-800 border-rose-100' },
        ].map((metric, i) => (
          <Card key={i} className="border border-slate-150 shadow-xs bg-white text-center">
            <CardContent className="p-3.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">{metric.label}</span>
              <span className="text-2xl font-black text-slate-800 mt-1.5 block">{metric.count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roster Table List */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-150 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-black uppercase text-slate-800 tracking-wider">Clinical Day Roster</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium">Filtered clinical encounters for the current operator shift.</CardDescription>
          </div>

          {/* Table Level Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['all', 'confirmed', 'checked_in', 'in_progress', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    statusFilter === st 
                      ? 'bg-white text-[#0078D4] shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Provider Filter */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 outline-none focus:border-[#0078D4]"
            >
              <option value="all">ALL PROVIDERS</option>
              {clinicians.map((c: any) => (
                <option key={c.id || c.userId} value={c.id || c.userId}>{(c.name || c.displayName || 'Clinician').toUpperCase()}</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-emerald-50 border-b border-emerald-150 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredRoster.length === 0 ? (
            <div className="text-center p-20">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No Matching Encounters</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                There are no patient encounters listed on this date matching the current filter configurations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-150">
              {filteredRoster.map((appt, idx) => {
                const patient = patients[appt.patientId];
                const patientName = patient ? (patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`).trim() : `MRN: ${appt.patientId}`;
                const isVirtual = appt.visitType === 'telehealth' || appt.visitType === 'virtual';

                return (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Time & Patient Detail */}
                    <div className="flex items-start gap-5 min-w-0 flex-1">
                      {/* Time Column */}
                      <div className="w-20 text-center shrink-0 border-r border-slate-150 pr-5">
                        <span className="text-base font-black text-slate-800 block">
                          {new Date(appt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">30 Min</span>
                      </div>

                      {/* Patient metadata */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight hover:text-[#0078D4] cursor-pointer">
                            {patientName}
                          </h4>
                          <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-500 h-5 px-1.5">
                            MRN: {patient?.mrn || 'TBD'}
                          </Badge>
                          {isVirtual ? (
                            <Badge className="bg-sky-50 text-sky-700 border-sky-100 text-[8px] font-black tracking-wider uppercase h-5">Virtual / Tele</Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100 text-[8px] font-black tracking-wider uppercase h-5">Physical / Clinic</Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">{appt.reason}</p>

                        {/* Provider assigned & room details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            Provider: <span className="text-slate-600">{getProviderName(appt.providerId)}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            Encounter Room: <span className="text-slate-600">{appt.roomId || 'Not assigned'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Roster Live Status & Action Controls */}
                    <div className="flex flex-wrap items-center gap-6 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                      {/* Live status badge */}
                      <div className="space-y-1 text-left lg:text-right">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Live Status</span>
                        <Badge className={`uppercase text-[9px] font-black tracking-widest h-6 px-3 rounded-md ${
                          appt.status === 'scheduled' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                          appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          appt.status === 'checked_in' ? 'bg-blue-50 text-blue-800 border-blue-100 animate-pulse' :
                          appt.status === 'in_progress' ? 'bg-purple-50 text-purple-800 border-purple-100' :
                          appt.status === 'completed' ? 'bg-teal-50 text-teal-800 border-teal-100' :
                          'bg-rose-50 text-rose-800 border-rose-100'
                        }`}>
                          {appt.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Controls workflow actions */}
                      <div className="flex items-center gap-2">
                        {appt.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider h-8 rounded-lg cursor-pointer"
                            onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                          >
                            Confirm Seat
                          </Button>
                        )}

                        {appt.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider h-8 rounded-lg cursor-pointer"
                            onClick={() => handleUpdateStatus(appt.id, 'checked_in')}
                          >
                            Check In
                          </Button>
                        )}

                        {appt.status === 'checked_in' && (
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] uppercase tracking-wider h-8 rounded-lg cursor-pointer"
                            onClick={() => handleUpdateStatus(appt.id, 'in_progress')}
                          >
                            Start Exam
                          </Button>
                        )}

                        {appt.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] uppercase tracking-wider h-8 rounded-lg cursor-pointer"
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                          >
                            Complete Visit
                          </Button>
                        )}

                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider h-8 rounded-lg cursor-pointer"
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                          >
                            Decline
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SchedulingOperatorConsole;
