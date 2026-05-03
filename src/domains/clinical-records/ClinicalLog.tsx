import { useState, useMemo } from 'react';
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

export function ClinicalLog({ patientId }: { patientId: string }) {
  const { clinicalIntakes } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const intake = clinicalIntakes[patientId];
  
  // Combine intake and health records into a single timeline
  const timeline = useMemo(() => {
    const items: any[] = [];
    
    // Add intake if exists
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

    // Add SOAP notes / Clinical records from Firestore
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

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [intake, clinicalData.clinical_records]);

  const filteredTimeline = timeline.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) {
      return timeline[0] || null;
    }
    return timeline.find(it => it.id === selectedNoteId) || timeline[0];
  }, [selectedNoteId, timeline]);

  const renderNoteContent = () => {
    if (!selectedNote) return (
      <div className="flex flex-col items-center justify-center h-full text-[#A19F9D] p-12 text-center">
        <FileText className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">Select a note to view clinical details</p>
      </div>
    );

    if (selectedNote.type === 'intake') {
      const data = selectedNote.data;
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#242424]">Clinical Intake Summary</h3>
            <Badge className="bg-[#DEECF9] text-[#0078D4] border-none uppercase text-[10px] font-bold">Primary Record</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Chief Complaint</label>
              <p className="text-sm text-[#242424] font-medium leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#EDEBE9]">
                {data.chiefComplaint}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">History of Present Illness</label>
              <p className="text-sm text-[#242424] leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#EDEBE9]">
                {data.historyOfPresentIllness}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Medical History</label>
              <p className="text-sm text-[#242424] leading-relaxed">{data.medicalHistory}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Allergies</label>
              <p className="text-sm text-[#D13438] font-bold">{data.allergies}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F3F2F1]">
            <h4 className="text-xs font-bold text-[#616161] uppercase tracking-widest mb-3">Review of Systems</h4>
            <div className="p-4 bg-[#F3F2F1]/50 rounded-xl text-sm text-[#242424] leading-relaxed italic">
              "{data.reviewOfSystems}"
            </div>
          </div>
        </div>
      );
    }

    // Default: SOAP Note
    const data = selectedNote.data;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-[#242424]">Clinical Progress Note (SOAP)</h3>
            <span className="text-[10px] text-[#A19F9D] font-bold uppercase tracking-widest">Note ID: {selectedNote.id}</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-widest gap-2">
            <Edit className="h-3.5 w-3.5" /> Edit Note
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-4 w-4 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[9px] font-bold">S</span>
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Subjective</label>
            </div>
            <p className="text-sm text-[#242424] leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#EDEBE9]">
              {data.subjective}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-4 w-4 rounded-full bg-[#107C10] text-white flex items-center justify-center text-[9px] font-bold">O</span>
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Objective</label>
            </div>
            <p className="text-sm text-[#242424] leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#EDEBE9]">
              {data.objective}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-4 w-4 rounded-full bg-[#845701] text-white flex items-center justify-center text-[9px] font-bold">A</span>
                <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Assessment</label>
              </div>
              <p className="text-sm text-[#242424] leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#EDEBE9]">
                {data.assessment}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-4 w-4 rounded-full bg-[#5C2D91] text-white flex items-center justify-center text-[9px] font-bold">P</span>
                <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Plan</label>
              </div>
              <p className="text-sm text-[#242424] leading-relaxed bg-[#FAFAFA] p-3 rounded-lg border border-[#EDEBE9]">
                {data.plan}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 bg-[#F8F9FA]/50 p-4 rounded-3xl border border-[#EDEBE9]">
      {/* Sidebar: Timeline Log */}
      <div className="lg:col-span-4 flex flex-col min-h-0 gap-4">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#616161]" />
            <h3 className="text-sm font-bold text-[#242424] uppercase tracking-widest opacity-80">Full Clinical Log</h3>
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedNoteId(item.id)}
                  className={`p-4 cursor-pointer transition-all relative ${
                    selectedNoteId === item.id || (!selectedNoteId && timeline[0]?.id === item.id)
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

      {/* Main Content: Viewer/Editor */}
      <div className="lg:col-span-8 flex flex-col min-h-0">
        <Card className="flex-1 border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col">
          <CardHeader className="py-3 px-6 border-b border-[#F3F2F1] bg-[#FAFAFA] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  selectedNote?.type === 'intake' ? 'bg-[#0078D4] text-white' : 'bg-[#EDEBE9] text-[#616161]'
                }`}>
                  {selectedNote?.type === 'intake' ? <ClipboardCheck className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-[#242424] uppercase tracking-widest">{selectedNote?.title || 'Patient Record'}</CardTitle>
                  <p className="text-[10px] font-medium text-[#616161]">Clinical Documentation Detail</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#F3F2F1]">
                  <Search className="h-4 w-4 text-[#A19F9D]" />
                </Button>
                <div className="h-6 w-[1px] bg-[#EDEBE9] mx-1" />
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-[#616161] uppercase tracking-widest gap-2">
                  <Eye className="h-3.5 w-3.5" /> Full Screen
                </Button>
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-8">
              {renderNoteContent()}
            </CardContent>
          </ScrollArea>
          <div className="p-4 bg-[#F8F9FA] border-t border-[#EDEBE9] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#107C10]" />
                <span className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Last Modified: {selectedNote ? new Date(selectedNote.timestamp).toLocaleString() : '--'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-[#0078D4] uppercase tracking-widest">Download PDF</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
