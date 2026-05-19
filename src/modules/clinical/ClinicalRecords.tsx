import { useQueryModel } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Settings2, LayoutDashboard, ShieldAlert, Lock, UserCheck, Stethoscope, UserPlus, Clock, ChevronRight, AlertCircle, Network, HardDrive, Workflow, Pill, Microscope, Activity, FileText, User } from 'lucide-react';
import { HealthConnectManager } from './HealthConnectManager';
import { KnowledgeGraph } from './KnowledgeGraph';
import { Button } from '../../components/ui/button';
import { SOAPNoteModal } from './SOAPNoteModal';
import { PrescriptionPadModal } from './PrescriptionPadModal';
import { InvestigationOrderModal } from './investigations/InvestigationOrderModal';
import { NewProcedureModal } from './NewProcedureModal';
import { NewReferralModal } from './NewReferralModal';
import { InvestigationWorkflow } from './investigations/InvestigationWorkflow';
import { ProceduresList } from './ProceduresList';
import { ReferralsList } from './ReferralsList';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { VitalsCard } from './VitalsCard';
import { InteractionEntryModal } from './InteractionEntryModal';
import { ClinicalTimelineCard } from './ClinicalTimelineCard';
import { CareTeamManager } from './CareTeamManager';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '../../components/ui/dialog';
import { CareEcosystem } from './CareEcosystem';
import { UpcomingAppointments } from './UpcomingAppointments';
import { PatientNotesFeed } from './PatientNotesFeed';
import { MedicationCenter } from './MedicationCenter';
import { motion } from 'motion/react';
import { transition } from '../../lib/motion';
import { useState, useMemo, useEffect } from 'react';
import { useHIPAAMonitor } from '../../hooks/useHIPAAMonitor';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export function ClinicalRecords({ 
  patientId, 
  onBack, 
  showBackButton 
}: { 
  patientId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}) {
  const { patients, vitals, clinicalIntakes } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);
  const { userProfile } = useCurrentUser();
  
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isCareEcosystemModalOpen, setIsCareEcosystemModalOpen] = useState(false);
  const [isHealthConnectModalOpen, setIsHealthConnectModalOpen] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isPrescriptionPadOpen, setIsPrescriptionPadOpen] = useState(false);
  const { logAccess } = useHIPAAMonitor();
  const [activeTab, setActiveTab] = useState('overview');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  // Authorization Check
  const myAccess = useMemo(() => {
    if (!userProfile) return null;
    
    // TEMPORARY: Grant full clinical access to all Clinicians and Admins
    if (userProfile.role === 'admin' || userProfile.role === 'clinician') {
      return { accessLevel: 'clinical_full' as const, role: userProfile.role };
    }
    
    const membership = clinicalData.care_teams.find(m => m.userId === userProfile.id);
    if (!membership) return null;
    
    return { accessLevel: membership.accessLevel, role: membership.userRole };
  }, [clinicalData.care_teams, userProfile]);

  const canReadClinical = myAccess?.accessLevel === 'clinical_full' || myAccess?.accessLevel === 'clinical_limited' || userProfile?.role === 'patient' || userProfile?.role === 'allied_health';
  const canWriteClinical = (myAccess?.accessLevel === 'clinical_full' || userProfile?.role === 'nurse' || userProfile?.role === 'allied_health') && userProfile?.role !== 'patient';
  const isAuthorized = !!myAccess || userProfile?.role === 'admin' || userProfile?.role === 'patient' || userProfile?.role === 'allied_health';

  useEffect(() => {
    if (patientId && isAuthorized) {
      logAccess('VIEW_CLINICAL_PROFILE', 'Patient', patientId);
    }
  }, [patientId, isAuthorized]);
  
  const localPatient = patients ? patients[patientId] : undefined;
  
  const patient = useMemo(() => {
    const firestorePatient = clinicalData.patient;
    const merged = { ...(localPatient || {}) };
    
    if (firestorePatient) {
      // Overwrite local data with firestore data only if firestore has a value
      Object.keys(firestorePatient).forEach(key => {
        const val = firestorePatient[key];
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            // Only overwrite array if not empty
            if (val.length > 0) {
              merged[key] = val;
            }
          } else if (val !== '' && val !== 0) {
            merged[key] = val;
          }
        }
      });
    }
    
    // Ensure ID is set
    if (!merged.id) merged.id = patientId;
    
    return merged;
  }, [localPatient, clinicalData.patient, patientId]);

  const localVitals = (vitals && vitals[patientId]) || [];
  
  // Merge vitals: prioritize firestore if available, merge with local for immediate feedback
  const mergedAllVitals = useMemo(() => {
    const firestoreVitalsMapped = (clinicalData.vitals as any[]).map(v => ({
      ...v,
      // Use 0 as stable fallback for pending server timestamps, but avoid Date.now() in memo
      timestamp: v.createdAt?.seconds ? v.createdAt.seconds * 1000 : (v.timestamp || 0)
    }));

    const vitalsMap = new Map();
    
    // Process local first
    localVitals.forEach(v => {
      if (v.timestamp) vitalsMap.set(v.timestamp, v);
    });
    
    // Process firestore
    firestoreVitalsMapped.forEach(v => {
      // Find matching timestamp or id
      const ts = v.timestamp;
      if (ts) vitalsMap.set(ts, v);
    });

    return Array.from(vitalsMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [clinicalData.vitals, localVitals]);

  const patientVitals = mergedAllVitals;
  const intake = clinicalData.clinical_intakes[0] || (clinicalIntakes ? clinicalIntakes[patientId] : undefined);
  const latestVitals = patientVitals[patientVitals.length - 1];

  const mappedMedications = useMemo(() => {
    const list = clinicalData.prescriptions.map((px: any) => ({
      id: px.id,
      name: px.medicationName,
      dosage: px.dosage,
      frequency: px.frequency,
      status: px.status || 'active',
      prescribedDate: px.createdAt ? new Date(px.createdAt.seconds * 1000).toLocaleDateString() : 'Just now',
      indication: px.indication || '',
      authorName: px.authorName,
      adherenceStatus: px.adherenceStatus,
      adherenceScore: px.adherenceScore,
      ePrescriptionStatus: px.ePrescriptionStatus
    }));

    return list;
  }, [clinicalData.prescriptions]);

  const renderMedicationsCard = (expanded = false) => (
    <Card className={`flex flex-col border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white ${expanded ? 'h-[350px]' : 'h-full'}`}>
      <CardHeader className="py-1.5 px-2 border-b border-[#F3F2F1] bg-white flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-[12px] font-bold text-[#242424] flex items-center gap-2 uppercase tracking-widest opacity-80">
          <Pill className="h-3.5 w-3.5 text-[#107C10]" />
          Current Medications
        </CardTitle>
        <div className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest bg-[#F3F2F1] px-2 py-0.5 rounded">
          {clinicalData.prescriptions.length} Active
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-0">
          {clinicalData.prescriptions.length > 0 ? (
            <div className="divide-y divide-[#F3F2F1]">
              {clinicalData.prescriptions.map((px: any, i: number) => (
                <div key={i} className="px-2 py-2 hover:bg-[#F3F9FD] transition-all group pointer-events-auto cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-[11px] font-bold text-[#242424] group-hover:text-[#0078D4] transition-colors leading-tight">{px.medicationName}</h4>
                      <p className="text-[10px] text-[#616161] font-medium">{px.dosage}, {px.frequency}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm">Active</Badge>
                        <span className="text-[9px] text-[#A19F9D] font-medium tracking-tight">Prescribed: {px.createdAt ? new Date(px.createdAt?.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#BDBDBD] hover:text-[#0078D4]">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center opacity-40">
              <Pill className="h-8 w-8 text-[#616161] mb-2" />
              <p className="text-[10px] font-black text-[#242424] uppercase tracking-widest">No medications recorded</p>
              <p className="text-[10px] text-[#616161] font-medium mt-1">Start a new prescription to track patient baseline.</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 bg-[#FAFAFA] border-t border-[#EDEBE9] text-center shrink-0">
        {clinicalData.prescriptions.length > 0 ? (
          <Button 
            variant="link" 
            onClick={() => setActiveTab('medications')}
            className="text-[11px] font-bold text-[#0078D4] h-auto p-0 uppercase tracking-widest"
          >
            View Full Medication List
          </Button>
        ) : canWriteClinical ? (
          <Button 
            variant="link" 
            onClick={() => setIsPrescriptionPadOpen(true)}
            className="text-[11px] font-bold text-[#107C10] h-auto p-0 uppercase tracking-widest"
          >
            Issue First Prescription
          </Button>
        ) : (
          <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest">No active medications</p>
        )}
      </div>
    </Card>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,  
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: transition.entrance
    }
  };

  if (!isAuthorized && !clinicalData.loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-dashed border-[#EDEBE9] bg-white shadow-xl rounded-[24px] p-8 text-center space-y-6">
          <div className="h-20 w-20 bg-[#FDE7E9] rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-10 w-10 text-[#A4262C]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#242424] uppercase tracking-tighter">Access Restricted</h2>
            <p className="text-xs text-[#616161] font-medium leading-relaxed">
              Your professional account ({userProfile?.role.toUpperCase()}) does not have an active assignment to this patient's care team. HIPAA compliance requires explicit relationship mapping for clinical data access.
            </p>
          </div>
          
          <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#F3F2F1] text-left space-y-3">
             <div className="flex items-center gap-3">
               <div className="h-6 w-6 rounded-md bg-[#DEECF9] flex items-center justify-center">
                 <Lock className="h-3.5 w-3.5 text-[#0078D4]" />
               </div>
               <span className="text-[10px] font-black uppercase text-[#616161] tracking-widest">Encrypted Tier: PII/PHI-4</span>
             </div>
             <p className="text-[9px] text-[#A19F9D] font-bold italic uppercase">Contact the Chief Medical Officer or Clinical Admin to request care team assignment.</p>
          </div>

          <Button onClick={onBack} className="w-full h-11 bg-[#242424] hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[11px]">
            Return to Registry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-full space-y-4"
    >
      {/* Top Controls - Sync Status & Customize */}
      <div className="flex items-center justify-end px-2 mb-2 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditingLayout(!isEditingLayout)}
          className={`h-7 px-3 rounded-full flex items-center gap-1.5 transition-all ${
            isEditingLayout 
              ? 'bg-[#107C10] text-white hover:bg-[#0b5e0b]' 
              : 'bg-white border border-[#EDEBE9] text-[#757370] hover:bg-[#F3F2F1]'
          }`}
        >
          <Settings2 className={`h-3 w-3 ${isEditingLayout ? 'text-white' : 'text-[#757370]'}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">
            {isEditingLayout ? 'Save Layout' : 'Customize Layout'}
          </span>
        </Button>

        <button 
          onClick={() => setIsHealthConnectModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#F3F9FD] border border-[#DEECF9] rounded-full scale-90 origin-right cursor-pointer hover:bg-[#DEECF9] transition-colors"
        >
          <div className="h-2 w-2 rounded-full bg-[#107C10] animate-pulse" />
          <div className="text-[10px] font-black text-[#107C10] uppercase tracking-wider">SYNC ACTIVE</div>
        </button>
      </div>

      <InteractionEntryModal 
        patientId={patientId}
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
      />

      <HealthConnectManager 
        patientId={patientId}
        isOpen={isHealthConnectModalOpen}
        onClose={() => setIsHealthConnectModalOpen(false)}
      />

      <PrescriptionPadModal 
        isOpen={isPrescriptionPadOpen}
        onClose={() => setIsPrescriptionPadOpen(false)}
        patientId={patientId}
        patientName={patient?.name || 'Patient'}
        canWrite={canWriteClinical}
      />

      <div className="grid grid-cols-1 xl:grid-cols-8 gap-3 flex-1 min-h-0">
        {/* LEFT: Patient Detail Card (Fixed Sidebar) */}
        {!isNotesExpanded && (
          <div className="xl:col-span-2 flex flex-col min-h-0 relative group">
            {isEditingLayout && (
              <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/20 rounded-lg z-10 pointer-events-none animate-pulse" />
            )}
            <motion.div variants={itemVariants} className="flex-1">
              <Card className={`h-full border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white transition-all ${isEditingLayout ? 'scale-[0.98] ring-2 ring-primary/20' : ''}`}>
                  <div className="p-4 xl:p-6">
                    <div className="flex items-start gap-5 mb-8">
                      <div className="h-20 w-20 rounded-2xl bg-[#F3F3F3] border border-[#EDEBE9] shadow-sm overflow-hidden shrink-0">
                        {patient?.id === 'p-1' || patient?.id === 'p-2' ? (
                          <img 
                            src={patient?.id === 'p-1' 
                              ? "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop" 
                              : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                            } 
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#F3F2F1]">
                            <User className="h-8 w-8 text-[#A19F9D]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-h-0 min-w-0 pt-1">
                        <h1 className="text-3xl font-black tracking-tight text-[#242424] leading-[0.9] mb-3">{patient?.name}</h1>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#616161] font-black uppercase tracking-widest leading-none mb-1">Age</span>
                            <span className="text-sm font-bold text-[#242424]">{patient?.age}y ({patient?.sex})</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#616161] font-black uppercase tracking-widest leading-none mb-1">Blood Type</span>
                            <span className="text-sm font-bold text-[#D13438]">{patient?.bloodType || 'A+'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
  
                    <div className="space-y-8">
                      <div className="p-4 rounded-xl border border-[#FBC6CC] bg-[#FDE7E9]/30">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-[#A4262C]" />
                          <span className="text-[11px] font-black text-[#A4262C] uppercase tracking-widest">Severe Allergies</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(intake?.allergies || 'NONE REPORTED').split(',').map((allergy, idx) => (
                            <Badge key={idx} className="bg-[#A4262C] text-white border-none text-[10px] uppercase font-black py-1 px-3 rounded-lg shadow-sm">
                              {allergy.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
  
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-[#616161] uppercase tracking-widest">Ongoing Conditions</span>
                          <Badge variant="outline" className="text-[10px] bg-[#F3F2F1] border-none text-[#616161] font-black px-3 py-1 rounded-full">ACTIVE</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(patient?.conditions || []).map((condition, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-[#DEECF9] text-[#005A9E] border-none rounded-full px-4 py-1.5 text-[11px] font-black shadow-sm transition-all hover:bg-[#CFE4FA]">
                              {condition}
                            </Badge>
                          ))}
                          {(!patient?.conditions || patient.conditions.length === 0) && (
                            <span className="text-[11px] text-[#616161] italic">No active conditions.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#FAFAFA] border-t border-[#EDEBE9] p-4 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#616161]" />
                      <span className="text-[11px] text-[#616161] font-medium uppercase tracking-tight">Last Visit: {patient?.lastVisit || '--'}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
          </div>
        )}

        {/* RIGHT: Tabbed Content Area */}
        <div className={`${isNotesExpanded ? 'xl:col-span-8' : 'xl:col-span-6'} flex flex-col min-h-0`}>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
              setIsNotesExpanded(false);
            }} 
            className="flex-1 flex flex-col min-h-0 w-full"
          >
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center">
                <TabsList className="bg-white border border-[#EDEBE9] p-1.5 rounded-2xl shadow-sm h-auto mx-auto border-dashed">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </TabsTrigger>
                  
                  {canReadClinical && (
                    <>
                      <TabsTrigger 
                        value="clinical" 
                        className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                      >
                        <Activity className="h-4 w-4" />
                        Clinical Focus
                      </TabsTrigger>
                      <TabsTrigger 
                        value="medications" 
                        className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                      >
                        <Pill className="h-4 w-4" />
                        Medications
                      </TabsTrigger>
                      <TabsTrigger 
                        value="investigations" 
                        className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                      >
                        <Microscope className="h-4 w-4" />
                        Investigations
                      </TabsTrigger>
                      <TabsTrigger 
                        value="procedures" 
                        className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                      >
                        <Stethoscope className="h-4 w-4" />
                        Procedures
                      </TabsTrigger>
                      {userProfile?.role !== 'nurse' && (
                        <TabsTrigger 
                          value="referrals" 
                          className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Referrals
                        </TabsTrigger>
                      )}
                    </>
                  )}
                  
                  <TabsTrigger 
                    value="insights" 
                    className="data-[state=active]:bg-[#F3F2F1] data-[state=active]:text-[#242424] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2"
                  >
                    <Network className="h-4 w-4" />
                    Insights
                  </TabsTrigger>
                </TabsList>
              </div>

              {canWriteClinical && (
                <div className="flex items-center bg-white border border-[#EDEBE9] rounded-2xl p-1 shadow-sm gap-1 w-fit">
                  <SOAPNoteModal patientId={patientId} canWrite={canWriteClinical}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="SOAP Note">
                      <FileText style={{ color: '#0078D4' }} className="h-5 w-5" />
                    </Button>
                  </SOAPNoteModal>
                  {(userProfile?.role === 'clinician' || userProfile?.role === 'nurse' || userProfile?.role === 'admin') && (
                    <>
                      <div className="w-[1px] h-5 bg-[#EDEBE9]" />
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" 
                          title="Issue Prescription"
                          onClick={() => setIsPrescriptionPadOpen(true)}
                      >
                          <Pill style={{ color: '#107C10' }} className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  <div className="w-[1px] h-5 bg-[#EDEBE9]" />
                  <InvestigationOrderModal patientId={patientId} canWrite={canWriteClinical}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Investigation">
                      <Microscope style={{ color: '#845701' }} className="h-5 w-5" />
                    </Button>
                  </InvestigationOrderModal>
                  {(userProfile?.role === 'clinician' || userProfile?.role === 'nurse' || userProfile?.role === 'admin') && (
                    <>
                      <div className="w-[1px] h-5 bg-[#EDEBE9]" />
                      <NewProcedureModal patientId={patientId} canWrite={canWriteClinical}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Procedure">
                          <Stethoscope style={{ color: '#5C2D91' }} className="h-5 w-5" />
                        </Button>
                      </NewProcedureModal>
                    </>
                  )}
                  {userProfile?.role !== 'nurse' && (
                    <>
                      <div className="w-[1px] h-5 bg-[#EDEBE9]" />
                      <NewReferralModal patientId={patientId} canWrite={canWriteClinical}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Referral">
                          <UserPlus style={{ color: '#A4262C' }} className="h-5 w-5" />
                        </Button>
                      </NewReferralModal>
                    </>
                  )}
                </div>
              )}
            </div>

            <TabsContent value="overview" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-2">
              <div className="grid grid-cols-1 xl:grid-cols-6 gap-3 flex-1 min-h-0">
                {/* MIDDLE COLUMN */}
                <div className="flex flex-col min-h-0 gap-3 xl:col-span-3">
                   <div className="flex-initial min-h-0 transition-all duration-300 relative group">
                      {isEditingLayout && (
                        <div className="absolute -top-2 -left-2 z-20 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <LayoutDashboard className="h-3 w-3" />
                        </div>
                      )}
                      <VitalsCard vitals={patientVitals} patientId={patientId} canWrite={canWriteClinical} />
                   </div>
                   <div 
                      className="flex-1 min-h-[300px] relative group"
                   >
                      {isEditingLayout && (
                        <div className="absolute -top-2 -left-2 z-20 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <LayoutDashboard className="h-3 w-3" />
                        </div>
                      )}
                      <UpcomingAppointments patientId={patientId} />
                   </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col min-h-0 gap-3 xl:col-span-3">
                   <div className="flex-1 min-h-0 relative group">
                      {isEditingLayout && (
                        <div className="absolute -top-2 -left-2 z-20 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <LayoutDashboard className="h-3 w-3" />
                        </div>
                      )}
                      <CareEcosystem patientId={patientId} />
                   </div>
                   <div className="flex-1 min-h-0 relative group">
                      {isEditingLayout && (
                        <div className="absolute -top-2 -left-2 z-20 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <LayoutDashboard className="h-3 w-3" />
                        </div>
                      )}
                      <CareTeamManager patientId={patientId} />
                   </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clinical" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
              <PatientNotesFeed 
                patient={patient} 
                isExpanded={isNotesExpanded}
                onToggleExpand={() => setIsNotesExpanded(!isNotesExpanded)}
                onViewMedications={() => setActiveTab('medications')}
                canWrite={canWriteClinical}
              />
            </TabsContent>

            <TabsContent value="medications" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
              <div className="flex-1 min-h-0">
                <MedicationCenter 
                  patientId={patientId}
                  medications={mappedMedications}
                  conditions={patient?.conditions || []}
                  canWrite={canWriteClinical}
                />
              </div>
            </TabsContent>

            <TabsContent value="investigations" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-2">
               <InvestigationWorkflow 
                 patientId={patientId} 
                 investigations={clinicalData.investigations} 
                 canWrite={canWriteClinical}
               />
            </TabsContent>

            <TabsContent value="procedures" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-2">
               <ProceduresList 
                 patientId={patientId} 
                 procedures={clinicalData.procedures} 
               />
            </TabsContent>

            <TabsContent value="referrals" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-2">
               <ReferralsList 
                 patientId={patientId} 
                 referrals={clinicalData.referrals} 
               />
            </TabsContent>

            <TabsContent value="insights" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-2">
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 flex-1 min-h-0">
                  <motion.div variants={itemVariants} className="xl:col-span-8 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white">
                      <CardHeader className="py-1.5 px-2 border-b border-[#F3F2F1] bg-white flex flex-row items-center justify-between shrink-0">
                        <CardTitle className="text-[12px] font-bold text-[#242424] flex items-center gap-2 uppercase tracking-widest opacity-80">
                          <Network className="h-3.5 w-3.5 text-[#0078D4]" />
                          Interactive Clinical Connectome
                        </CardTitle>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-bold text-[#A19F9D] uppercase tracking-widest bg-[#F3F2F1] px-2 py-0.5 rounded">Real-time Graph</span>
                           <div className="h-5 w-5 flex items-center justify-center">
                              <SyncIcon />
                           </div>
                        </div>
                      </CardHeader>
                      <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA]/30 relative h-[700px]">
                        <KnowledgeGraph 
                          patientId={patientId} 
                          onNodeClick={(nodeId) => {
                            if (nodeId === 'interaction-social_care') {
                              setIsCareEcosystemModalOpen(true);
                            }
                          }}
                        />
                      </div>
                    </Card>
                  </motion.div>
                  
                  <div className="xl:col-span-4 flex flex-col min-h-0">
                    <ScrollArea className="flex-1">
                      <ClinicalTimelineCard records={[
                        ...clinicalData.clinical_records,
                        ...clinicalData.prescriptions,
                        ...clinicalData.procedures
                      ]} />
                    </ScrollArea>
                  </div>
               </div>

               <Dialog open={isCareEcosystemModalOpen} onOpenChange={setIsCareEcosystemModalOpen}>
                  <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden flex flex-col bg-white border-none rounded-2xl shadow-2xl">
                    <DialogHeader className="p-4 border-b border-[#F3F2F1] bg-[#F8F9FA] hidden">
                      <DialogTitle>Care Ecosystem</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 flex flex-col">
                      <CareEcosystem patientId={patientId} />
                    </div>
                  </DialogContent>
               </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.8333 7.00002C12.8333 10.2217 10.2216 12.8334 6.99998 12.8334C3.77832 12.8334 1.16665 10.2217 1.16665 7.00002C1.16665 3.77836 3.77832 1.16669 6.99998 1.16669V3.50002L9.91665 0.583354L6.99998 -2.33331V1.16669" fill="#BDBDBD"/>
    </svg>
  );
}
