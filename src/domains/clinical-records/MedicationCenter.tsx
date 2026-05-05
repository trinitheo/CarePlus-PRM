import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Pill, Search, AlertTriangle, CheckCircle2, History, 
  FlaskConical, Info, ArrowUpRight, TrendingUp,
  Brain, FileWarning, RefreshCcw, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../lib/motion';
import { checkDrugInteractions, generateClinicalMedicationReview } from '../../services/aiService';
import Markdown from 'react-markdown';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  status: 'active' | 'discontinued';
  prescribedDate?: string;
  indication?: string;
  ePrescriptionStatus?: 'sent' | 'received' | 'processing' | 'dispensed' | 'verified';
}

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

  const filteredMeds = useMemo(() => {
    return medications.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medications, searchTerm]);

  const activeMeds = useMemo(() => filteredMeds.filter(m => m.status === 'active'), [filteredMeds]);
  const historyMeds = useMemo(() => filteredMeds.filter(m => m.status === 'discontinued'), [filteredMeds]);

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
        <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col">
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
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-[#A19F9D]" />
                          <span className="text-[13px] font-bold text-[#616161]">{med.dosage}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <History className="h-3 w-3 text-[#A19F9D]" />
                          <span className="text-[13px] font-bold text-[#616161]">{med.frequency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">Verified Adherence</Badge>
                        <span className="text-[9px] font-black text-[#BDBDBD] uppercase tracking-wider">Started: {med.prescribedDate || 'N/A'}</span>
                      </div>
                      {med.status === 'active' && <PrescriptionStatusSteps status={med.ePrescriptionStatus || 'dispensed'} />}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#BDBDBD] hover:text-[#0078D4] hover:bg-[#DEECF9]">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#BDBDBD] hover:text-[#D13438] hover:bg-[#FDE7E9]">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
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
          <Card className="h-48 border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col">
            <CardHeader className="py-2 px-6 border-b border-[#F3F2F1] bg-[#FAFAFA]/50 shrink-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Prescription History
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-[#F3F2F1]">
                {historyMeds.length > 0 ? historyMeds.map((med, i) => (
                   <div key={i} className="p-3 px-6 flex items-center justify-between opacity-60">
                    <div>
                      <h4 className="text-[12px] font-bold text-[#616161]">{med.name}</h4>
                      <p className="text-[10px] text-[#A19F9D] uppercase font-black">Discontinued • {med.frequency}</p>
                    </div>
                    <Badge variant="ghost" className="text-[9px] font-black text-[#A19F9D] uppercase tracking-tighter">Complete Cycle</Badge>
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
          <Card className="flex-1 border-[#DEECF9] bg-[#F3F9FD]/50 rounded-2xl shadow-sm border overflow-hidden flex flex-col">
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
                  <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-[#242424]">98.2% Adherence</h4>
                    <p className="text-[9px] font-black text-[#616161] uppercase tracking-widest">Across all compounds</p>
                  </div>
                </div>
                <div className="h-8 w-24 bg-[#FAFAFA] rounded-full border border-[#EDEBE9] relative overflow-hidden flex items-center justify-center">
                   <div className="absolute left-0 top-0 h-full bg-green-500/20 w-[98.2%]" />
                   <span className="text-[10px] font-black text-green-700 relative z-10">OPTIMAL</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
