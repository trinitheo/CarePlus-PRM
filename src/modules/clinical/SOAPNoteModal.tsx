import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Search, FileText, X, Maximize2, Loader2, Check, ChevronRight, Plus, Stethoscope, AlertCircle, Lock, Sparkles, Mic, History, Activity } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { searchICD10, ClinicalCode } from '../../services/clinicalRegistryService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { RadialMindMap } from './RadialMindMap';
import { LinearEncounterForm } from './LinearEncounterForm';
import { MedicalNode, ClinicalHistoryMap } from '../../types';
import { saveSOAPNote, updateSOAPNote, getPatientById } from '../../services/clinicalFirestoreService';
import { processMedicalConversation } from '../../services/transcriptionService';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { motion, AnimatePresence, Variants } from 'motion/react';

interface SOAPNoteModalProps {
  patientId: string;
  children: React.ReactNode;
  initialNote?: any;
  canWrite?: boolean;
}

export function SOAPNoteModal({ patientId, children, initialNote, canWrite = true }: SOAPNoteModalProps) {
  const { userProfile } = useCurrentUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Transcription State
  const [isTranscriptionOpen, setIsTranscriptionOpen] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState(initialNote?.title || 'Follow-up SOAP Note');
  const [specialty, setSpecialty] = React.useState(initialNote?.specialty || 'General Practice');
  const [priority, setPriority] = React.useState<'routine' | 'urgent' | 'critical'>(initialNote?.priority || 'routine');
  const [subjective, setSubjective] = React.useState(initialNote?.subjective || '');
  const [objective, setObjective] = React.useState(initialNote?.objective || '');
  const [assessment, setAssessment] = React.useState(initialNote?.assessment || '');
  const [plan, setPlan] = React.useState(initialNote?.plan || '');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<ClinicalCode[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedCodes, setSelectedCodes] = React.useState<ClinicalCode[]>(
    (initialNote?.icd10Codes || []).map((code: string) => ({ code, display: 'Code from Record' }))
  );
  const [workingDiagnoses, setWorkingDiagnoses] = React.useState<string[]>(initialNote?.workingDiagnoses || []);
  const [workingDiagnosisInput, setWorkingDiagnosisInput] = React.useState('');
  const [activeSection, setActiveSection] = React.useState<string>('metadata');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'linear' | 'spatial'>('linear');
  const [patientData, setPatientData] = React.useState<any>(null);

  // Radial Mind Map State
  const [nodes, setNodes] = React.useState<MedicalNode[]>([
    { id: 'n1', type: 'narrative', position: { x: 150, y: 150 }, data: { label: 'Active Narrative', details: initialNote?.subjective || '', status: 'pending', category: 'HISTORY' } },
    { id: 'n2', type: 'background', position: { x: 650, y: 150 }, data: { label: 'Background', details: '', status: 'pending', category: 'HISTORY' } },
    { id: 'n3', type: 'screening', position: { x: 150, y: 450 }, data: { label: 'Screening', details: '', status: 'pending', category: 'ROS' } },
    { id: 'n4', type: 'objective', position: { x: 650, y: 450 }, data: { label: 'Objective Data', details: initialNote?.objective || '', status: 'pending', category: 'EXAM' } },
    { id: 'n5', type: 'synthesis', position: { x: 400, y: 600 }, data: { label: 'Synthesis', details: initialNote?.assessment || '', status: 'pending', category: 'ASSESSMENT' } },
    { id: 'n6', type: 'disposition', position: { x: 400, y: 0 }, data: { label: 'Disposition', details: initialNote?.plan || '', status: 'pending', category: 'PLAN' } },
  ]);

  const edges = [
    { id: 'e1', source: 'center', target: 'n1', label: 'History' },
    { id: 'e2', source: 'center', target: 'n2', label: 'Past Hx' },
    { id: 'e3', source: 'center', target: 'n3', label: 'Screen' },
    { id: 'e4', source: 'center', target: 'n4', label: 'Exam' },
    { id: 'e5', source: 'center', target: 'n5', label: 'Assessment' },
    { id: 'e6', source: 'center', target: 'n6', label: 'Plan' },
  ];

  const updateNodeData = (nodeId: string, updates: Partial<MedicalNode['data']>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n));
  };

  // Sync spatial nodes with linear state
  React.useEffect(() => {
    updateNodeData('n1', { details: subjective });
    updateNodeData('n4', { details: objective });
    updateNodeData('n5', { details: assessment });
    updateNodeData('n6', { details: plan });
  }, [subjective, objective, assessment, plan]);

  // Sync linear state with spatial nodes when they change (if editing in spatial)
  const handleNodeUpdate = (nodeId: string, updates: Partial<MedicalNode['data']>) => {
    updateNodeData(nodeId, updates);
    if (updates.details !== undefined) {
      if (nodeId === 'n1') setSubjective(updates.details);
      if (nodeId === 'n4') setObjective(updates.details);
      if (nodeId === 'n5') setAssessment(updates.details);
      if (nodeId === 'n6') setPlan(updates.details);
    }
  };

  React.useEffect(() => {
    if (isOpen && patientId) {
      getPatientById(patientId).then(setPatientData);
    }
  }, [isOpen, patientId]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Sync state with initialNote if it changes
  React.useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || 'Follow-up SOAP Note');
      setSpecialty(initialNote.specialty || 'General Practice');
      setPriority(initialNote.priority || 'routine');
      setSubjective(initialNote.subjective || '');
      setObjective(initialNote.objective || '');
      setAssessment(initialNote.assessment || '');
      setPlan(initialNote.plan || '');
      setWorkingDiagnoses(initialNote.workingDiagnoses || []);
      setSelectedCodes((initialNote.icd10Codes || []).map((code: string) => ({ code, display: 'Code from Record' })));
    }
  }, [initialNote, isOpen]);

  const sections = [
    { id: 'metadata', label: 'Encounter Info' },
    { id: 'subjective', label: 'Subjective' },
    { id: 'objective', label: 'Objective' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'plan', label: 'Plan' },
  ];

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchICD10(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleCode = (code: ClinicalCode) => {
    setSelectedCodes(prev => 
      prev.find(c => c.code === code.code) 
        ? prev.filter(c => c.code !== code.code)
        : [...prev, code]
    );
    setSearchQuery('');
    setSearchResults([]);
  };

  const addWorkingDiagnosis = () => {
    if (workingDiagnosisInput.trim() && !workingDiagnoses.includes(workingDiagnosisInput.trim())) {
      setWorkingDiagnoses(prev => [...prev, workingDiagnosisInput.trim()]);
      setWorkingDiagnosisInput('');
    }
  };

  const removeWorkingDiagnosis = (diag: string) => {
    setWorkingDiagnoses(prev => prev.filter(d => d !== diag));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const viewport = scrollRef.current;
    if (el && viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - viewportRect.top + viewport.scrollTop - 40;
      viewport.scrollTo({ top: relativeTop, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const viewportRect = el.getBoundingClientRect();
      let current = 'subjective';
      for (const section of sections) {
        const sectionEl = document.getElementById(section.id);
        if (sectionEl) {
          const sectionRect = sectionEl.getBoundingClientRect();
          if (sectionRect.top - viewportRect.top <= 120) {
            current = section.id;
          }
        }
      }
      setActiveSection(current);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  // Fluent 2 Motion Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    },
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const noteData = {
        title,
        priority,
        subjective,
        objective,
        assessment,
        plan,
        icd10Codes: selectedCodes.map(c => c.code),
        workingDiagnoses,
        status: 'signed',
        authorName: userProfile?.displayName || initialNote?.authorName || 'Clinical Provider',
        specialty: userProfile?.specialty || specialty || 'General Practice',
        mindMap: { nodes, edges }
      };

      if (initialNote?.id) {
        await updateSOAPNote(patientId, initialNote.id, noteData);
      } else {
        await saveSOAPNote(patientId, noteData);
      }

      handleClose();
    } catch (e: any) {
      console.error('SOAP Note Save Failure:', e);
      let displayError = 'Record synchronization failed';
      
      try {
        const errorInfo = JSON.parse(e.message);
        if (errorInfo.error.includes('permission')) {
          displayError = 'Security: Care team authorization required';
        }
      } catch {
        if (e.message?.toLowerCase().includes('permission')) {
          displayError = 'Security: Insufficient clinical permissions';
        }
      }
      
      setErrorMessage(displayError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMessage(null);
    setIsTranscriptionOpen(false);
    setTranscript('');
    // Short delay to allow exit animation before resetting form
    setTimeout(() => {
      if (!initialNote) {
        setSubjective('');
        setObjective('');
        setAssessment('');
        setPlan('');
        setWorkingDiagnoses([]);
        setSelectedCodes([]);
        setTitle('Clinical SOAP Note');
        setSpecialty('General Medicine');
        setPriority('routine');
      }
    }, 200);
  };

  const handleTranscriptionProcess = async () => {
    if (!transcript.trim()) return;
    setIsTranscribing(true);
    try {
      const result = await processMedicalConversation(transcript);
      setSubjective(result.subjective);
      setObjective(result.objective);
      setAssessment(result.assessment);
      setPlan(result.plan);
      setTitle(result.title);
      if (result.workingDiagnoses.length > 0) {
        setWorkingDiagnoses(prev => {
          const combined = [...prev, ...result.workingDiagnoses];
          return Array.from(new Set(combined)); // Deduplicate
        });
      }
      setIsTranscriptionOpen(false);
      setTranscript('');
      scrollToSection('subjective');
    } catch (e: any) {
      console.error("Transcription processing failed", e);
      let errorMsg = "Transcription failed. Please try again.";
      
      // Handle specific Gemini API errors based on skill guidelines
      if (e?.error?.code === 400 || e?.error?.status === "INVALID_ARGUMENT" || e?.message?.includes("API key")) {
        errorMsg = "API Key Error: Please check or renew your API key in the 'Settings > Secrets' panel.";
      } else if (e?.error?.code === 429) {
        errorMsg = "Quota exceeded. Consider upgrading your plan in 'Settings > Secrets'.";
      }
      
      alert(errorMsg);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-[1050px] w-[95vw] p-0 overflow-hidden bg-white border-[#EDEBE9] rounded-2xl shadow-2xl flex flex-col h-[85vh] focus:outline-none">
        <AnimatePresence>
          {isTranscriptionOpen && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-[60] bg-white/60 flex items-center justify-center p-8"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.18)] border border-[#EDEBE9] overflow-hidden flex flex-col"
              >
                <div className="bg-[#4285F4] p-8 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="bg-white p-1.5 rounded-lg">
                        <Sparkles className="h-5 w-5 text-[#4285F4]" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight uppercase">Transcription</h3>
                    </div>
                    <p className="text-white/80 text-sm font-medium">Google Health AI • Clinical Intelligence Layer</p>
                  </div>
                  <button onClick={() => setIsTranscriptionOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-[#242424] flex items-center gap-2">
                        <Mic className="h-4 w-4 text-[#4285F4]" />
                        Conversation Transcript
                      </Label>
                      <button 
                        onClick={() => setTranscript("Doctor: Hello Marcus, how have your hands and wrists been feeling since we started Methotrexate?\nPatient: They are feeling much better. The morning stiffness is down to about 20 minutes instead of an hour and a half.\nDoctor: That's great progress. Let's do a quick physical check. Synovial swelling in your MCP and PIP joints is significantly reduced, only mild tenderness in the right wrist now.\nPatient: My joint mobility has improved too, I can open jars much easier. No nausea from the Methotrexate.\nDoctor: Excellent. Grip strength is up to 32kg today. Your latest CRP improved to 9 mg/L and liver enzymes are perfect. Assessment: Rheumatoid Arthritis, seropositive, showing excellent response to DMARD therapy with Methotrexate. Plan: Escalate Methotrexate to 15mg weekly to aim for complete remission. Continue Folic Acid 5mg weekly. Repeat LFTs and blood panel in 3 months. Order contrast MRI of hands to confirm no subclinical joint erosion.")}
                        className="text-[11px] font-bold text-[#4285F4] hover:underline flex items-center gap-1"
                      >
                        <History className="h-3 w-3" />
                        Load Example Session
                      </button>
                    </div>
                    <Textarea 
                      placeholder="Paste conversation transcript or dictation text here..." 
                      className="min-h-[250px] bg-[#FAFAFA] border-[#EDEBE9] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]/20 rounded-xl text-[14px] p-4 leading-relaxed resize-none shadow-inner"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleTranscriptionProcess}
                      disabled={isTranscribing || !transcript.trim()}
                      className="flex-1 bg-[#4285F4] hover:bg-[#3367D6] text-white font-black h-14 rounded-2xl shadow-xl shadow-[#4285F4]/20 transition-all text-lg gap-3"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Google Health AI Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Generate Clinical Foundation Note
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fluent 2 Header Pattern */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#EDEBE9] shrink-0 bg-white z-10">
          <DialogHeader className="p-0">
            <DialogTitle className="text-[22px] font-bold tracking-tight text-[#242424] flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-10 w-10 bg-[#0078D4] flex items-center justify-center rounded-lg shadow-sm"
              >
                <FileText className="h-5.5 w-5.5 text-white" />
              </motion.div>
              <motion.span
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {initialNote ? `Edit Note: ${initialNote.title}` : 'Follow-up SOAP Note'}
              </motion.span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTranscriptionOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F3F9FD] text-[#4285F4] hover:bg-[#E1F0FE] rounded-lg transition-all font-bold text-[13px] border border-[#CFE4FA] shadow-sm uppercase tracking-tight"
            >
              <Sparkles className="h-4 w-4" />
              Transcription
            </button>
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-md text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] transition-colors"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col">
          <div className="px-8 py-3 bg-[#FAFAFA] border-b border-[#EDEBE9] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2 h-9 bg-[#EDEBE9] p-1">
                  <TabsTrigger value="linear" className="text-[11px] font-bold uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-[#0078D4] data-[state=active]:shadow-sm">
                    <History className="h-3.5 w-3.5 mr-2" />
                    Linear Record
                  </TabsTrigger>
                  <TabsTrigger value="spatial" className="text-[11px] font-bold uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-[#4285F4] data-[state=active]:shadow-sm">
                    <Activity className="h-3.5 w-3.5 mr-2" />
                    Spatial Mind Map
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {viewMode === 'spatial' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#616161] uppercase tracking-widest">Canvas Control</span>
                <Badge variant="outline" className="bg-[#E1F0FE] text-[#0078D4] border-[#CFE4FA] text-[9px] font-bold uppercase">React Flow v12</Badge>
              </div>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {viewMode === 'linear' ? (
              <div className="flex flex-1 overflow-hidden">
                {/* Side Navigation */}
                <div className="w-48 bg-[#FAFAFA] border-r border-[#EDEBE9] py-8 px-4 shrink-0 hidden md:block">
                  <div className="space-y-1 sticky top-0">
                    <p className="text-[10px] font-bold text-[#616161] uppercase tracking-[0.08em] px-3 mb-4">Sections</p>
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between group ${
                          activeSection === section.id 
                            ? 'bg-white text-[#0078D4] shadow-sm font-bold border border-[#EDEBE9]' 
                            : 'text-[#616161] hover:bg-[#F3F2F1]'
                        }`}
                      >
                        <span className="text-[13px]">{section.label}</span>
                        {activeSection === section.id && (
                          <motion.div layoutId="active-indicator">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <ScrollArea 
                  className="flex-1" 
                  viewportRef={scrollRef}
                >
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="px-8 lg:px-12 py-10 space-y-16 max-w-5xl mx-auto pb-32"
                  >
                    <motion.div id="metadata" variants={itemVariants} className="space-y-6">
                      <div className="space-y-1">
                        <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">Encounter Details</Label>
                        <p className="text-[13px] text-[#616161]">Basic information about this clinical encounter.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-[#616161] uppercase tracking-widest">Note Title</Label>
                          <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="e.g. Cardiology Consultation"
                            className="h-10 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[13px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-[#616161] uppercase tracking-widest">Specialty</Label>
                          <Input 
                            value={specialty} 
                            onChange={(e) => setSpecialty(e.target.value)} 
                            placeholder="e.g. Cardiology"
                            className="h-10 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[13px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-[#616161] uppercase tracking-widest">Priority Status</Label>
                        <div className="flex gap-2">
                          {['routine', 'urgent', 'critical'].map((p) => (
                            <button
                              key={p}
                              onClick={() => setPriority(p as any)}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                priority === p 
                                  ? 'bg-[#0078D4] text-white shadow-md' 
                                  : 'bg-white border border-[#EDEBE9] text-[#616161] hover:bg-[#F3F2F1]'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* Subjective & Objective */}
                    <motion.div id="subjective" variants={itemVariants} className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">Subjective</Label>
                        <p className="text-[13px] text-[#616161]">Symptoms, concerns, and history reported by the patient.</p>
                      </div>
                      <Textarea 
                        placeholder="e.g. Patient reports sharp chest pain radiating to left arm..." 
                        className="min-h-[220px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                      />
                    </motion.div>

                    <motion.div id="objective" variants={itemVariants} className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">Objective</Label>
                        <p className="text-[13px] text-[#616161]">Physical exam findings, vital signs, and lab data.</p>
                      </div>
                      <Textarea 
                        placeholder="e.g. BP: 135/85, HR: 88 (regular), Clear lung sounds..." 
                        className="min-h-[220px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                      />
                    </motion.div>

                    {/* Assessment */}
                    <motion.div id="assessment" variants={itemVariants} className="space-y-12">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">Assessment <span className="text-[#A4262C] font-black">*</span></Label>
                          <p className="text-[13px] text-[#616161]">Professional medical synthesis and clinical diagnosis.</p>
                        </div>
                        <Textarea 
                          placeholder="e.g. Likely stable angina, R/O acute coronary syndrome..." 
                          className="min-h-[180px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                          value={assessment}
                          onChange={(e) => setAssessment(e.target.value)}
                        />
                      </div>

                      <div className="pt-8 border-t border-[#F0F0F0] space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">Link Codes</Label>
                          <p className="text-[12px] text-[#616161]">Link findings to ICD-10-CM or SNOMED CT.</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center pointer-events-none">
                              {isSearching ? <Loader2 className="h-3.5 w-3.5 text-[#0078D4] animate-spin" /> : <Search className="h-4 w-4 text-[#616161] group-focus-within:text-[#0078D4] transition-colors" />}
                            </div>
                            <Input 
                              placeholder="Search codes..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  setIsSearching(true);
                                  searchICD10(searchQuery).then(results => {
                                    setSearchResults(results);
                                    setIsSearching(false);
                                  });
                                }
                              }}
                              className="pl-10 h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[13px] transition-all duration-200"
                            />
                            <AnimatePresence>
                              {searchResults.length > 0 && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  transition={{ duration: 0.2, ease: [0.33, 0, 0.1, 1] }}
                                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EDEBE9] rounded-xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto"
                                >
                                  <div className="px-3 py-2 bg-[#FAFAFA] border-b border-[#F0F0F0] flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#616161] uppercase tracking-wider">Results from ICD-10 Registry</span>
                                    <button onClick={() => setSearchResults([])} className="text-[#616161] hover:text-[#242424] transition-colors"><X className="h-3 w-3" /></button>
                                  </div>
                                  {searchResults.map((res) => (
                                    <button
                                      key={res.code}
                                      onClick={() => toggleCode(res)}
                                      className="w-full text-left px-4 py-3 hover:bg-[#F3F2F1] transition-colors flex items-center justify-between group border-b border-[#F5F5F5] last:border-0"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[12px] font-bold text-[#0078D4]">{res.code}</span>
                                        <span className="text-[13px] text-[#242424] font-medium leading-tight">{res.display}</span>
                                      </div>
                                      <div className="h-6 w-6 rounded-md border-2 border-[#D1D1D1] group-hover:border-[#0078D4] flex items-center justify-center transition-colors">
                                        <Check className="h-4 w-4 text-white group-hover:text-[#0078D4] opacity-0 group-hover:opacity-100 transition-all duration-200" />
                                      </div>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              variant="outline" 
                              onClick={async () => {
                                if (searchQuery.length > 0) {
                                  setIsSearching(true);
                                  const results = await searchICD10(searchQuery);
                                  setSearchResults(results);
                                  setIsSearching(false);
                                }
                              }}
                              className="h-11 border-[#8A8886] text-[#0078D4] hover:bg-[#F3F9FD] px-5 font-bold text-[13px] rounded-md transition-all"
                            >
                              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                            </Button>
                          </motion.div>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                          <AnimatePresence>
                            {selectedCodes.length === 0 ? (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[12px] text-[#A19F9D] italic mt-1"
                              >
                                No codes selected for this encounter
                              </motion.p>
                            ) : (
                              selectedCodes.map(code => (
                                <motion.div
                                  key={code.code}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                >
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-[#F3F9FD] text-[#0078D4] border-[#CFE4FA] px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase shadow-sm flex items-center gap-2 group hover:bg-[#E1F0FE] transition-colors"
                                  >
                                    <span className="opacity-70">ICD10:</span> {code.code}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCode(code);
                                      }}
                                      className="p-0.5 hover:bg-white/50 rounded-full transition-colors"
                                    >
                                      <X className="h-3 w-3 text-[#0078D4] hover:text-red-600" />
                                    </button>
                                  </Badge>
                                </motion.div>
                              ))
                            )}
                          </AnimatePresence>
                        </div>

                        <Separator className="bg-[#F0F0F0] my-2" />

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">Working Clinical Diagnosis</Label>
                            <p className="text-[12px] text-[#616161]">Manually add findings that are not yet officially coded (e.g., "Working diagnosis of pneumonia").</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <Input 
                                placeholder="Type clinical diagnosis..." 
                                value={workingDiagnosisInput}
                                onChange={(e) => setWorkingDiagnosisInput(e.target.value)}
                                onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addWorkingDiagnosis();
                                }
                                }}
                                className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[13px]"
                                />
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={addWorkingDiagnosis}
                              disabled={!workingDiagnosisInput.trim()}
                              className="h-11 border-[#8A8886] text-[#0078D4] hover:bg-[#F3F9FD] px-5 font-bold text-[13px] rounded-md transition-all"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Diagnosis
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {workingDiagnoses.map((diag) => (
                              <Badge 
                                key={diag}
                                variant="outline" 
                                className="bg-[#FFF4F4] text-[#A4262C] border-[#FDE7E9] px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase flex items-center gap-2 group hover:bg-[#FDE7E9] transition-colors"
                              >
                                <Stethoscope className="h-3 w-3" />
                                {diag}
                                <button 
                                  onClick={() => removeWorkingDiagnosis(diag)}
                                  className="p-0.5 hover:bg-white/50 rounded-full transition-colors"
                                >
                                  <X className="h-3 w-3 text-[#A4262C]" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Plan */}
                    <motion.div id="plan" variants={itemVariants} className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[12px] font-bold text-[#242424] uppercase tracking-[0.05em]">The Plan <span className="text-[#A4262C] font-black">*</span></Label>
                        <p className="text-[13px] text-[#616161]">Specific interventions, medications, and follow-up strategy.</p>
                      </div>
                      <Textarea 
                        placeholder="1. Continue current dosage\n2. Initiate ACE inhibitor therapy..." 
                        className="min-h-[500px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                      />
                    </motion.div>
                  </motion.div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden relative">
                <RadialMindMap 
                  data={{ nodes, edges }} 
                  onNodeClick={(node) => {
                    // In a more complex app, we could open a specific editor for this node
                    console.log('Node clicked:', node);
                  }}
                  patientName={patientData?.name || 'Loading...'}
                  patientDOB={patientData?.dob || 'N/A'}
                />
                
                {/* Overlay Editor for Spatial Mode */}
                <div className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-[#EDEBE9] shadow-2xl flex flex-col z-20">
                    <div className="p-6 border-b border-[#EDEBE9] flex items-center justify-between bg-[#FAFAFA]">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[#0078D4]" />
                            <h3 className="text-sm font-black uppercase tracking-tighter">Bulk Node Editor</h3>
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <LinearEncounterForm 
                          nodes={nodes} 
                          onUpdateNode={handleNodeUpdate} 
                        />
                    </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>


        <DialogFooter className="px-10 py-6 bg-[#FAFAFA] border-t border-[#EDEBE9] flex justify-between items-center gap-6 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
          <div className="flex-1 hidden sm:block">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col"
            >
              <p className="text-[13px] text-[#242424] font-bold">Cloud Sync Active</p>
              <p className="text-[11px] text-[#616161]">Notes are finalized to permanent record</p>
            </motion.div>
          </div>
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#FFF4F4] border border-[#FDE7E9] px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-[#A4262C]" />
                  <span className="text-[11px] font-bold text-[#A4262C] uppercase tracking-tight">{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogClose asChild>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={handleClose}
                className="text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] font-semibold text-[14px] rounded-md px-8 h-11 transition-colors border-none bg-transparent outline-none cursor-pointer focus:ring-2 focus:ring-[#EDEBE9] rounded-lg disabled:opacity-50"
              >
                Discard
              </button>
            </DialogClose>
            {canWrite && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  disabled={isSubmitting || !assessment || !plan}
                  onClick={handleSave}
                  className="bg-[#0078D4] hover:bg-[#006ABD] text-white font-bold text-[14px] rounded-md px-12 h-11 shadow-lg shadow-[#0078D4]/20 transition-all tracking-tight"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {initialNote ? 'Update & Finalize Record' : 'Finalize & Sign Note'}
                </Button>
              </motion.div>
            )}
            {!canWrite && (
               <div className="flex items-center gap-2 bg-[#F3F2F1] px-6 py-2 rounded-lg border border-[#EDEBE9]">
                 <Lock className="h-4 w-4 text-[#616161]" />
                 <span className="text-[11px] font-black uppercase text-[#616161]">Read Only Access</span>
               </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
