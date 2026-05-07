import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Pill, Search, CheckCircle2, History, 
  FlaskConical, Info, TrendingUp,
  Brain, FileWarning, RefreshCcw, Sparkles, Trash2, User, X, Loader2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkDrugInteractions, generateClinicalMedicationReview } from '../../services/aiService';
import { deletePrescription, updatePrescriptionStatus, updatePrescriptionAdherence } from '../../services/clinicalFirestoreService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import Markdown from 'react-markdown';

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  status: 'active' | 'discontinued' | 'cancelled';
  prescribedDate?: string;
  indication?: string;
  authorName?: string;
  source?: string;
  adherenceStatus?: 'optimal' | 'partial' | 'poor' | 'uncertain';
  adherenceScore?: number;
  ePrescriptionStatus?: 'sent' | 'received' | 'processing' | 'dispensed' | 'verified';
}

const ADHERENCE_MAP = {
  optimal: { label: 'Optimal', color: 'bg-[#DFF6DD] text-[#107C10]', score: 100 },
  partial: { label: 'Partial', color: 'bg-[#FFF4CE] text-[#794500]', score: 60 },
  poor: { label: 'Poor', color: 'bg-[#FDE7E9] text-[#A4262C]', score: 20 },
  uncertain: { label: 'Uncertain', color: 'bg-[#F3F2F1] text-[#616161]', score: 0 },
};

function PrescriptionStatusSteps({ status }: { status: Medication['ePrescriptionStatus'] }) {
  const steps = ['sent', 'received', 'processing', 'dispensed'];
  const currentIndex = steps.indexOf(status || 'sent');

  return (
    <div className="flex items-center gap-1 mt-2 w-32">
      {steps.map((step, idx) => (
        <div 
          key={step}
          className={`h-1 flex-1 rounded-full ${idx <= currentIndex ? 'bg-[#107C10]' : 'bg-[#EDEBE9]'}`} 
        />
      ))}
      <span className="ml-2 text-[8px] font-black uppercase text-[#107C10] tracking-tight">{status || 'sent'}</span>
    </div>
  );
}

interface MedicationCenterProps {
  patientId: string;
  medications: Medication[];
  conditions: string[];
}

