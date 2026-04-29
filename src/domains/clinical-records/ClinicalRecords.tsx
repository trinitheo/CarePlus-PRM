import { useQueryModel } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { 
  Activity, Heart, Thermometer, User, DatabaseZap, 
  Share2, ArrowLeft, FileText, Pill, Microscope, 
  Stethoscope, UserPlus, Clock, ChevronRight, AlertCircle,
  Wind, Droplets, Scale, Ruler, Network
} from 'lucide-react';
import { HealthConnectManager } from './HealthConnectManager';
import { KnowledgeGraph } from './KnowledgeGraph';
import { Button } from '../../../components/ui/button';
import { SOAPNoteModal } from './SOAPNoteModal';
import { NewPrescriptionModal } from './NewPrescriptionModal';
import { InvestigationOrderModal } from './InvestigationOrderModal';
import { NewProcedureModal } from './NewProcedureModal';
import { NewReferralModal } from './NewReferralModal';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { VitalsCard } from './VitalsCard';
import { motion } from 'motion/react';

export function ClinicalRecords({ 
  patientId, 
  onBack, 
  showBackButton 
}: { 
  patientId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}) {
  const { patients, vitals, eventLog, clinicalIntakes } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);
  
  const patient = patients[patientId];
  // Merge vitals: prioritize firestore if available and ensure chronological order (ascending)
  const firestoreVitals = (clinicalData.vitals as any[])
    .map(v => ({
      ...v,
      // Handle the transition state where createdAt might be null on the initial local write
      timestamp: v.createdAt?.seconds ? v.createdAt.seconds * 1000 : Date.now()
    }))
    // Ensure oldest -> newest so [length-1] is indeed the latest
    .sort((a, b) => a.timestamp - b.timestamp);

  const patientVitals = firestoreVitals.length > 0 ? firestoreVitals : (vitals[patientId] || []);
  const intake = clinicalIntakes[patientId];
  const latestVitals = patientVitals[patientVitals.length - 1];

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-full space-y-6"
    >
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="rounded-full h-10 w-10 p-0 hover:bg-[#F3F2F1] text-[#616161]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#242424]">{patient?.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="font-mono text-[10px] bg-[#F3F2F1] text-[#616161] border-[#EDEBE9] px-1.5 py-0 rounded-md">
                MRN-{patient?.mrn}
              </Badge>
              <span className="text-xs text-[#616161] font-medium">DOB: {patient?.dob}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#EDEBE9] rounded-xl py-1 px-1 shadow-sm">
            <div className="flex items-center gap-1.5 px-3">
              <div className="h-2 w-2 rounded-full bg-[#107C10]" />
              <div className="text-[11px] font-bold text-[#107C10] uppercase tracking-wider">Sync Active</div>
            </div>
            <div className="h-6 w-[1px] bg-[#EDEBE9] mx-1" />
            <div className="flex items-center p-0.5">
              <SOAPNoteModal patientId={patientId}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="SOAP Note">
                  <FileText style={{ color: '#0078D4' }} className="h-4.5 w-4.5" />
                </Button>
              </SOAPNoteModal>
              <NewPrescriptionModal patientId={patientId}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Prescription">
                  <Pill style={{ color: '#107C10' }} className="h-4.5 w-4.5" />
                </Button>
              </NewPrescriptionModal>
              <InvestigationOrderModal patientId={patientId}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Investigation">
                  <Microscope style={{ color: '#845701' }} className="h-4.5 w-4.5" />
                </Button>
              </InvestigationOrderModal>
              <NewProcedureModal patientId={patientId}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Procedure">
                  <Stethoscope style={{ color: '#5C2D91' }} className="h-4.5 w-4.5" />
                </Button>
              </NewProcedureModal>
              <NewReferralModal patientId={patientId}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#F3F2F1]" title="Referral">
                  <UserPlus style={{ color: '#A4262C' }} className="h-4.5 w-4.5" />
                </Button>
              </NewReferralModal>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* LEFT: Patient Detail Card */}
        <div className="xl:col-span-3 space-y-6 flex flex-col min-h-0">
          <motion.div variants={itemVariants} className="flex-1">
            <Card className="h-full border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white">
              <div className="p-5 xl:p-6">
                <div className="flex items-center gap-5">
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
                        <User className="h-10 w-10 text-[#A19F9D]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-[#242424] leading-none mb-2">{patient?.name}</h1>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#616161] font-bold uppercase tracking-widest">Age</span>
                        <span className="text-xs font-bold text-[#242424]">{patient?.age}y ({patient?.sex})</span>
                      </div>
                      <div className="h-4 w-[1px] bg-[#EDEBE9]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#616161] font-bold uppercase tracking-widest">Blood Type</span>
                        <span className="text-xs font-bold text-[#D13438]">{patient?.bloodType || 'A+'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6">
                  <div className="p-4 rounded-xl border border-[#FBC6CC] bg-[#FDE7E9]/30">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-[#A4262C]" />
                      <span className="text-[11px] font-bold text-[#A4262C] uppercase tracking-widest">Severe Allergies</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(intake?.allergies || 'NONE REPORTED').split(',').map((allergy, idx) => (
                        <Badge key={idx} className="bg-[#A4262C] text-white border-none text-[10px] uppercase font-bold py-1 px-2.5 rounded-lg shadow-sm">
                          {allergy.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#616161] uppercase tracking-widest">Ongoing Conditions</span>
                      <Badge variant="outline" className="text-[9px] bg-[#F3F2F1] border-none text-[#616161] font-bold">ACTIVE</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(patient?.conditions || []).map((condition, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-[#DEECF9] text-[#005A9E] border-none rounded-lg px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all hover:bg-[#CFE4FA]">
                          {condition}
                        </Badge>
                      ))}
                      {(!patient?.conditions || patient.conditions.length === 0) && (
                        <span className="text-xs text-[#616161] italic">No active conditions.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#FAFAFA] border-t border-[#EDEBE9] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#616161]" />
                  <span className="text-[11px] text-[#616161] font-medium uppercase tracking-tight">Last Visit: {patient?.lastVisit || '--'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#616161] font-bold uppercase">Full Code</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* MIDDLE: Vitals & Medications */}
        <div className="xl:col-span-6 space-y-6 flex flex-col min-h-0">
          <motion.div variants={itemVariants} className="shrink-0">
            <VitalsCard vitals={patientVitals} patientId={patientId} />
          </motion.div>

          <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col">
            <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="py-4 px-6 border-b border-[#F3F2F1] bg-white flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-sm font-bold text-[#242424] flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[#107C10]" />
                  Current Medications
                </CardTitle>
                <div className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest bg-[#F3F2F1] px-2 py-0.5 rounded">
                  {clinicalData.prescriptions.length || 3} Active
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-0">
                  {clinicalData.prescriptions.length > 0 ? (
                    <div className="divide-y divide-[#F3F2F1]">
                      {clinicalData.prescriptions.map((px: any, i) => (
                        <div key={i} className="p-6 hover:bg-[#F3F9FD] transition-all group pointer-events-auto cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-bold text-[#242424] group-hover:text-[#0078D4] transition-colors">{px.medicationName}</h4>
                              <p className="text-xs text-[#616161] font-medium">{px.dosage}, {px.frequency}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">Active</Badge>
                                <span className="text-[10px] text-[#A19F9D] font-medium tracking-tight">Prescribed: {px.createdAt ? new Date(px.createdAt?.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#BDBDBD] hover:text-[#0078D4]">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F3F2F1]">
                      {[
                        { name: 'Lisinopril 10 MG Oral Tablet [Zestril]', dose: '10 MG', freq: 'Once daily' },
                        { name: 'Linagliptin 2.5 MG / metformin hydrochloride 1000 MG Oral Tablet', dose: '2.5/1000 MG', freq: 'Twice daily with meals' },
                        { name: 'Methotrexate 15mg Oral Tablet', dose: '15mg', freq: 'Once weekly' }
                      ].map((med, i) => (
                        <div key={i} className="p-6 hover:bg-[#F3F9FD] transition-all group cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="text-[14px] font-bold text-[#242424] group-hover:text-[#0078D4] transition-colors">{med.name}</h4>
                              <p className="text-xs text-[#616161] font-medium">{med.dose}, {med.freq}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">Active</Badge>
                                <span className="text-[10px] text-[#A19F9D] font-medium tracking-tight">Refills: 2 remaining</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#BDBDBD] hover:text-[#0078D4]">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 bg-[#FAFAFA] border-t border-[#EDEBE9] text-center shrink-0">
                <Button variant="link" className="text-[11px] font-bold text-[#107C10] h-auto p-0 uppercase tracking-widest">
                  View Full Medication List
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT: Ledger & Knowledge Graph */}
        <div className="xl:col-span-3 min-h-0 flex flex-col gap-6">
          <motion.div variants={itemVariants} className="flex-1 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white pt-[13px] pb-[13px]">
              <CardHeader className="py-4 px-6 border-b border-[#F3F2F1] bg-white flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-xs font-bold text-[#616161] uppercase tracking-wider flex items-center gap-2">
                  <DatabaseZap className="h-4 w-4 text-[#0078D4]" />
                  Clinical Ledger
                </CardTitle>
                <div className="text-[10px] font-mono text-[#A19F9D]">ID: {patientId}</div>
              </CardHeader>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 relative">
                  <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-[#EDEBE9]" />
                  {eventLog.slice().reverse().map((ev, i) => (
                    <div key={i} className="relative pl-8 group">
                      <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 border-white bg-[#0078D4] shadow-sm group-hover:scale-110 transition-transform z-10" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#242424] uppercase tracking-tight">{ev.type.replace('_', ' ')}</span>
                        </div>
                        <div className="text-[10px] text-[#616161] leading-relaxed truncate opacity-70">
                          {typeof ev.payload === 'object' ? JSON.stringify(ev.payload).slice(0, 50) : ev.payload}
                        </div>
                      </div>
                    </div>
                  ))}
                  {eventLog.length === 0 && (
                    <div className="p-8 text-center text-[#A19F9D] italic text-[10px]">No entries recorded.</div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex-1 flex flex-col min-h-0"
          >
            <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="py-3 px-5 border-b border-[#F3F2F1] bg-white flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-[11px] font-bold text-[#242424] flex items-center gap-2 uppercase tracking-widest">
                  <Network className="h-3.5 w-3.5 text-[#0078D4]" />
                  Knowledge Graph
                </CardTitle>
                <div className="h-6 w-6 flex items-center justify-center">
                  <SyncIcon />
                </div>
              </CardHeader>
              <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA]/30 relative">
                <KnowledgeGraph patientId={patientId} />
              </div>
            </Card>
          </motion.div>
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
