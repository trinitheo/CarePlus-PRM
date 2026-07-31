import { useQueryModel, useCommandDispatcher } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Activity, Users, Clock, CheckCircle2, UserPlus, UserCheck,
  Search, Filter, ChevronRight, AlertCircle, TrendingUp,
  ClipboardCheck, Thermometer, Heart, Wind, Droplets, RotateCcw,
  Sparkles, Plus, Check, Briefcase, User
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../lib/motion';
import { UpdateVitalsModal } from '../clinical/UpdateVitalsModal';
import { updatePatientStatus, addToCareTeam, removeFromCareTeam, savePatient } from '../../services/clinicalFirestoreService';
import { beginAsNewlyAddedNurseProfile } from '../../services/nurseService';
import { useCurrentUser } from '../../hooks/useCurrentUser';

type NurseViewTab = 'triage' | 'assigned' | 'all';

export function NurseWorkflow() {
  const { patients, vitals, appointments } = useQueryModel();
  const { userProfile } = useCurrentUser();
  const dispatch = useCommandDispatcher();
  const [activeTab, setActiveTab] = useState<NurseViewTab>('triage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Set of patient IDs assigned to the current nurse
  const [assignedPatientIds, setAssignedPatientIds] = useState<Set<string>>(new Set());

  // Initialize assigned patient IDs based on patient.assignedNurseId or care team
  useEffect(() => {
    if (!userProfile) return;
    const assigned = new Set<string>();
    Object.values(patients).forEach(p => {
      if ((p as any).assignedNurseId === userProfile.id) {
        assigned.add(p.id);
      }
    });
    setAssignedPatientIds(assigned);
  }, [patients, userProfile]);

  const handleResetAndStartNewNurse = async () => {
    if (confirm("This will remove all patient assignments from nurse profiles and start a newly added nurse profile (Nurse Alex Morgan, RN) with a fresh 0-patient roster. Continue?")) {
      setIsResetting(true);
      try {
        await beginAsNewlyAddedNurseProfile();
        window.location.reload();
      } catch (err) {
        console.error("Failed to reset nurse profile:", err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Toggle patient assignment to current nurse's roster
  const handleTogglePatientAssignment = async (patientId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!userProfile) return;

    const isAssigned = assignedPatientIds.has(patientId);
    const patient = patients[patientId];
    if (!patient) return;

    try {
      if (isAssigned) {
        // Remove from care team
        await removeFromCareTeam(patientId, userProfile.id);
        await savePatient(patientId, { ...patient, assignedNurseId: null, assignedNurseName: null });
        setAssignedPatientIds(prev => {
          const next = new Set(prev);
          next.delete(patientId);
          return next;
        });
      } else {
        // Add to care team
        await addToCareTeam(patientId, userProfile.id, {
          role: 'primary_nurse',
          name: userProfile.displayName,
          assignedAt: new Date().toISOString()
        });
        await savePatient(patientId, {
          ...patient,
          assignedNurseId: userProfile.id,
          assignedNurseName: userProfile.displayName
        });
        setAssignedPatientIds(prev => new Set(prev).add(patientId));
      }
    } catch (err) {
      console.error('Failed to update patient assignment:', err);
    }
  };

  // 1. Triage Queue list
  const triageQueue = useMemo(() => {
    const allPatients = Object.values(patients);
    return allPatients.filter(patient => {
      if (patient.status === 'triage') return true;
      
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

  // 2. Assigned Roster list
  const assignedRoster = useMemo(() => {
    return Object.values(patients).filter(patient => {
      const isAssigned = assignedPatientIds.has(patient.id) || (patient as any).assignedNurseId === userProfile?.id;
      return isAssigned && patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [patients, assignedPatientIds, userProfile, searchTerm]);

  // 3. All Clinic Patients list
  const allPatientsList = useMemo(() => {
    return Object.values(patients).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patients, searchTerm]);

  const handleCompleteTriage = async (patientId: string) => {
    try {
      await updatePatientStatus(patientId, 'active');
      dispatch({
        type: 'PATIENT_REGISTERED',
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
          <p className="text-[11px] font-bold text-[#616161] uppercase tracking-[0.15em] opacity-60">
            Nurse Workflow & Patient Roster ({userProfile?.displayName || 'Nurse Alex Morgan, RN'})
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A19F9D] group-focus-within:text-[#0078D4] transition-colors" />
            <input 
              type="text"
              placeholder="Search roster or queue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#EDEBE9] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4] transition-all w-64 shadow-sm"
            />
          </div>

          <Button 
            onClick={handleResetAndStartNewNurse}
            disabled={isResetting}
            className="rounded-xl bg-[#107C10] hover:bg-[#0b5e0b] text-white shadow-sm flex gap-2 text-xs font-bold font-sans"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{isResetting ? "Resetting Nurse Roster..." : "New Nurse Profile (0 Patients)"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Roster & Queue Sidebar */}
        <Card className="lg:col-span-4 border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
          {/* Tab Selector Header */}
          <div className="bg-[#FAFAFA] border-b border-[#EDEBE9] p-2 shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-[#F3F2F1] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('triage')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                  activeTab === 'triage'
                    ? 'bg-white text-[#0078D4] shadow-sm'
                    : 'text-[#616161] hover:text-[#242424]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Triage</span>
                </div>
                <Badge className="mt-1 bg-[#0078D4] text-white text-[8px] h-3.5 px-1.5 py-0 font-bold border-none">
                  {triageQueue.length}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab('assigned')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                  activeTab === 'assigned'
                    ? 'bg-white text-[#107C10] shadow-sm'
                    : 'text-[#616161] hover:text-[#242424]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  <span>My Roster</span>
                </div>
                <Badge className="mt-1 bg-[#107C10] text-white text-[8px] h-3.5 px-1.5 py-0 font-bold border-none">
                  {assignedRoster.length}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-[#242424] shadow-sm'
                    : 'text-[#616161] hover:text-[#242424]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>All Clinic</span>
                </div>
                <Badge className="mt-1 bg-[#616161] text-white text-[8px] h-3.5 px-1.5 py-0 font-bold border-none">
                  {allPatientsList.length}
                </Badge>
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y divide-[#F3F2F1]">
              {/* TAB 1: TRIAGE QUEUE */}
              {activeTab === 'triage' && (
                triageQueue.length > 0 ? triageQueue.map((patient) => (
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
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[9px] font-black text-[#616161] uppercase tracking-tighter">
                          <Clock className="h-3 w-3" />
                          Wait: 12m
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-[#D13438] uppercase tracking-tighter">
                          <Activity className="h-3 w-3" />
                          Priority
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleTogglePatientAssignment(patient.id, e)}
                        className={`text-[9px] font-black h-6 px-2 rounded-lg border flex gap-1 ${
                          assignedPatientIds.has(patient.id)
                            ? 'bg-[#107C10]/10 border-[#107C10]/30 text-[#107C10]'
                            : 'bg-white border-[#EDEBE9] text-[#616161] hover:text-[#0078D4]'
                        }`}
                      >
                        {assignedPatientIds.has(patient.id) ? (
                          <>
                            <Check className="h-3 w-3" />
                            Assigned
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Assign
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="h-64 flex flex-col items-center justify-center text-[#A19F9D] p-8 text-center">
                    <CheckCircle2 className="h-10 w-10 mb-2 opacity-20 text-[#107C10]" />
                    <p className="text-xs font-bold uppercase tracking-widest">Queue Clear</p>
                    <p className="text-[10px] mt-1">No patients currently awaiting triage.</p>
                  </div>
                )
              )}

              {/* TAB 2: MY ASSIGNED ROSTER */}
              {activeTab === 'assigned' && (
                assignedRoster.length > 0 ? assignedRoster.map((patient) => (
                  <div 
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-[#F3F9FD] group ${selectedPatientId === patient.id ? 'bg-[#F3F9FD] border-l-4 border-l-[#107C10]' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-[#107C10]" />
                          <h3 className="text-[13px] font-black text-[#242424] leading-tight group-hover:text-[#107C10] transition-colors">
                            {patient.name}
                          </h3>
                        </div>
                        <p className="text-[10px] text-[#616161] font-bold uppercase tracking-tight opacity-60 mt-0.5">MRN: {patient.mrn}</p>
                      </div>
                      <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm shrink-0">
                        Assigned
                      </Badge>
                    </div>

                    {patient.conditions && patient.conditions.length > 0 && (
                      <div className="text-[10px] text-[#616161] font-bold mt-1 line-clamp-1">
                        Diagnosis: {patient.conditions.join(', ')}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-bold text-[#616161]">
                        Nurse: {userProfile?.displayName || 'Alex Morgan, RN'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleTogglePatientAssignment(patient.id, e)}
                        className="text-[9px] font-bold h-6 px-2 text-[#D13438] hover:bg-[#FDE7E9] rounded-lg"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="h-64 flex flex-col items-center justify-center text-[#A19F9D] p-8 text-center">
                    <UserPlus className="h-10 w-10 mb-2 opacity-20 text-[#0078D4]" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#242424]">Roster Empty (0 Patients)</p>
                    <p className="text-[10px] mt-1 max-w-[200px]">
                      Switch to <strong>All Clinic</strong> tab to assign patients to your roster.
                    </p>
                  </div>
                )
              )}

              {/* TAB 3: ALL CLINIC PATIENTS */}
              {activeTab === 'all' && (
                allPatientsList.length > 0 ? allPatientsList.map((patient) => {
                  const isAssigned = assignedPatientIds.has(patient.id) || (patient as any).assignedNurseId === userProfile?.id;
                  return (
                    <div 
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-4 cursor-pointer transition-all hover:bg-[#FAFAFA] group ${selectedPatientId === patient.id ? 'bg-[#F3F9FD] border-l-4 border-l-[#0078D4]' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-[13px] font-black text-[#242424] leading-tight group-hover:text-[#0078D4] transition-colors">
                            {patient.name}
                          </h3>
                          <p className="text-[10px] text-[#616161] font-bold uppercase tracking-tight opacity-60">MRN: {patient.mrn}</p>
                        </div>
                        <Badge className={`${
                          patient.status === 'triage' 
                            ? 'bg-[#FFF4CE] text-[#845701]' 
                            : isAssigned 
                            ? 'bg-[#DFF6DD] text-[#107C10]' 
                            : 'bg-[#F3F2F1] text-[#616161]'
                        } border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm shrink-0`}>
                          {patient.status === 'triage' ? 'Triage' : isAssigned ? 'Assigned' : 'Unassigned'}
                        </Badge>
                      </div>

                      {patient.conditions && patient.conditions.length > 0 && (
                        <p className="text-[10px] text-[#616161] font-medium line-clamp-1 mb-2">
                          {patient.conditions[0]}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F2F1]">
                        <span className="text-[9px] font-bold text-[#616161]">
                          {(patient as any).assignedNurseName ? `Nurse: ${(patient as any).assignedNurseName}` : 'No Nurse Assigned'}
                        </span>

                        <Button
                          size="sm"
                          onClick={(e) => handleTogglePatientAssignment(patient.id, e)}
                          className={`text-[9px] font-black h-6 px-2.5 rounded-lg border flex gap-1 ${
                            isAssigned
                              ? 'bg-[#107C10] text-white hover:bg-[#0b5e0b] border-none'
                              : 'bg-[#0078D4] text-white hover:bg-[#005A9E] border-none shadow-sm'
                          }`}
                        >
                          {isAssigned ? (
                            <>
                              <Check className="h-3 w-3" />
                              Assigned
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Assign to My Roster
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-64 flex flex-col items-center justify-center text-[#A19F9D] p-8 text-center">
                    <Users className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No Patients Found</p>
                  </div>
                )
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
                        <User className="h-7 w-7 text-[#0078D4]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-[#242424] tracking-tight">{patients[selectedPatientId].name}</h2>
                          {assignedPatientIds.has(selectedPatientId) && (
                            <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[9px] font-black uppercase px-2 py-0.5">
                              On My Roster
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-[#616161]">
                            MRN: {patients[selectedPatientId].mrn} · {patients[selectedPatientId].age || 45}y · {patients[selectedPatientId].sex || 'F'}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-[#EDEBE9]" />
                          <span className="text-[10px] font-black text-[#0078D4] uppercase tracking-widest">
                            {patients[selectedPatientId].status === 'triage' ? 'Awaiting Triage Vitals' : 'Active Patient'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="rounded-xl border-[#EDEBE9] text-[#242424] font-bold text-xs"
                        onClick={(e) => handleTogglePatientAssignment(selectedPatientId, e)}
                      >
                        {assignedPatientIds.has(selectedPatientId) ? 'Remove from My Roster' : 'Assign to My Roster'}
                      </Button>
                      {patients[selectedPatientId].status === 'triage' && (
                        <Button 
                          className="rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs shadow-md shadow-[#0078D4]/20"
                          onClick={() => handleCompleteTriage(selectedPatientId)}
                        >
                          Complete Triage
                        </Button>
                      )}
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
                <h3 className="text-xl font-black text-[#242424] tracking-tight">Select Patient to View Details</h3>
                <p className="text-[11px] font-bold text-[#616161] uppercase tracking-widest max-w-[320px] text-center mt-2 opacity-60">
                  Select a patient from <strong>Triage</strong>, <strong>My Roster</strong>, or <strong>All Clinic</strong> to open their clinical workstation.
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

