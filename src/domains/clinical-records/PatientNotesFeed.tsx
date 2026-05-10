import React, { useState, useEffect } from 'react';
import { 
  FileText, AlertTriangle, AlertCircle, 
  X, Check, Edit, ChevronDown, Info, 
  CheckCircle, Filter, Plus, Mic,
  LayoutDashboard, User, Clock, Search,
  ArrowLeft,
  Sparkles,
  Database,
  ChevronLeft,
  ChevronRight,
  Pill
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { transition } from '../../lib/motion';
import { SOAPNoteModal } from './SOAPNoteModal';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { saveSOAPNote } from '../../services/clinicalFirestoreService';

interface Note {
  id: string;
  title: string;
  author: string;
  specialty: string;
  date: string;
  time: string;
  content: string;
  tags: string[];
  status: 'draft' | 'final' | 'amended' | 'signed';
  priority?: 'routine' | 'urgent' | 'critical';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

const sampleNotes: Partial<Note>[] = [
  {
    title: 'Post-Appendectomy Follow-up & Chronic Management',
    author: 'Dr. Sarah Mitchell',
    specialty: 'Internal Medicine',
    content: `Chief Complaint: Follow-up for Hypertension and Type 2 Diabetes Mellitus.
    
History of Present Illness:
Patient Eleanor Vance, 42-year-old female, presents for chronic management. She has a history of hypertension and T2DM. Patient also reports significant alcohol consumption (heavy drinker). Past surgical history notable for appendectomy.

Assessment:
1. Essential Hypertension - currently suboptimal control.
2. Type 2 Diabetes Mellitus - continuing current regimen.
3. Heavy Alcohol Use - counseled on reduction.

Plan:
1. Continue Lisinopril 10mg PO OD.
2. Continue Rosuvastatin 20mg PO OD.
3. Lifestyle modification counseling provided.
4. Labs ordered: HbA1c, CMP, Lipid Panel.`,
    tags: ['Hypertension', 'T2DM', 'Alcohol Use'],
    status: 'final',
    priority: 'routine',
  },
];

interface NoteCardProps {
  note: Note;
  isExpanded: boolean;
  onToggleExpand: () => void;
  patientId: string;
  key?: React.Key;
  canWrite?: boolean;
}

function NoteCard({ note, isExpanded, onToggleExpand, patientId, canWrite }: NoteCardProps) {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    final: 'bg-green-100 text-green-800 border-green-300',
    signed: 'bg-green-100 text-green-800 border-green-300',
    amended: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const priorityColors = {
    routine: 'border-l-gray-400',
    urgent: 'border-l-orange-500',
    critical: 'border-l-red-600',
  };

  const priorityIcons = {
    routine: <FileText className="w-5 h-5 text-gray-500" />,
    urgent: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    critical: <AlertCircle className="w-5 h-5 text-red-600" />,
  };

  const hasStructuredData = note.subjective || note.objective || note.assessment || note.plan;
  const displayContent = hasStructuredData 
    ? `${note.subjective ? `Subjective:\n${note.subjective}\n\n` : ''}${note.objective ? `Objective:\n${note.objective}\n\n` : ''}${note.assessment ? `Assessment:\n${note.assessment}\n\n` : ''}${note.plan ? `Plan:\n${note.plan}` : ''}`.trim()
    : note.content;

  return (
    <div 
      id={`note-${note.id}`}
      className={`bg-white rounded-2xl shadow-sm border border-[#EDEBE9] border-l-4 ${priorityColors[note.priority || 'routine']} overflow-hidden transition-all hover:shadow-md`}
    >
      {/* Card Header */}
      <div className="p-4 cursor-pointer" onClick={() => onToggleExpand()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              {priorityIcons[note.priority || 'routine']}
            </div>
            <div className="flex-1">
              <h3 className="text-md font-bold text-[#242424] mb-1">{note.title}</h3>
              <div className="flex items-center gap-3 text-xs text-[#616161]">
                <div className="flex items-center gap-1.5 font-medium">
                  <div className="w-5 h-5 bg-[#0078D4] rounded-full flex items-center justify-center text-white text-[9px] font-black">
                    {note.author ? note.author.split(' ').map(n => n[0]).join('') : 'UN'}
                  </div>
                  <span>{note.author || 'Clinical Staff'}</span>
                </div>
                <span className="opacity-30">•</span>
                <span className="font-medium">{note.specialty || 'General Practice'}</span>
                <span className="opacity-30">•</span>
                <span className="font-medium">{note.date} at {note.time}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`text-[8px] font-black tracking-widest px-1.5 py-0 rounded ${statusColors[note.status as keyof typeof statusColors] || statusColors.draft} shadow-none border-none`}>
                  {(note.status || 'draft').toUpperCase()}
                </Badge>
                {(note.tags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] font-bold px-1.5 py-0 bg-gray-100 text-[#616161] rounded border-none shadow-none"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {canWrite && (
              <SOAPNoteModal patientId={patientId} initialNote={note}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-[#616161]" />
                </Button>
              </SOAPNoteModal>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 text-[#616161] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Card Content - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.entrance}
            className="border-t border-[#F3F2F1] bg-[#FAFAFA]"
          >
            <div className="p-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#242424] bg-white p-5 rounded-xl border border-[#EDEBE9]">
                  {displayContent}
                </pre>
              </div>

              {/* Signature Block */}
              {(note.status === 'final' || note.status === 'signed') && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-[#EDEBE9] border-l-2 border-l-[#107C10]">
                  <div className="flex items-center gap-2 text-[10px] text-[#616161] font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-[#107C10]" />
                    <span>Electronically signed by {note.author || 'Clinical Provider'} on {note.date} at {note.time}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PatientNotesFeedProps {
  patient: any;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onViewMedications?: () => void;
  canWrite?: boolean;
}

export function PatientNotesFeed({ 
  patient, 
  onClose, 
  isExpanded, 
  onToggleExpand,
  onViewMedications,
  canWrite
}: PatientNotesFeedProps) {
  const patientId = patient?.id || 'p-1';
  const clinicalData = usePatientClinicalData(patientId);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'final' | 'amended'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'routine' | 'urgent' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Map internal database status to display status
  const getMappedStatus = (status: string): any => {
    if (status === 'signed') return 'final';
    return status;
  };

  const processedNotes = (clinicalData.clinical_records as any[]).map(record => {
    const rawDate = record.createdAt?.seconds ? new Date(record.createdAt.seconds * 1000) : new Date();
    return {
      id: record.id,
      title: record.title || 'Clinical SOAP Note',
      author: record.authorName || 'Clinical Staff',
      specialty: record.specialty || 'General Medicine',
      date: rawDate.toLocaleDateString(),
      time: rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: record.content || '',
      subjective: record.subjective,
      objective: record.objective,
      assessment: record.assessment,
      plan: record.plan,
      tags: record.tags || [],
      status: getMappedStatus(record.status),
      priority: record.priority || 'routine'
    };
  });

  const toggleExpand = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      for (const note of sampleNotes) {
        await saveSOAPNote(patientId, {
          title: note.title,
          authorName: note.author,
          specialty: note.specialty,
          content: note.content,
          tags: note.tags,
          status: 'signed',
          priority: note.priority
        });
      }
    } catch (error) {
      console.error('Failed to seed notes:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredNotes = processedNotes.filter(note => {
    const statusMatch = filterStatus === 'all' || note.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || note.priority === filterPriority;
    const searchMatch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      note.author.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && priorityMatch && searchMatch;
  });

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]/30 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex pt-[3px]">
        {/* Feed Container */}
        <div className="flex-1 overflow-hidden flex flex-col mt-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  {onToggleExpand && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleExpand}
                      className="h-8 w-8 rounded-lg hover:bg-[#F3F2F1] text-[#616161]"
                      title={isExpanded ? "Restore Layout" : "Full Screen Documentation"}
                    >
                      {isExpanded ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                  )}
                  <div>
                    <h1 className="text-xl font-black text-[#242424] tracking-tight">Clinical Documentation</h1>
                    <p className="text-[11px] font-bold text-[#616161] uppercase tracking-widest opacity-60">Full Patient Longitudinal Record</p>
                  </div>
                </div>
                {processedNotes.length === 0 && !clinicalData.loading && canWrite && (
                   <Button 
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    variant="outline" 
                    className="h-10 px-4 border-[#EDEBE9] hover:bg-[#F3F9FD] text-xs font-black uppercase tracking-widest flex items-center gap-2"
                   >
                    {isSeeding ? <Clock className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Seed Longitudinal Record
                  </Button>
                )}
              </div>

              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#EDEBE9] p-3 mb-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F2F1] rounded-xl flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-[#A19F9D]" />
                  <input 
                    type="text"
                    placeholder="Search longitudinal record..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full text-[#242424] font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#616161] uppercase tracking-widest opacity-70 ml-2">
                    <Filter className="h-3 w-3" />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="h-8 px-2 bg-white border border-[#EDEBE9] rounded-lg text-[10px] font-bold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
                  >
                    <option value="all">Any Status</option>
                    <option value="draft">Drafts</option>
                    <option value="final">Finalized</option>
                    <option value="amended">Amended</option>
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="h-8 px-2 bg-white border border-[#EDEBE9] rounded-lg text-[10px] font-bold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
                  >
                    <option value="all">Any Priority</option>
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical Only</option>
                  </select>
                </div>
              </div>

              {/* Notes Feed */}
              <div className="space-y-3">
                {clinicalData.loading ? (
                  <div className="py-20 text-center">
                    <Clock className="w-10 h-10 text-[#0078D4] animate-spin mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-bold text-[#A19F9D] uppercase tracking-widest">Synchronizing Encounters...</p>
                  </div>
                ) : filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isExpanded={expandedNotes.has(note.id)}
                    onToggleExpand={() => toggleExpand(note.id)}
                    patientId={patientId}
                    canWrite={canWrite}
                  />
                ))}
              </div>

              {filteredNotes.length === 0 && !clinicalData.loading && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#EDEBE9]">
                  <FileText className="w-12 h-12 text-[#EDEBE9] mx-auto mb-4" />
                  <p className="text-sm font-bold text-[#A19F9D]">No clinical records match your selection.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supporting Rail - Quick Actions */}
        {canWrite && (
          <div className="hidden lg:flex w-80 bg-white border-l border-[#EDEBE9] flex-col overflow-hidden">
          {/* Row 1: Quick Documentation */}
          <div className="flex-1 border-b border-[#F3F2F1] bg-[#FAFAFA]/50 overflow-hidden pt-[23px]">
            <div className="p-6 pt-[22px]">
              <h2 className="text-xs font-black text-[#242424] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-[#0078D4]" />
                Quick Documentation
              </h2>

              <div className="space-y-3">
                <SOAPNoteModal patientId={patientId}>
                  <Button variant="outline" className="w-full justify-start h-12 px-4 border-[#EDEBE9] hover:bg-[#F3F9FD] hover:text-[#0078D4] hover:border-[#0078D4] transition-all group rounded-xl">
                    <div className="h-8 w-8 rounded-lg bg-[#F3F2F1] group-hover:bg-[#DEECF9] flex items-center justify-center mr-3 transition-colors">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">New Note</span>
                  </Button>
                </SOAPNoteModal>
                
                <Button variant="outline" disabled className="w-full justify-start h-12 px-4 border-[#EDEBE9] opacity-50 cursor-not-allowed transition-all group rounded-xl">
                  <div className="h-8 w-8 rounded-lg bg-[#F3F2F1] flex items-center justify-center mr-3">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] font-black uppercase tracking-widest">AI Dictation</span>
                    <span className="text-[8px] font-bold text-[#A19F9D] uppercase tracking-widest">Coming Soon</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: Current Medication */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 pb-2">
              <h3 className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Pill className="h-3.5 w-3.5 text-[#107C10]" />
                Current Medication
              </h3>
            </div>
            
            <ScrollArea className="flex-1 px-6 pb-2">
              <div className="space-y-3">
                {clinicalData.prescriptions.length > 0 ? (
                  clinicalData.prescriptions.map((px: any, i: number) => (
                    <div key={i} className="p-3 bg-[#F8F9FA] rounded-xl border border-[#EDEBE9] hover:border-[#DEECF9] hover:bg-[#F3F9FD] transition-all">
                      <div className="text-[11px] font-bold text-[#242424] leading-tight">{px.medicationName}</div>
                      <div className="text-[9px] text-[#616161] font-medium mt-1">{px.dosage} • {px.frequency}</div>
                    </div>
                  ))
                ) : (
                  [
                    { name: 'Lisinopril 10 MG Oral Tablet', dose: '10 MG', freq: 'Once daily' },
                    { name: 'Rosuvastatin 20 MG Oral Tablet', dose: '20 MG', freq: 'Once daily' },
                  ].map((med, i) => (
                    <div key={i} className="p-3 bg-[#F8F9FA] rounded-xl border border-[#EDEBE9]">
                      <div className="text-[11px] font-bold text-[#242424] leading-tight">{med.name}</div>
                      <div className="text-[9px] text-[#616161] font-medium mt-1">{med.dose} • {med.freq}</div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-6 pt-2 bg-[#FAFAFA]/50 border-t border-[#F3F2F1]">
              <Button 
                variant="link" 
                onClick={onViewMedications}
                className="w-full text-[10px] font-black text-[#107C10] h-auto p-0 uppercase tracking-widest hover:text-[#0b590b]"
              >
                View Full Medication List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

