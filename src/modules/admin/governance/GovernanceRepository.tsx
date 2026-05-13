import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Upload, 
  Search, 
  History, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Stamp,
  FileText
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';

export function GovernanceRepository() {
  const sops = [
    { id: '1', title: 'Controlled Substance Protocol', version: 'v2.4', status: 'active', category: 'Clinical', review: 'June 2026' },
    { id: '2', title: 'Data Privacy & HIPAA Compliance', version: 'v1.1', status: 'active', category: 'Compliance', review: 'Sept 2026' },
    { id: '3', title: 'Emergency Evacuation & Biohazard', version: 'v3.0', status: 'review_required', category: 'safety', review: 'OVERDUE' },
  ];

  return (
    <div className="p-8 space-y-8 font-segoe max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-[#0078D4]" />
            Governance & Compliance
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">SOP repository, version control, and staff acknowledgment management</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 rounded-xl font-bold px-6 border-[#EDEBE9]">
              <History className="h-4 w-4 mr-2" />
              Version Logs
           </Button>
           <Button className="bg-[#242424] hover:bg-black text-white px-6 h-12 rounded-xl flex gap-2 font-black shadow-lg">
              <Upload className="h-5 w-5" />
              Upload SOP
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-[#A19F9D] mb-6 tracking-widest px-2">Compliance Health</h3>
               <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-xs font-black text-emerald-800 uppercase mb-2">Staff Training</p>
                     <p className="text-2xl font-black text-[#242424]">92%</p>
                     <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-tight">Acknowledgment Rate</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 font-medium">
                     <p className="text-xs font-black text-rose-800 uppercase mb-2">Internal Audit</p>
                     <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                        <span className="text-xs text-rose-800">3 Documents Overdue for Review</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#FAFAFA] p-6 rounded-3xl border border-[#EDEBE9]">
               <h3 className="text-[10px] font-black uppercase text-[#616161] mb-4 tracking-widest">Acknowledgment Requests</h3>
               <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-[#EDEBE9] shadow-sm">
                       <p className="text-[11px] font-black text-[#242424] mb-1">Dr. Michael Chen</p>
                       <p className="text-[9px] font-bold text-[#A19F9D] uppercase">Pending HIPAA v1.1</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-3 bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden flex flex-col h-[70vh]">
            <div className="p-6 border-b border-[#F3F2F1] flex items-center justify-between">
               <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A19F9D]" />
                  <input 
                    type="text" 
                    placeholder="Search governance repository..." 
                    className="w-full pl-12 pr-6 py-2.5 bg-[#FAFAFA] border border-[#F3F2F1] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0078D4]/20 outline-none"
                  />
               </div>
               <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#DEECF9] text-[#0078D4]">Active Matrix</button>
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#A19F9D] hover:bg-[#FAFAFA]">Archived</button>
               </div>
            </div>

            <ScrollArea className="flex-1 p-6">
               <div className="space-y-4">
                  {sops.map(sop => (
                    <div key={sop.id} className="bg-white p-6 rounded-2xl border border-[#EDEBE9] hover:border-[#DEECF9] transition-all group flex items-center justify-between">
                       <div className="flex items-center gap-5">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${sop.status === 'review_required' ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                             <FileText className="h-6 w-6" />
                          </div>
                          <div>
                             <h4 className="text-[13px] font-black text-[#242424]">{sop.title}</h4>
                             <div className="flex items-center gap-3 mt-1.5">
                                <Badge variant="ghost" className="bg-[#F3F2F1] text-[#616161] font-black text-[9px] uppercase px-2">
                                   {sop.version}
                                </Badge>
                                <span className="h-1 w-1 rounded-full bg-[#EDEBE9]" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${sop.status === 'review_required' ? 'text-amber-600' : 'text-[#A19F9D]'}`}>
                                   Next Review: {sop.review}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-3">
                          <Button variant="outline" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest px-6 border-[#EDEBE9]">
                             <Stamp className="h-4 w-4 mr-2" />
                             Attest
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-[#A19F9D] group-hover:text-[#0078D4] rounded-xl bg-[#F8F9FA]">
                             <ChevronRight className="h-5 w-5" />
                          </Button>
                       </div>
                    </div>
                  ))}
               </div>
            </ScrollArea>
         </div>
      </div>
    </div>
  );
}
