import React from 'react';
import { MedicalRecordEntry } from '../../types';
import { useUnifiedDocumentStream } from '../../hooks/useUnifiedDocumentStream';
import { 
  FileText, 
  Pill, 
  Send, 
  Stethoscope as ProceduresIcon, 
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { motion } from 'motion/react';

const getIconForType = (type: string) => {
    switch (type) {
        case 'InitialEncounter':
        case 'FollowUp':
        case 'ClinicalRecord':
            return <FileText className="h-4.5 w-4.5 text-sky-500" />;
        case 'Prescription':
            return <Pill className="h-4.5 w-4.5 text-green-500" />;
        case 'Referral':
            return <Send className="h-4.5 w-4.5 text-purple-500" />;
        case 'Procedure':
            return <ProceduresIcon className="h-4.5 w-4.5 text-orange-500" />;
        case 'AISummary':
            return <Sparkles className="h-4.5 w-4.5 text-indigo-500" />;
        default:
            return <ClipboardList className="h-4.5 w-4.5 text-slate-500" />;
    }
};

const getTitleForType = (type: string) => {
    switch (type) {
        case 'InitialEncounter': return 'Initial Encounter';
        case 'FollowUp': return 'Follow-up Note';
        case 'AISummary': return 'AI Summary';
        case 'ClinicalRecord': return 'Progress Note';
        default: return type.replace(/([A-Z])/g, ' $1').trim();
    }
};

interface ClinicalTimelineCardProps {
    records: any[];
}

export const ClinicalTimelineCard: React.FC<ClinicalTimelineCardProps> = ({ records }) => {
    const documentStream = useUnifiedDocumentStream(records);

    return (
        <div className="bg-white p-4 rounded-lg border border-[#EDEBE9] shadow-sm">
            <h2 className="text-sm font-bold text-[#242424] uppercase tracking-widest mb-4 opacity-80 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0078D4]" />
                Clinical Timeline
            </h2>
            
            <div className="relative pl-6">
                {/* Vertical line - Microsoft Fluent style (subtle) */}
                <div className="absolute left-9 top-1 bottom-1 w-[1px] bg-[#EDEBE9]"></div>

                <ul className="space-y-6 relative">
                    {documentStream.map((doc, idx) => (
                        <motion.li 
                            key={doc.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative flex items-start"
                        >
                            {/* Marker */}
                            <div className="absolute -left-[1.35rem] top-0 h-9 w-9 bg-white rounded-full flex items-center justify-center border border-[#EDEBE9] shadow-sm z-10">
                                {getIconForType(doc.type)}
                            </div>

                            <div className="ml-10 flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest bg-[#F8F9FA] px-2 py-0.5 rounded">
                                        {new Date(doc.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    {doc.type === 'AISummary' && (
                                        <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">
                                            <Sparkles className="h-2.5 w-2.5" /> High Signal
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-[13px] font-bold text-[#242424] leading-tight mb-1">
                                    {getTitleForType(doc.type)}
                                </h4>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-1 rounded-full bg-[#0078D4]" />
                                    <p className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">
                                        Provider: {doc.data.authorName}
                                    </p>
                                </div>
                                {doc.data.content && (
                                    <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#F3F2F1] text-[12px] text-[#424242] leading-relaxed line-clamp-3">
                                        {doc.data.content}
                                    </div>
                                )}
                            </div>
                        </motion.li>
                    ))}
                    
                    {documentStream.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                            <FileText className="h-10 w-10 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest text-[#616161]">No events in timeline</p>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
};
