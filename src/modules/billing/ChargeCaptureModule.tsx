import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  DollarSign, 
  FileCheck, 
  ChevronRight, 
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { suggestClinicalCodes, captureCharge } from '../../services/billingService';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';

interface ChargeCaptureProps {
  patientId: string;
  encounterText: string;
  onSuccess?: () => void;
}

export function ChargeCaptureModule({ patientId, encounterText, onSuccess }: ChargeCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [selectedCodes, setSelectedCodes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const results = await suggestClinicalCodes(encounterText);
      setSuggestions(results);
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeSelection = (code: any, type: string) => {
    const key = `${type}-${code.code}`;
    if (selectedCodes.find(c => `${c.type}-${c.code}` === key)) {
      setSelectedCodes(prev => prev.filter(c => `${c.type}-${c.code}` !== key));
    } else {
      setSelectedCodes(prev => [...prev, { ...code, type }]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const item of selectedCodes) {
        await captureCharge({
          patientId,
          code: item.code,
          description: item.description,
          amount: item.type === 'cpt' ? 150 : 0, // Placeholder pricing logic
          clinicianId: '', // Set by service
          status: 'captured'
        });
      }
      onSuccess?.();
      alert("Charges captured successfully.");
    } catch (err) {
      alert("Billing capture failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EDEBE9] shadow-2xl overflow-hidden flex flex-col h-[600px] font-segoe">
      <div className="p-6 border-b border-[#F3F2F1] bg-[#FAFAFA] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#242424] tracking-tight">Clinical Revenue Cycle</h2>
          <p className="text-[11px] font-bold text-[#A19F9D] uppercase tracking-widest mt-1">Point of Care Charge Capture</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[10px] uppercase">
          <ShieldCheck className="h-3 w-3 mr-1.5" />
          Pre-Audit Validated
        </Badge>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-6 border-r border-[#F3F2F1] flex flex-col gap-6">
           <section>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#616161] mb-4 flex items-center gap-2">
                 <FileCheck className="h-4 w-4" />
                 Clinical Context
              </h3>
              <ScrollArea className="h-32 bg-[#F8F9FA] p-4 rounded-xl border border-[#EDEBE9]">
                 <p className="text-xs font-medium text-[#616161] leading-relaxed italic">
                   {encounterText || "No clinical documentation provided for analysis."}
                 </p>
              </ScrollArea>
           </section>

           <Button 
             onClick={handleSuggest} 
             disabled={loading || !encounterText}
             className="w-full bg-[#0078D4] hover:bg-[#005A9E] text-white font-black h-12 rounded-xl shadow-lg shadow-[#0078D4]/20 gap-3"
           >
             {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
             AI-Assisted Coding
           </Button>

           {suggestions && (
             <ScrollArea className="flex-1">
               <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A19F9D] mb-3">Diagnostic (ICD-10)</h4>
                    <div className="space-y-2">
                       {suggestions.icd10.map((c: any) => (
                         <div 
                           key={c.code}
                           onClick={() => toggleCodeSelection(c, 'icd')}
                           className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedCodes.find(sc => sc.code === c.code) ? 'bg-blue-50 border-blue-200' : 'bg-white border-[#EDEBE9] hover:border-blue-200'}`}
                         >
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-[12px] font-black text-[#0078D4]">{c.code}</span>
                               {selectedCodes.find(sc => sc.code === c.code) && <ShieldCheck className="h-4 w-4 text-[#0078D4]" />}
                            </div>
                            <p className="text-[11px] font-bold text-[#242424] line-clamp-1">{c.description}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A19F9D] mb-3">Procedural (CPT)</h4>
                    <div className="space-y-2">
                       {suggestions.cpt.map((c: any) => (
                         <div 
                            key={c.code}
                            onClick={() => toggleCodeSelection(c, 'cpt')}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedCodes.find(sc => sc.code === c.code) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-[#EDEBE9] hover:border-emerald-200'}`}
                         >
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-[12px] font-black text-emerald-600">{c.code}</span>
                               {selectedCodes.find(sc => sc.code === c.code) && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                            </div>
                            <p className="text-[11px] font-bold text-[#242424] line-clamp-1">{c.description}</p>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
             </ScrollArea>
           )}
        </div>

        <div className="w-1/2 bg-[#FCFCFC] p-6 flex flex-col">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-[#616161] mb-6">Charge Selection Queue</h3>
           <ScrollArea className="flex-1">
              <div className="space-y-4">
                 {selectedCodes.map(item => (
                   <div key={`${item.type}-${item.code}`} className="bg-white p-4 rounded-xl border border-[#EDEBE9] shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${item.type === 'cpt' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <div className="flex items-start justify-between">
                         <div className="flex-1 pr-4">
                            <p className="text-[12px] font-black text-[#242424] mb-0.5">{item.code}</p>
                            <p className="text-[11px] font-medium text-[#616161] leading-tight">{item.description}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black text-[#242424]">{item.type === 'cpt' ? '$150.00' : '$0.00'}</p>
                            <p className="text-[9px] font-bold text-[#A19F9D] uppercase">Fee Schedule</p>
                         </div>
                      </div>
                   </div>
                 ))}
                 {selectedCodes.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <Search className="h-12 w-12 text-[#A19F9D] mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest text-[#A19F9D]">Queue Empty</p>
                   </div>
                 )}
              </div>
           </ScrollArea>

           <div className="pt-6 border-t border-[#F3F2F1] mt-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <p className="text-[10px] font-black uppercase text-[#A19F9D]">Est. Reimbursable</p>
                    <p className="text-2xl font-black text-[#242424] tracking-tight">
                       ${selectedCodes.reduce((acc, curr) => acc + (curr.type === 'cpt' ? 150 : 0), 0).toFixed(2)}
                    </p>
                 </div>
                 <div className="p-3 bg-blue-50 rounded-xl">
                    <DollarSign className="h-6 w-6 text-[#0078D4]" />
                 </div>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || selectedCodes.length === 0}
                className="w-full bg-[#242424] hover:bg-[#000] text-white font-black h-12 rounded-xl transition-all"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Transmit to Billing System"}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
