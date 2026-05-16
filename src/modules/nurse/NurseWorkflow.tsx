import { useQueryModel, useCommandDispatcher } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Activity, Users, Clock, CheckCircle2, UserPlus, 
  Search, Filter, ChevronRight, AlertCircle, TrendingUp,
  ClipboardCheck, Thermometer, Heart, Wind, Droplets
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../lib/motion';
import { UpdateVitalsModal } from '../clinical/UpdateVitalsModal';
import { updatePatientStatus } from '../../services/clinicalFirestoreService';

export function NurseWorkflow() {
  const { patients, vitals, appointments } = useQueryModel();
  const dispatch = useCommandDispatcher();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  // Filter patients in 'triage' status or with today's appointments but no recent vitals
  const triageQueue = useMemo(() => {
    const allPatients = Object.values(patients);
    return allPatients.filter(patient => {
      // Rule 1: Explicit triage status
      if (patient.status === 'triage') return true;
      
      // Rule 2: Has appointment today but no vitals in last 4 hours
      const hasApptToday = Object.values(appointments).some(a => 
        a.patientId === patient.id && 
        new Date(a.time).toDateString() === new Date().toDateString()
      );
      
      if (hasApptToday) {
        const patientVitals = vitals[patient.id] || [];
        const lastVital = patientVitals[patientVitals.length - 1];
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
        if (!lastVital || lastVital.timestamp < fourHoursAgo) return true;
      }

      return false;
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patients, vitals, appointments, searchTerm]);

  const handleCompleteTriage = async (patientId: string) => {
    try {
      await updatePatientStatus(patientId, 'active');
      dispatch({
        type: 'PATIENT_REGISTERED', // Using this to trigger read-model update as well
        payload: { ...patients[patientId], status: 'active' }
      });
    } catch (error) {
      console.error("Failed to complete triage:", error);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#242424] flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-[#0078D4]" />
            Clinical Operations Center
          </h1>
          <p className="text-[11px] font-bold text-[#616161] uppercase tracking-[0.15em] opacity-60">Nurse Workflow & Triage Desk</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A19F9D] group-focus-within:text-[#0078D4] transition-colors" />
            <input 
              type="text"
              placeholder="Search queue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#EDEBE9] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4] transition-all w-64 shadow-sm"
            />
          </div>
          <Button variant="outline" className="rounded-xl border-[#EDEBE9] shadow-sm flex gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold font-sans">Filters</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Triage Queue List */}
        <Card className="lg:col-span-4 border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
          <CardHeader className="bg-[#FAFAFA] border-b border-[#EDEBE9] py-3 px-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#242424] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0078D4]" />
                Triage Queue
              </CardTitle>
              <Badge className="bg-[#0078D4] text-white border-none rounded-full px-2 py-0.5 text-[10px] font-black">
                {triageQueue.length} PENDING
              </Badge>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-[#F3F2F1]">
              {triageQueue.length > 0 ? triageQueue.map((patient) => (
                <div 
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`p-4 cursor-pointer transition-all hover:bg-[#F3F9FD] group ${selectedPatientId === patient.id ? 'bg-[#F3F9FD] border-l-4 border-l-[#0078D4]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[13px] font-black text-[#242424] leading-tight group-hover:text-[#0078D4] transition-colors">
                        {patient.name}
                      </h3>
                      <p className="text-[10px] text-[#616161] font-bold uppercase tracking-tight opacity-60">MRN: {patient.mrn}</p>
                    </div>
                    <Badge className={`${patient.status === 'triage' ? 'bg-[#FFF4CE] text-[#845701]' : 'bg-[#DFF6DD] text-[#107C10]'} border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm shrink-0`}>
                      {patient.status === 'triage' ? 'Waiting' : 'Follow-up'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-[9px] font-black text-[#616161] uppercase tracking-tighter">
                      <Clock className="h-3 w-3" />
                      Wait: 12m
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-[#D13438] uppercase tracking-tighter">
                      <Activity className="h-3 w-3" />
                      Priority: Normal
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-64 flex flex-col items-center justify-center text-[#A19F9D] p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Queue Clear</p>
                  <p className="text-[10px] mt-1">No patients currently awaiting triage.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Work Area */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          <AnimatePresence mode="wait">
            {selectedPatientId ? (
              <motion.div 
                key={selectedPatientId}
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={transition.entrance}
                className="flex-1 flex flex-col gap-4 min-h-0"
              >
                {/* Patient Header Summary */}
                <Card className="border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white shrink-0">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-xl bg-[#F3F2F1] flex items-center justify-center border border-[#EDEBE9]">
                        <Users className="h-7 w-7 text-[#A19F9D]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#242424] tracking-tight">{patients[selectedPatientId].name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-[#616161]">{patients[selectedPatientId].age}y · {patients[selectedPatientId].sex}</span>
                          <span className="h-1 w-1 rounded-full bg-[#EDEBE9]" />
                          <span className="text-[10px] font-black text-[#0078D4] uppercase tracking-widest">Awaiting Triage Vitals</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-[#EDEBE9] text-[#242424] font-bold text-xs"
                        onClick={() => setSelectedPatientId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs shadow-md shadow-[#0078D4]/20"
                        onClick={() => handleCompleteTriage(selectedPatientId)}
                      >
                        Complete Triage
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Triage Action Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                  {/* Action Item: Capture Vitals */}
                  <Card className="border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col group hover:border-[#0078D4]/50 transition-all cursor-pointer" onClick={() => setIsVitalsModalOpen(true)}>
                    <CardHeader className="py-4 border-b border-[#F3F2F1] bg-[#F3F9FD]/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0078D4]">Primary Action</CardTitle>
                        <TrendingUp className="h-4 w-4 text-[#0078D4]" />
                      </div>
                      <h3 className="text-lg font-black text-[#242424] mt-2">Record Triage Vitals</h3>
                      <p className="text-[10px] text-[#616161] font-bold leading-tight mt-1">Immediate capture of heart rate, blood pressure, SPO2, and temperature required.</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                      <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
                        <div className="flex flex-col items-center p-3 rounded-xl bg-[#F3F2F1] border border-[#EDEBE9] group-hover:bg-[#DEECF9] group-hover:border-[#0078D4]/20 transition-all">
                          <Heart className="h-4 w-4 text-[#D13438] mb-1" />
                          <span className="text-[10px] font-black uppercase opacity-60">Pulse</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-[#F3F2F1] border border-[#EDEBE9] group-hover:bg-[#DEECF9] group-hover:border-[#0078D4]/20 transition-all">
                          <Wind className="h-4 w-4 text-[#107C10] mb-1" />
                          <span className="text-[10px] font-black uppercase opacity-60">Resp</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-[#F3F2F1] border border-[#EDEBE9] group-hover:bg-[#DEECF9] group-hover:border-[#0078D4]/20 transition-all">
                          <Thermometer className="h-4 w-4 text-[#845701] mb-1" />
                          <span className="text-[10px] font-black uppercase opacity-60">Temp</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-[#F3F2F1] border border-[#EDEBE9] group-hover:bg-[#DEECF9] group-hover:border-[#0078D4]/20 transition-all">
                          <Droplets className="h-4 w-4 text-[#0078D4] mb-1" />
                          <span className="text-[10px] font-black uppercase opacity-60">SPO2</span>
                        </div>
                      </div>
                      <Button className="w-full max-w-[200px] rounded-xl bg-[#0078D4]/10 text-[#0078D4] hover:bg-[#0078D4] hover:text-white font-bold transition-all mt-4 border border-[#0078D4]/20">
                        Launch Vitals Modal
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Secondary Actions */}
                  <div className="flex flex-col gap-4 min-h-0">
                    <Card className="border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white">
                      <CardHeader className="py-3 border-b border-[#F3F2F1]">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#616161]">Clinical Checklist</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {[
                          { id: 'id-v', label: 'Verify Patient ID & Photo', done: true },
                          { id: 'al-v', label: 'Confirm Allergy Profile', done: false },
                          { id: 'hx-v', label: 'Medication Reconciliation Scan', done: false },
                          { id: 'wn-v', label: 'Assign Exam Room (Room 4)', done: false },
                        ].map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FAFAFA] cursor-pointer">
                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${item.done ? 'bg-[#107C10] border-[#107C10]' : 'border-[#EDEBE9]'}`}>
                              {item.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-xs font-bold ${item.done ? 'text-[#616161] line-through opacity-50' : 'text-[#242424]'}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-[#FAFAFA] border-dashed flex-1">
                      <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Lab Results Pending</span>
                        <p className="text-[9px] mt-1">No outstanding lab directives for this staging phase.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FAFAFA]/30 rounded-3xl border-2 border-dashed border-[#EDEBE9]"
              >
                <div className="h-20 w-20 rounded-full bg-white border border-[#EDEBE9] flex items-center justify-center mb-6 shadow-sm">
                  <UserPlus className="h-10 w-10 text-[#0078D4] opacity-20" />
                </div>
                <h3 className="text-xl font-black text-[#242424] tracking-tight">Select Patient for Triage</h3>
                <p className="text-[11px] font-bold text-[#616161] uppercase tracking-widest max-w-[280px] text-center mt-2 opacity-60">
                  Choose a patient from the queue to start their clinical intake and vitals capture.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedPatientId && (
        <UpdateVitalsModal 
          isOpen={isVitalsModalOpen}
          onClose={() => setIsVitalsModalOpen(false)}
          patientId={selectedPatientId}
        />
      )}
    </div>
  );
}