export function MedicationCenter({ patientId, medications, conditions }: MedicationCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<string | null>(null);
  const [clinicalReview, setClinicalReview] = useState<string | null>(null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDiscontinueId, setConfirmDiscontinueId] = useState<string | null>(null);
  const [selectedFdaMed, setSelectedFdaMed] = useState<Medication | null>(null);
  const [fdaData, setFdaData] = useState<any>(null);
  const [isLoadingFda, setIsLoadingFda] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, Medication['status']>>({});

  const processedMeds = useMemo(() => {
    return medications.map(med => {
      if (med.id && localStatusOverrides[med.id]) {
        return { ...med, status: localStatusOverrides[med.id] };
      }
      return med;
    });
  }, [medications, localStatusOverrides]);

  const filteredMeds = useMemo(() => {
    return processedMeds.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedMeds, searchTerm]);

  const activeMeds = useMemo(() => 
    filteredMeds.filter(m => m.status === 'active' || !m.status), 
  [filteredMeds]);
  
  const historyMeds = useMemo(() => 
    filteredMeds.filter(m => m.status === 'discontinued' || m.status === 'cancelled'), 
  [filteredMeds]);

  const handleInteractionCheck = async () => {
    if (activeMeds.length < 2) return;
    setIsCheckingInteractions(true);
    setInteractionResult(null);
    try {
      const result = await checkDrugInteractions(activeMeds.map(m => m.name));
      setInteractionResult(result);
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleClinicalReview = async () => {
    setIsGeneratingReview(true);
    setClinicalReview(null);
    try {
      const result = await generateClinicalMedicationReview(
        activeMeds.map(m => m.name),
        conditions
      );
      setClinicalReview(result);
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const handleDiscontinue = async (medId: string) => {
    if (medId.startsWith('demo-')) {
      // Update local state for demo record simulation
      setLocalStatusOverrides(prev => ({ ...prev, [medId]: 'discontinued' }));
      setConfirmDiscontinueId(null);
      console.info('Medication discontinuation simulated for demo record');
      return;
    }
    setActionLoading(medId);
    try {
      await updatePrescriptionStatus(patientId, medId, 'discontinued');
      setConfirmDiscontinueId(null);
    } catch (e) {
      console.error('Failed to discontinue medication', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFetchFdaDetails = async (med: Medication) => {
    setSelectedFdaMed(med);
    setIsLoadingFda(true);
    setFdaData(null);
    
    try {
      // Clean name for search (remove dosage/strengths)
      const cleanName = med.name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
      const response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${cleanName}"&limit=1`);
      
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        setFdaData({ error: 'FDA service returned an invalid response. Please try again later.' });
        return;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setFdaData(data.results[0]);
      } else {
        setFdaData({ error: 'No detailed FDA label found for this medication.' });
      }
    } catch (e) {
      setFdaData({ error: 'Failed to connect to OpenFDA service.' });
    } finally {
      setIsLoadingFda(false);
    }
  };

  const handlePermanentDelete = async (medId: string) => {
    if (medId.startsWith('demo-')) {
       // Update local state for demo record simulation
       setLocalStatusOverrides(prev => ({ ...prev, [medId]: 'cancelled' }));
       setConfirmDeleteId(null);
       console.info('Medication deletion (cancellation) simulated for demo record');
       return;
    }
    setActionLoading(medId);
    try {
      // For clinical audit, we move to cancelled status instead of physical deletion
      await updatePrescriptionStatus(patientId, medId, 'cancelled' as any, 'Record removed from active regimen');
      setConfirmDeleteId(null);
    } catch (e) {
      console.error('Failed to delete medication', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (med: Medication) => {
    if (!med.id) return;
    if (med.id.startsWith('demo-')) {
      setLocalStatusOverrides(prev => {
        const next = { ...prev };
        delete next[med.id!];
        return next;
      });
      console.info('Medication reactivation simulated for demo record');
      return;
    }
    try {
      await updatePrescriptionStatus(patientId, med.id, 'active');
    } catch (e) {
      console.error('Failed to reactivate medication', e);
    }
  };

  const handleUpdateAdherence = async (med: Medication, status: keyof typeof ADHERENCE_MAP) => {
    if (!med.id) return;
    if (med.id.startsWith('demo-')) {
      console.info('Adherence update simulated for demo record');
      return;
    }
    try {
      await updatePrescriptionAdherence(patientId, med.id, status, ADHERENCE_MAP[status].score);
    } catch (e) {
      console.error('Failed to update adherence', e);
    }
  };

  const overallAdherence = useMemo(() => {
    if (activeMeds.length === 0) return 100;
    const scores = activeMeds.map(m => m.adherenceScore ?? 100);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [activeMeds]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A19F9D] group-focus-within:text-[#0078D4] transition-colors" />
            <input 
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#EDEBE9] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4] transition-all"
            />
          </div>
          <Button 
            variant="outline" 
            className="rounded-xl border-[#EDEBE9] h-10 px-4 flex gap-2 font-bold text-xs"
            onClick={handleInteractionCheck}
            disabled={isCheckingInteractions || activeMeds.length < 2}
          >
            {isCheckingInteractions ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3 text-[#5C2D91]" />}
            Check Interactions
          </Button>
        </div>

        <Button 
          className="rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs h-10 px-6 shadow-sm"
          onClick={handleClinicalReview}
          disabled={isGeneratingReview || activeMeds.length === 0}
        >
          {isGeneratingReview ? <RefreshCcw className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
          AI Clinical Review
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Main List Section */}
        <div className="xl:col-span-8 flex flex-col gap-4 min-h-0 overflow-hidden">
          <Card className="flex-1 border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col min-h-[400px]">
            <CardHeader className="bg-[#FAFAFA] border-b border-[#EDEBE9] py-3 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#616161] flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[#107C10]" />
                  Active Regimen
                </CardTitle>
                <Badge variant="outline" className="bg-white border-[#EDEBE9] text-[#107C10] font-black text-[9px] px-3">
                  {activeMeds.length} COMPOUNDS
                </Badge>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-[#F3F2F1]">
                {activeMeds.length > 0 ? activeMeds.map((med, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 hover:bg-[#F3F9FD] transition-all group flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-black text-[#242424] group-hover:text-[#0078D4] transition-colors">{med.name}</h3>
                        {med.indication && (
                          <span className="text-[9px] font-bold text-[#A19F9D] uppercase bg-[#F3F2F1] px-1.5 py-0.5 rounded tracking-tighter">
                            for {med.indication}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-[#A19F9D]" />
                          <span className="text-[13px] font-bold text-[#616161]">{med.dosage}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <History className="h-3 w-3 text-[#A19F9D]" />
                          <span className="text-[13px] font-bold text-[#616161]">{med.frequency}</span>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5 px-2 bg-[#F3F9FD] rounded-lg border border-[#DEECF9]">
                          <User className="h-3 w-3 text-[#0078D4]" />
                          <span className="text-[10px] font-black text-[#0078D4] uppercase tracking-tight">Provider: {med.authorName || med.source || 'Hospital Record'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1 group/adh">
                          <Badge className={`${ADHERENCE_MAP[med.adherenceStatus || 'optimal'].color} border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-sm`}>
                            {ADHERENCE_MAP[med.adherenceStatus || 'optimal'].label} Adherence
                          </Badge>
                          <div className="hidden group-hover/adh:flex items-center bg-white border border-[#EDEBE9] rounded-md shadow-sm p-0.5 ml-1">
                            {(Object.keys(ADHERENCE_MAP) as Array<keyof typeof ADHERENCE_MAP>).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleUpdateAdherence(med, status)}
                                className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-colors ${med.adherenceStatus === status ? 'bg-[#0078D4] text-white' : 'hover:bg-[#F3F2F1] text-[#616161]'}`}
                              >
                                {status[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-[#BDBDBD] uppercase tracking-wider">Started: {med.prescribedDate || 'N/A'}</span>
                      </div>
                      {med.status === 'active' && <PrescriptionStatusSteps status={med.ePrescriptionStatus || 'dispensed'} />}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-[#BDBDBD] hover:text-[#0078D4] hover:bg-[#DEECF9]" 
                        title="FDA Drug Labels & Details"
                        onClick={() => handleFetchFdaDetails(med)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      
                      {confirmDiscontinueId === med.id ? (
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border-2 border-[#5C2D91]/20 shadow-lg animate-in zoom-in-95">
                          <span className="text-[10px] font-black text-[#5C2D91] px-2 uppercase">Discontinue?</span>
                          <Button 
                            variant="default" 
                            size="sm" 
                            disabled={actionLoading === med.id}
                            className="h-7 px-3 text-[10px] font-black uppercase bg-[#5C2D91] hover:bg-[#4a2475] text-white rounded-lg shadow-sm"
                            onClick={() => handleDiscontinue(med.id || '')}
                          >
                            {actionLoading === med.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-3 text-[10px] font-black uppercase text-[#616161] hover:bg-[#F3F2F1] rounded-lg"
                            onClick={() => setConfirmDiscontinueId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-[#BDBDBD] hover:text-[#5C2D91] hover:bg-[#F3F2F1]" 
                          title="Discontinue"
                          onClick={() => setConfirmDiscontinueId(med.id || null)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}

                      {confirmDeleteId === med.id ? (
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border-2 border-[#D13438]/20 shadow-lg animate-in zoom-in-95">
                          <span className="text-[10px] font-black text-[#D13438] px-2 uppercase">Confirm?</span>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            disabled={actionLoading === med.id}
                            className="h-7 px-3 text-[10px] font-black uppercase bg-[#D13438] hover:bg-[#a4262c] text-white rounded-lg shadow-sm"
                            onClick={() => handlePermanentDelete(med.id || '')}
                          >
                            {actionLoading === med.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-3 text-[10px] font-black uppercase text-[#616161] hover:bg-[#F3F2F1] rounded-lg"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-[#BDBDBD] hover:text-[#D13438] hover:bg-[#FDE7E9]" 
                          title="Delete Record"
                          onClick={() => setConfirmDeleteId(med.id || null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-12 text-center text-[#A19F9D]">
                    <Pill className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No active medications found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* History / Discontinued Section */}
          <Card className="flex-1 min-h-[300px] border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col pt-0">
            <CardHeader className="py-2 px-6 border-b border-[#F3F2F1] bg-[#FAFAFA]/50 shrink-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Prescription History
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-[#F3F2F1]">
                {historyMeds.length > 0 ? historyMeds.map((med, i) => (
                   <div key={i} className="p-3 px-6 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity group">
                    <div className="flex-1">
                      <h4 className="text-[12px] font-bold text-[#616161]">{med.name}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-[#A19F9D] uppercase font-black">
                          {med.status === 'cancelled' ? 'Record Voided' : 'Discontinued'} • {med.frequency}
                        </p>
                        <span className="text-[9px] font-bold text-[#0078D4]/60 uppercase tracking-tighter">via {med.authorName?.split(' ')[0] || 'System'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[9px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9] rounded-md hidden group-hover:flex"
                        onClick={() => handleReactivate(med)}
                      >
                        Restore
                      </Button>
                      <Badge variant="ghost" className={`text-[9px] font-black uppercase tracking-tighter ${med.status === 'cancelled' ? 'text-[#D13438]' : 'text-[#A19F9D]'}`}>
                        {med.status === 'cancelled' ? 'Voided' : 'Complete Cycle'}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-[#A19F9D] text-[10px] font-bold uppercase tracking-widest">Empty History</div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* AI Insights & Interaction Rail */}
        <div className="xl:col-span-4 flex flex-col gap-4 min-h-0">
          {/* Interaction Results */}
          <AnimatePresence>
            {interactionResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="shrink-0"
              >
                <Card className="border-[#FBC6CC] bg-[#FDE7E9]/30 rounded-2xl shadow-sm border overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-[#FBC6CC]/20 flex flex-row items-center justify-between border-b border-[#FBC6CC]/30">
                    <div className="flex items-center gap-2">
                      <FileWarning className="h-4 w-4 text-[#A4262C]" />
                      <span className="text-[10px] font-black text-[#A4262C] uppercase tracking-[0.15em]">Interaction Alert</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-[#A4262C]" onClick={() => setInteractionResult(null)}>
                      <TrendingUp className="h-3 w-3 rotate-45" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-[11px] leading-relaxed text-[#A4262C] font-semibold prose prose-sm prose-red max-w-none">
                       <Markdown>{interactionResult}</Markdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clinical Focus Review */}
          <Card className="flex-1 border-[#DEECF9] bg-[#F3F9FD]/50 rounded-2xl shadow-sm border overflow-hidden flex flex-col pt-[13px] pb-[6px] ml-0 min-h-[400px]">
            <CardHeader className="py-4 px-6 border-b border-[#DEECF9]/30 bg-white shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#0078D4] flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Clinical Strategy
                </CardTitle>
                <Sparkles className="h-3.5 w-3.5 text-[#0078D4]" />
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-6">
              {clinicalReview ? (
                <div className="space-y-4">
                  <div className="markdown-body text-xs font-bold leading-relaxed text-[#242424] opacity-80">
                     <Markdown>{clinicalReview}</Markdown>
                  </div>
                  <div className="pt-4 border-t border-[#DEECF9] flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-[#107C10]" />
                    <span className="text-[9px] font-black uppercase text-[#107C10] tracking-widest">Optimized Regimen</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                  <Brain className="h-10 w-10 mb-3 text-[#0078D4]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#616161]">Clinical Review Required</p>
                  <p className="text-[9px] font-bold text-[#616161] mt-1 max-w-[180px]">Run AI Clinical Review to evaluate therapeutic alignment with patient conditions.</p>
                </div>
              )}
            </ScrollArea>
           
          </Card>

          {/* Adherence Overview */}
          <Card className="shrink-0 border-[#EDEBE9] rounded-2xl bg-white shadow-sm overflow-hidden">
             <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${overallAdherence > 80 ? 'bg-green-50' : overallAdherence > 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
                    <CheckCircle2 className={`h-5 w-5 ${overallAdherence > 80 ? 'text-green-600' : overallAdherence > 50 ? 'text-amber-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-[#242424]">{overallAdherence}% Adherence</h4>
                    <p className="text-[9px] font-black text-[#616161] uppercase tracking-widest">Across all compounds</p>
                  </div>
                </div>
                <div className="h-8 w-24 bg-[#FAFAFA] rounded-full border border-[#EDEBE9] relative overflow-hidden flex items-center justify-center">
                   <div 
                     className={`absolute left-0 top-0 h-full ${overallAdherence > 80 ? 'bg-green-500/20' : overallAdherence > 50 ? 'bg-amber-500/20' : 'bg-red-500/20'}`} 
                     style={{ width: `${overallAdherence}%` }}
                   />
                   <span className={`text-[10px] font-black relative z-10 ${overallAdherence > 80 ? 'text-green-700' : overallAdherence > 50 ? 'text-amber-700' : 'text-red-700'}`}>
                     {overallAdherence > 80 ? 'OPTIMAL' : overallAdherence > 50 ? 'CONCERNING' : 'CRITICAL'}
                   </span>
                </div>
             </div>
          </Card>
        </div>
      </div>

      {/* FDA Details Modal */}
      <Dialog open={!!selectedFdaMed} onOpenChange={(open) => !open && setSelectedFdaMed(null)}>
        <DialogContent className="max-w-5xl w-full max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-[32px] max-sm:rounded-b-none h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl bg-white focus-visible:outline-none">
          <div className="sm:hidden w-12 h-1.5 bg-[#EDEBE9] rounded-full mx-auto mt-4 shrink-0" />
          
          <DialogHeader className="p-6 sm:p-10 bg-[#FAFAFA] border-b border-[#EDEBE9] shrink-0">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-[#0078D4] flex items-center justify-center shadow-lg shadow-[#0078D4]/20 shrink-0">
                <Pill className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-3xl font-black text-[#242424] leading-tight truncate">
                  {selectedFdaMed?.name}
                </DialogTitle>
                <DialogDescription className="text-[10px] sm:text-sm font-black text-[#616161] uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1 sm:mt-1.5 flex items-center gap-2">
                  <Badge variant="outline" className="bg-[#DEECF9] text-[#0078D4] border-none text-[8px] sm:text-[10px] px-1.5 sm:px-2">OFFICIAL FDA LABEL</Badge>
                  Reference Information
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-white overscroll-contain">
            <div className="p-6 sm:p-12 space-y-8 sm:space-y-12">
              {isLoadingFda ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-[#0078D4] animate-spin" />
                  <p className="text-[10px] sm:text-sm font-black text-[#616161] uppercase tracking-widest text-center">Consulting FDA Database...</p>
                </div>
              ) : fdaData?.error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <FileWarning className="h-10 w-10 sm:h-12 sm:w-12 text-[#D13438] mb-4" />
                  <p className="font-bold text-[#242424] text-sm sm:text-base">{fdaData.error}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#616161] mt-2 max-w-xs mx-auto">FDA label information might not be indexed for this specific brand variant.</p>
                </div>
              ) : fdaData ? (
                <div className="space-y-8 pb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F3F9FD] rounded-2xl border border-[#DEECF9]">
                      <h5 className="text-[9px] sm:text-[10px] font-black text-[#0078D4] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                         <TrendingUp className="h-3 w-3" /> Generic Name
                      </h5>
                      <p className="text-xs sm:text-sm font-bold text-[#242424]">{fdaData.openfda?.generic_name?.[0] || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-[#F3F9FD] rounded-2xl border border-[#DEECF9]">
                      <h5 className="text-[9px] sm:text-[10px] font-black text-[#0078D4] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                         <Pill className="h-3 w-3" /> Brand Name
                      </h5>
                      <p className="text-xs sm:text-sm font-bold text-[#242424]">{fdaData.openfda?.brand_name?.[0] || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {fdaData.indications_and_usage && (
                      <section>
                        <h4 className="text-[10px] sm:text-xs font-black text-[#242424] uppercase tracking-widest mb-3 pb-2 border-b border-[#F3F2F1]">Indications & Usage</h4>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-[#616161] font-medium whitespace-pre-wrap">{fdaData.indications_and_usage[0]}</p>
                      </section>
                    )}

                    {fdaData.dosage_and_administration && (
                      <section>
                        <h4 className="text-[10px] sm:text-xs font-black text-[#242424] uppercase tracking-widest mb-3 pb-2 border-b border-[#F3F2F1]">Clinical Administration</h4>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-[#616161] font-medium whitespace-pre-wrap">{fdaData.dosage_and_administration[0]}</p>
                      </section>
                    )}

                    {fdaData.warnings && (
                      <section className="p-4 sm:p-5 bg-red-50/50 rounded-2xl border border-red-100">
                        <h4 className="text-[10px] sm:text-xs font-black text-[#A4262C] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <FileWarning className="h-4 w-4" /> Critical Warnings
                        </h4>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-[#A4262C] font-semibold whitespace-pre-wrap">{fdaData.warnings[0]}</p>
                      </section>
                    )}

                    {fdaData.adverse_reactions && (
                      <section>
                        <h4 className="text-[10px] sm:text-xs font-black text-[#242424] uppercase tracking-widest mb-3 pb-2 border-b border-[#F3F2F1]">Adverse Reactions</h4>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-[#616161] font-medium whitespace-pre-wrap">{fdaData.adverse_reactions[0]}</p>
                      </section>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-6 border-t border-[#F3F2F1]">
                      <a 
                        href={`https://labels.fda.gov/`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-[11px] font-black uppercase text-[#0078D4] hover:underline flex items-center gap-1.5"
                      >
                        View Official FDA Label <ExternalLink className="h-3 w-3" />
                      </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
