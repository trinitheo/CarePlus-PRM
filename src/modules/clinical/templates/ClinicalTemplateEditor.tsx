import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Save, 
  History, 
  ChevronDown, 
  Stethoscope,
  Info,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { summarizeClinicalNote } from '../../../services/clinicalService';
import { ScrollArea } from '../../../components/ui/scroll-area';

export function ClinicalTemplateEditor() {
  const [activeTemplate, setActiveTemplate] = useState('SOAP');
  const [content, setContent] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    const fullText = `Subjective: ${content.subjective}\nObjective: ${content.objective}\nAssessment: ${content.assessment}\nPlan: ${content.plan}`;
    const result = await summarizeClinicalNote(fullText);
    if (result) setSummary(result);
    setIsSummarizing(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-segoe">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#0078D4]" />
            Documentation Suite
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">AI-augmented clinical charting and template management</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-11 rounded-xl font-bold px-6 border-[#EDEBE9]">
              <History className="h-4 w-4 mr-2" />
              Chart History
           </Button>
           <Button 
             className="h-11 rounded-xl font-black px-8 bg-[#242424] text-white hover:bg-black"
             disabled={isSaving}
           >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Sign & Lock Record
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[75vh]">
         {/* Left Side: Templates & Outline */}
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-[#A19F9D] mb-4 tracking-widest px-2">Active Template</h3>
               <div className="space-y-1">
                  {['SOAP Note', 'Procedure Note', 'Follow-up', 'Telehealth'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setActiveTemplate(t)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTemplate === t ? 'bg-[#DEECF9] text-[#0078D4]' : 'text-[#616161] hover:bg-[#FAFAFA]'}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 italic text-xs text-amber-800 leading-relaxed font-medium">
               <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Compliance Alert</span>
               </div>
               Ensure all procedure-specific risks are documented in the Assessment section before signing.
            </div>
         </div>

         {/* Center: Editor */}
         <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-[#FAFAFA] border-b border-[#F3F2F1] flex items-center justify-between">
               <div className="flex items-center gap-2 px-2">
                  <Stethoscope className="h-4 w-4 text-[#0078D4]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#242424]">Clinical Encounter Entry</span>
               </div>
            </div>
            <ScrollArea className="flex-1 p-8">
               <div className="space-y-8">
                  {Object.entries(content).map(([key, value]) => (
                    <div key={key} className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A19F9D] px-2">{key}</label>
                       <textarea 
                         value={value}
                         onChange={(e) => setContent(prev => ({ ...prev, [key]: e.target.value }))}
                         placeholder={`Enter ${key} details...`}
                         className="w-full h-32 p-5 bg-[#FBFBFB] border border-[#F3F2F1] rounded-2xl focus:ring-2 focus:ring-[#0078D4]/10 focus:border-[#0078D4] outline-none text-sm leading-relaxed transition-all font-medium text-[#242424]"
                       />
                    </div>
                  ))}
               </div>
            </ScrollArea>
         </div>

         {/* Right Side: AI Panel */}
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#242424] p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="h-20 w-20 text-white" />
               </div>
               <h3 className="text-white text-lg font-black tracking-tight mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  AI Summary
               </h3>
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-6">Generative Synthesis</p>
               
               <ScrollArea className="h-64 mb-6 bg-white/5 rounded-xl border border-white/10 p-4">
                  {summary ? (
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{summary}</p>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-10 text-center font-medium">Ready to synthesize documentation into clinical summary...</p>
                  )}
               </ScrollArea>

               <Button 
                 onClick={handleSummarize}
                 disabled={isSummarizing || !content.assessment}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-11 rounded-xl shadow-lg shadow-blue-600/30 gap-2 border-none"
               >
                  {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                  Generate Abstract
               </Button>
            </div>

            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 font-segoe">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-4">Integrity Status</h4>
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                     <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                     <p className="text-sm font-black text-[#242424]">Draft Synchronized</p>
                     <p className="text-[10px] font-bold text-emerald-700">Audit trail active</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
