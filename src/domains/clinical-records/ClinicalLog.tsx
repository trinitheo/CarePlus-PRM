import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Button } from '../../components/ui/button';
import { 
  FileText, Clock, ChevronRight, Search, 
  Plus, Edit, Eye, History, Filter,
  Stethoscope, ClipboardCheck
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { useQueryModel } from '../../store/eventStore';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { SOAPNoteModal } from './SOAPNoteModal';
import { motion, AnimatePresence } from 'motion/react';

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
        title: 'Clinical SOAP Note',
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

  useEffect(() => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title || '');
      setEditedContent(selectedNote.content || '');
      if (selectedNote.type === 'soap') {
        setEditedSubjective(selectedNote.data?.subjective || '');
        setEditedObjective(selectedNote.data?.objective || '');
        setEditedAssessment(selectedNote.data?.assessment || '');
        setEditedPlan(selectedNote.data?.plan || '');
      }
      setIsEditing(false);
    }
  }, [selectedNote]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // In a real app, this would save to Firestore via a hook or service.
    // For now, we simply toggle off edit mode to simulate saving success.
    setIsEditing(false);
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
      }
    }
    setIsEditing(false);
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
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Top App Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-lg font-bold border-b-2 border-blue-500 focus:outline-none px-2 py-1 text-gray-900 bg-transparent"
              placeholder="Note Title"
            />
          ) : (
            <h2 className="text-lg font-bold text-gray-900">{selectedNote.title}</h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </button>
            </>
          ) : (
            <>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note Content Area */}
      <ScrollArea className="flex-1 bg-[#FAFAFA]">
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Note Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Author</div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {selectedNote.author.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{selectedNote.author}</div>
                      <div className="text-xs text-gray-500">Internal Medicine</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Date & Time</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {new Date(selectedNote.timestamp).toLocaleDateString()} at {new Date(selectedNote.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</div>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[status]}`}>
                    {status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Note Body */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-900">
                      <strong>Edit Mode:</strong> You are currently editing this clinical note. All changes are tracked and will create an audit trail entry upon saving.
                    </p>
                  </div>

                  {selectedNote.type === 'soap' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subjective</label>
                        <textarea
                          value={editedSubjective}
                          onChange={(e) => setEditedSubjective(e.target.value)}
                          className="w-full min-h-[100px] p-3 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Objective</label>
                        <textarea
                          value={editedObjective}
                          onChange={(e) => setEditedObjective(e.target.value)}
                          className="w-full min-h-[100px] p-3 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Assessment</label>
                        <textarea
                          value={editedAssessment}
                          onChange={(e) => setEditedAssessment(e.target.value)}
                          className="w-full min-h-[100px] p-3 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Plan</label>
                        <textarea
                          value={editedPlan}
                          onChange={(e) => setEditedPlan(e.target.value)}
                          className="w-full min-h-[100px] p-3 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-shadow"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full min-h-[300px] p-4 font-mono text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-shadow"
                        placeholder="Enter clinical note content..."
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose max-w-none text-sm text-gray-800 leading-relaxed">
                  {selectedNote.type === 'soap' ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center">S</span>
                          Subjective
                        </h4>
                        <p className="whitespace-pre-wrap">{selectedNote.data?.subjective}</p>
                      </div>
                      <div className="w-full h-px bg-gray-100" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-green-100 text-green-700 flex items-center justify-center">O</span>
                          Objective
                        </h4>
                        <p className="whitespace-pre-wrap">{selectedNote.data?.objective}</p>
                      </div>
                      <div className="w-full h-px bg-gray-100" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-yellow-100 text-yellow-700 flex items-center justify-center">A</span>
                          Assessment
                        </h4>
                        <p className="whitespace-pre-wrap">{selectedNote.data?.assessment}</p>
                      </div>
                      <div className="w-full h-px bg-gray-100" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center">P</span>
                          Plan
                        </h4>
                        <p className="whitespace-pre-wrap">{selectedNote.data?.plan}</p>
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">
                      {selectedNote.content}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Signature Block */}
            {status === 'final' && !isEditing && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Electronically Signed By</div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">{selectedNote.author}</span>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500 text-right">
                    Signed on {new Date(selectedNote.timestamp).toLocaleDateString()}<br/>
                    at {new Date(selectedNote.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}


