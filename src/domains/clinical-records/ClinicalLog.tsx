import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { 
  FileText, Clock, ChevronRight, Search, 
  Plus, Edit, Eye, History, Filter,
  Stethoscope, ClipboardCheck, Loader2, Check, X
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useQueryModel } from '../../store/eventStore';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { SOAPNoteModal } from './SOAPNoteModal';
import { motion, AnimatePresence } from 'motion/react';
import { searchICD10, ClinicalCode } from '../../services/clinicalRegistryService';
import { updateSOAPNote } from '../../services/clinicalFirestoreService';

export function useClinicalTimeline(patientId: string) {
  const { clinicalIntakes } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);
  const intake = clinicalIntakes[patientId];
  
  const timeline = useMemo(() => {
    const items: any[] = [];
    
    if (intake) {
      items.push({
        id: intake.id || 'intake-initial',
        type: 'intake',
        title: 'Initial Clinical Intake',
        content: intake.historyOfPresentIllness,
        timestamp: intake.timestamp,
        author: 'System (Legacy)',
        data: intake
      });
    }

    clinicalData.clinical_records.forEach((record: any) => {
      items.push({
        id: record.id,
        type: 'soap',
        title: 'Follow-up SOAP Note',
        content: record.subjective || 'No content',
        timestamp: record.createdAt?.seconds ? record.createdAt.seconds * 1000 : (record.timestamp || Date.now()),
        author: 'Clinical Staff',
        data: record
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [intake, clinicalData.clinical_records]);

  return timeline;
}

import { transition } from '../../lib/motion';

export function ClinicalLogSidebar({ 
  patientId, 
  selectedNoteId, 
  onSelectNote 
}: { 
  patientId: string, 
  selectedNoteId: string | null, 
  onSelectNote: (id: string | null) => void 
}) {
  const timeline = useClinicalTimeline(patientId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTimeline = timeline.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#616161]" />
          <h3 className="text-sm font-bold text-[#242424] uppercase tracking-widest opacity-80">Clinical Log</h3>
        </div>
        <SOAPNoteModal patientId={patientId}>
          <Button size="sm" className="h-8 bg-[#0078D4] hover:bg-[#005A9E] text-[10px] font-bold uppercase tracking-widest rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1" /> New SOAP
          </Button>
        </SOAPNoteModal>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A19F9D]" />
        <Input 
          placeholder="Search notes..." 
          className="pl-9 h-9 text-xs border-[#EDEBE9] bg-white rounded-xl shadow-sm focus-visible:ring-[#0078D4]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 bg-white border border-[#EDEBE9] rounded-2xl shadow-sm">
        <div className="divide-y divide-[#F3F2F1]">
          <AnimatePresence initial={false}>
            {filteredTimeline.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={transition.entrance}
                onClick={() => onSelectNote(selectedNoteId === item.id ? null : item.id)}
                className={`p-4 cursor-pointer transition-all relative ${
                  selectedNoteId === item.id
                    ? 'bg-[#F3F9FD] after:content-[""] after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-[#0078D4] after:rounded-r-sm'
                    : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    item.type === 'intake' ? 'bg-[#E1F1FF] text-[#0078D4]' : 'bg-[#F3F2F1] text-[#616161]'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[10px] font-medium text-[#A19F9D] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-[13px] font-bold text-[#242424] mb-1 truncate">{item.title}</h4>
                <p className="text-[11px] text-[#616161] line-clamp-2 leading-relaxed">
                  {item.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTimeline.length === 0 && (
            <div className="p-8 text-center text-[#A19F9D]">
              <p className="text-xs italic">No clinical notes found matching your search.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ClinicalLogViewer({ patientId, selectedNoteId }: { patientId: string, selectedNoteId: string | null }) {
  const timeline = useClinicalTimeline(patientId);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) {
      return timeline[0] || null;
    }
    return timeline.find(it => it.id === selectedNoteId) || timeline[0];
  }, [selectedNoteId, timeline]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubjective, setEditedSubjective] = useState('');
  const [editedObjective, setEditedObjective] = useState('');
  const [editedAssessment, setEditedAssessment] = useState('');
  const [editedPlan, setEditedPlan] = useState('');
  const [editedContent, setEditedContent] = useState(''); // fallback for non-soap notes
  const [activeSection, setActiveSection] = useState('metadata');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [codeSearchResults, setCodeSearchResults] = useState<ClinicalCode[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<ClinicalCode[]>([]);
  const [workingDiagnoses, setWorkingDiagnoses] = useState<string[]>([]);
  const [workingDiagnosisInput, setWorkingDiagnosisInput] = useState('');
  const [isSearchingCodes, setIsSearchingCodes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sections = [
    { id: 'metadata', label: 'Info' },
    { id: 'subjective', label: 'Subjective' },
    { id: 'objective', label: 'Objective' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'plan', label: 'Plan' },
  ];

  useEffect(() => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title || '');
      setEditedContent(selectedNote.content || '');
      if (selectedNote.type === 'soap') {
        setEditedSubjective(selectedNote.data?.subjective || '');
        setEditedObjective(selectedNote.data?.objective || '');
        setEditedAssessment(selectedNote.data?.assessment || '');
        setEditedPlan(selectedNote.data?.plan || '');
        setSelectedCodes((selectedNote.data?.icd10Codes || []).map((c: string) => ({ code: c, display: 'Associated Diagnosis' })));
        setWorkingDiagnoses(selectedNote.data?.workingDiagnoses || []);
      }
      setIsEditing(false);
      setActiveSection('metadata');
    }
  }, [selectedNote]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const toggleCode = (code: ClinicalCode) => {
    setSelectedCodes(prev => 
      prev.find(c => c.code === code.code) 
        ? prev.filter(c => c.code !== code.code)
        : [...prev, code]
    );
    setCodeSearchQuery('');
    setCodeSearchResults([]);
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

  const handleSave = async () => {
    if (!selectedNote || selectedNote.type !== 'soap') return;
    
    setIsSaving(true);
    try {
      await updateSOAPNote(patientId, selectedNote.id, {
        title: editedTitle,
        subjective: editedSubjective,
        objective: editedObjective,
        assessment: editedAssessment,
        plan: editedPlan,
        icd10Codes: selectedCodes.map(c => c.code),
        workingDiagnoses,
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title || '');
      setEditedContent(selectedNote.content || '');
      if (selectedNote.type === 'soap') {
        setEditedSubjective(selectedNote.data?.subjective || '');
        setEditedObjective(selectedNote.data?.objective || '');
        setEditedAssessment(selectedNote.data?.assessment || '');
        setEditedPlan(selectedNote.data?.plan || '');
        setSelectedCodes((selectedNote.data?.icd10Codes || []).map((c: string) => ({ code: c, display: 'Associated Diagnosis' })));
        setWorkingDiagnoses(selectedNote.data?.workingDiagnoses || []);
      }
    }
    setIsEditing(false);
  };

  // Sections navigation helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(`viewer-section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    final: 'bg-green-100 text-green-800',
    amended: 'bg-blue-100 text-blue-800',
  };

  if (!selectedNote) return (
    <div className="flex flex-col items-center justify-center h-full text-[#A19F9D] p-12 text-center bg-white rounded-2xl border border-[#EDEBE9]">
      <FileText className="h-12 w-12 mb-4 opacity-20" />
      <p className="text-sm font-medium">Select a note to view clinical details</p>
    </div>
  );

  const status = selectedNote.type === 'intake' ? 'final' : 'amended';
  const tags = selectedNote.type === 'intake' ? ['Intake', 'Patient Reported'] : ['SOAP', 'Clinical'];

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#EDEBE9] overflow-hidden shadow-sm relative">
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-[73px] bottom-0 w-40 bg-[#FAFAFA] border-r border-[#EDEBE9] py-6 px-3 z-10 hidden md:block"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#616161] uppercase tracking-[0.08em] px-2 mb-3">Sections</p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-all flex items-center justify-between group ${
                    activeSection === section.id 
                      ? 'bg-white text-[#0078D4] shadow-sm font-bold border border-[#EDEBE9]' 
                      : 'text-[#616161] hover:bg-[#F3F2F1]'
                  }`}
                >
                  <span className="text-[11px]">{section.label}</span>
                  {activeSection === section.id && <ChevronRight className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-col flex-1 ${isEditing ? 'md:ml-40' : ''} transition-all duration-300`}>
        {/* Top App Bar */}
        <div className="bg-white border-b border-[#EDEBE9] p-4 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-[#F3F2F1] rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#0078D4]" />
            </div>
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="h-9 text-sm font-bold border-[#0078D4] focus-visible:ring-1 focus-visible:ring-[#0078D4] px-2 text-[#242424] bg-white w-[250px]"
                placeholder="Note Title"
              />
            ) : (
              <h2 className="text-sm font-bold text-[#242424]">{selectedNote.title}</h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-9 text-[11px] font-bold uppercase tracking-widest text-[#616161] hover:bg-[#F3F2F1]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={isSaving}
                  className="h-9 bg-[#0078D4] hover:bg-[#005A9E] text-[11px] font-bold uppercase tracking-widest px-4 shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                  Save Note
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-[#616161] hover:bg-[#F3F2F1]">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleEdit}
                  size="sm"
                  className="h-9 bg-[#0078D4] hover:bg-[#005A9E] text-[11px] font-bold uppercase tracking-widest px-4 shadow-sm ml-2"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit Records
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Note Content Area */}
        <ScrollArea className="flex-1 bg-[#FAFAFA]">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Note Metadata Section */}
              <div id="viewer-section-metadata" className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-[#EDEBE9] p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-[#A19F9D] mb-1.5 uppercase tracking-widest">Clinician</div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#0078D4] rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                          {selectedNote.author.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#242424]">{selectedNote.author}</div>
                          <div className="text-[10px] text-[#616161] font-medium uppercase tracking-tight">Internal Medicine</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#A19F9D] mb-1.5 uppercase tracking-widest">Timestamp</div>
                      <div className="text-xs text-[#242424] font-bold flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[#616161]" />
                        {new Date(selectedNote.timestamp).toLocaleDateString()} at {new Date(selectedNote.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#A19F9D] mb-1.5 uppercase tracking-widest">Record Info</div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#A19F9D] mb-1.5 uppercase tracking-widest">Encounter Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 bg-[#F3F2F1] text-[#616161] rounded border border-[#EDEBE9]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="p-4 bg-[#F3F9FD] rounded-xl border border-[#DEECF9] flex items-start gap-3 shadow-sm">
                    <ClipboardCheck className="w-5 h-5 text-[#0078D4] mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-[#004E8C] uppercase tracking-widest">Audit Trail Active</p>
                      <p className="text-[12px] text-[#242424] leading-relaxed">
                        All clinical modifications are tracked. Significant changes to assessment or plan will require re-signing the encounter record.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Note Body Sections */}
              <div className="space-y-4">
                {selectedNote.type === 'soap' ? (
                  <>
                    <div id="viewer-section-subjective" className="bg-white rounded-xl shadow-sm border border-[#EDEBE9] overflow-hidden">
                      <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F3F2F1] flex items-center gap-2">
                        <div className="h-5 w-5 bg-[#0078D4]/10 text-[#0078D4] rounded flex items-center justify-center text-[10px] font-black">S</div>
                        <span className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Subjective</span>
                      </div>
                      <div className="p-4">
                        {isEditing ? (
                          <textarea
                            value={editedSubjective}
                            onChange={(e) => setEditedSubjective(e.target.value)}
                            className="w-full min-h-[120px] p-4 text-[13px] text-[#242424] bg-[#FAFAFA] border border-[#8A8886] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0078D4] resize-none leading-relaxed"
                            placeholder="Patient reported symptoms and history..."
                          />
                        ) : (
                          <p className="text-[13px] text-[#242424] leading-relaxed whitespace-pre-wrap">{selectedNote.data?.subjective}</p>
                        )}
                      </div>
                    </div>

                    <div id="viewer-section-objective" className="bg-white rounded-xl shadow-sm border border-[#EDEBE9] overflow-hidden">
                      <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F3F2F1] flex items-center gap-2">
                        <div className="h-5 w-5 bg-[#107C10]/10 text-[#107C10] rounded flex items-center justify-center text-[10px] font-black">O</div>
                        <span className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Objective</span>
                      </div>
                      <div className="p-4">
                        {isEditing ? (
                          <textarea
                            value={editedObjective}
                            onChange={(e) => setEditedObjective(e.target.value)}
                            className="w-full min-h-[120px] p-4 text-[13px] text-[#242424] bg-[#FAFAFA] border border-[#8A8886] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0078D4] resize-none leading-relaxed"
                            placeholder="Physical findings and vitals..."
                          />
                        ) : (
                          <p className="text-[13px] text-[#242424] leading-relaxed whitespace-pre-wrap">{selectedNote.data?.objective}</p>
                        )}
                      </div>
                    </div>

                    <div id="viewer-section-assessment" className="bg-white rounded-xl shadow-sm border border-[#EDEBE9] overflow-hidden">
                      <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F3F2F1] flex items-center gap-2">
                        <div className="h-5 w-5 bg-[#D13438]/10 text-[#D13438] rounded flex items-center justify-center text-[10px] font-black">A</div>
                        <span className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Assessment</span>
                      </div>
                      <div className="p-4 space-y-4">
                        {isEditing ? (
                          <>
                            <textarea
                              value={editedAssessment}
                              onChange={(e) => setEditedAssessment(e.target.value)}
                              className="w-full min-h-[120px] p-4 text-[13px] text-[#242424] bg-[#FAFAFA] border border-[#8A8886] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0078D4] resize-none leading-relaxed"
                              placeholder="Clinical diagnosis and analysis..."
                            />
                            
                            <div className="pt-4 border-t border-[#F3F2F1]">
                              <Label className="text-[11px] font-bold text-[#616161] uppercase tracking-widest mb-2 block">Linked Diagnostic Codes</Label>
                              <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#616161]" />
                                  <Input 
                                    value={codeSearchQuery}
                                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                                    placeholder="Search ICD-10 registry..."
                                    className="pl-9 h-10 text-xs bg-[#FAFAFA]"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setIsSearchingCodes(true);
                                        searchICD10(codeSearchQuery).then(res => {
                                          setCodeSearchResults(res);
                                          setIsSearchingCodes(false);
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={isSearchingCodes || !codeSearchQuery}
                                  onClick={async () => {
                                    setIsSearchingCodes(true);
                                    const results = await searchICD10(codeSearchQuery);
                                    setCodeSearchResults(results);
                                    setIsSearchingCodes(false);
                                  }}
                                  className="h-10 border-[#8A8886]"
                                >
                                  {isSearchingCodes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                </Button>
                              </div>

                              <AnimatePresence>
                                {codeSearchResults.length > 0 && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-2 bg-white border border-[#EDEBE9] rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto z-50 sticky"
                                  >
                                    <div className="px-3 py-1 bg-[#FAFAFA] border-b border-[#EDEBE9] flex justify-between items-center sticky top-0 bg-white">
                                      <span className="text-[9px] font-bold text-[#A19F9D] uppercase tracking-wider">Results</span>
                                      <button onClick={() => setCodeSearchResults([])} className="text-[#A19F9D] hover:text-[#242424]"><X className="h-3 w-3" /></button>
                                    </div>
                                    {codeSearchResults.map(code => (
                                      <button
                                        key={code.code}
                                        onClick={() => toggleCode(code)}
                                        className="w-full text-left px-3 py-2 hover:bg-[#F3F9FD] border-b border-[#F3F2F1] last:border-0"
                                      >
                                        <div className="text-[11px] font-bold text-[#0078D4]">{code.code}</div>
                                        <div className="text-[12px] text-[#242424]">{code.display}</div>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedCodes.map(code => (
                                  <Badge key={code.code} className="bg-[#DEECF9] text-[#005A9E] border-none px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5">
                                    {code.code}: {code.display.substring(0, 30)}...
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCode(code)} />
                                  </Badge>
                                ))}
                                {selectedCodes.length === 0 && <span className="text-[10px] text-[#A19F9D] italic">No codes linked</span>}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-[#F3F2F1] space-y-4">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-[#616161] uppercase tracking-widest block">Working Clinical Diagnoses</Label>
                                <p className="text-[10px] text-[#A19F9D]">Add clinical findings managed outside formal coding.</p>
                              </div>
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="Enter working diagnosis..." 
                                  value={workingDiagnosisInput}
                                  onChange={(e) => setWorkingDiagnosisInput(e.target.value)}
                                  className="h-10 text-xs bg-[#FAFAFA]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addWorkingDiagnosis();
                                    }
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={addWorkingDiagnosis}
                                  className="h-10 border-[#8A8886]"
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {workingDiagnoses.map(diag => (
                                  <Badge key={diag} className="bg-[#FFF4F4] text-[#A4262C] border-none px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5">
                                    {diag}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeWorkingDiagnosis(diag)} />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-[13px] text-[#242424] leading-relaxed whitespace-pre-wrap">{selectedNote.data?.assessment}</p>
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F3F2F1]">
                              {(selectedNote.data?.icd10Codes || []).map((code: string) => (
                                <Badge key={code} variant="secondary" className="bg-[#F3F2F1] text-[#616161] border-none px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">
                                  {code}
                                </Badge>
                              ))}
                              {(selectedNote.data?.workingDiagnoses || []).map((diag: string) => (
                                <Badge key={diag} variant="secondary" className="bg-[#FFF4F4] text-[#A4262C] border-none px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">
                                  {diag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div id="viewer-section-plan" className="bg-white rounded-xl shadow-sm border border-[#EDEBE9] overflow-hidden">
                      <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F3F2F1] flex items-center gap-2">
                        <div className="h-5 w-5 bg-[#5C2D91]/10 text-[#5C2D91] rounded flex items-center justify-center text-[10px] font-black">P</div>
                        <span className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Plan</span>
                      </div>
                      <div className="p-4">
                        {isEditing ? (
                          <textarea
                            value={editedPlan}
                            onChange={(e) => setEditedPlan(e.target.value)}
                            className="w-full min-h-[300px] p-4 text-[13px] text-[#242424] bg-[#FAFAFA] border border-[#8A8886] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0078D4] resize-none leading-relaxed font-mono text-xs"
                            placeholder="Next steps, medications, and follow-up..."
                          />
                        ) : (
                          <p className="text-[13px] text-[#242424] leading-relaxed whitespace-pre-wrap font-sans">{selectedNote.data?.plan}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div id="viewer-section-metadata" className="bg-white rounded-xl shadow-sm border border-[#EDEBE9] overflow-hidden">
                    <div className="p-6">
                      {isEditing ? (
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full min-h-[500px] p-6 font-mono text-[13px] text-[#242424] bg-[#FAFAFA] border border-[#8A8886] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 resize-y leading-relaxed"
                          placeholder="Enter clinical note content..."
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#242424]">
                          {selectedNote.content}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Block */}
              {!isEditing && (
                <div className="bg-[#F8F9FA] rounded-xl border border-[#EDEBE9] p-5 shrink-0 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-[#A19F9D] mb-1.5 uppercase tracking-widest">Electronically Certified By</div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full bg-[#107C10] flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-[#242424]">{selectedNote.author}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-[#616161] text-right uppercase tracking-tight">
                    Secured Timestamp<br/>
                    {new Date(selectedNote.timestamp).toLocaleDateString()} at {new Date(selectedNote.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}


