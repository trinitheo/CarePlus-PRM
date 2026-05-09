import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Search, FileText, X, Maximize2, Loader2, Check, ChevronRight, Plus, Stethoscope, AlertCircle, Lock } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { searchICD10, ClinicalCode } from '../../services/clinicalRegistryService';
import { saveSOAPNote, updateSOAPNote } from '../../services/clinicalFirestoreService';
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
        specialty: userProfile?.specialty || specialty || 'General Practice'
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-[1050px] w-[95vw] p-0 overflow-hidden bg-white border-[#EDEBE9] rounded-2xl shadow-2xl flex flex-col h-[90vh] focus:outline-none">
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
                        className="flex-1 h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[13px]"
                      />
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
