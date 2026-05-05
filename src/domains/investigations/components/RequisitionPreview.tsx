import React from 'react';
import { FileText, Printer, Send, ShoppingCart, User, Building2, Calendar, FileType } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { OrderCategory } from './InvestigationOrderForm';

interface RequisitionPreviewProps {
  patient: any;
  category: OrderCategory;
  tests: { testName: string }[];
  priority: string;
  indication: string;
  instructions: string;
}

export function RequisitionPreview({ 
  patient, 
  category, 
  tests, 
  priority, 
  indication, 
  instructions 
}: RequisitionPreviewProps) {
  const requisitionNumber = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col gap-6 p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
        <ShoppingCart className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[12px] text-amber-900 leading-relaxed">
          <strong>Review Order Requisition</strong><br />
          Please verify study details before sending to the laboratory. Once confirmed, this will be logged and tracked in the Investigation Registry.
        </div>
      </div>

      <div className="bg-white border border-[#EDEBE9] rounded-2xl shadow-xl overflow-hidden font-mono text-[#242424]">
        {/* Document Header */}
        <div className="bg-[#FAFAFA] border-b border-[#EDEBE9] p-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-[#0078D4] flex items-center justify-center shadow-lg transform -rotate-12">
                <Building2 className="h-7 w-7 text-white" />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight">CarePlus PRM</h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest leading-none">Diagnostic Services Requisition</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest leading-none mb-1">Requisition #</p>
             <p className="text-sm font-black">{requisitionNumber}</p>
             <div className="mt-2 flex items-center justify-end gap-1.5 opacity-60">
                <Calendar className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-tight">{date}</span>
             </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-3 divide-x divide-[#EDEBE9] border-b border-[#EDEBE9] bg-[#FAFAFA]/30">
          <div className="p-4">
             <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <User className="h-2.5 w-2.5" /> Patient
             </p>
             <p className="text-sm font-black truncate">{patient?.name}</p>
             <p className="text-[10px] font-bold opacity-60 mt-0.5">{patient?.age}y • {patient?.sex}</p>
          </div>
          <div className="p-4">
             <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FileType className="h-2.5 w-2.5" /> Records
             </p>
             <p className="text-sm font-black uppercase">{patient?.mrn || 'DEMO-882'}</p>
             <p className="text-[10px] font-bold opacity-60 mt-0.5">Blood Type: {patient?.bloodType || 'A+'}</p>
          </div>
          <div className="p-4">
             <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FileText className="h-2.5 w-2.5" /> Category
             </p>
             <p className="text-sm font-black uppercase tracking-wider">{category}</p>
             <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-tight ${priority === 'STAT' ? 'text-[#D13438]' : 'text-[#0078D4]'}`}>
                Priority: {priority}
             </p>
          </div>
        </div>

        {/* Test List */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
             <div className="h-px flex-1 bg-[#EDEBE9]" />
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Requested Investigations</span>
             <div className="h-px flex-1 bg-[#EDEBE9]" />
          </div>

          <div className="space-y-4">
            {tests.map((test, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-[#FAFAFA] border border-[#F3F2F1]">
                 <div className="h-6 w-6 rounded-full bg-[#EDEBE9] flex items-center justify-center text-[10px] font-black shrink-0">
                    {i + 1}
                 </div>
                 <div className="flex-1">
                    <p className="text-[14px] font-bold leading-tight">{test.testName}</p>
                    <p className="text-[11px] font-medium opacity-50 mt-0.5">Diagnostic clinical study (ICD-10-AM)</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Info */}
        <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#EDEBE9] space-y-4">
          <div>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Clinical Indication</p>
            <p className="text-[12px] font-medium leading-relaxed italic border-l-2 border-[#EDEBE9] pl-3 py-1">
              "{indication}"
            </p>
          </div>
          {instructions && (
            <div>
              <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Handling Instructions</p>
              <p className="text-[12px] font-medium leading-relaxed">
                {instructions}
              </p>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="p-6 flex justify-between items-end border-t border-[#EDEBE9]">
           <div>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-4">Requesting Clinician</p>
              <div className="h-8 w-40 border-b-2 border-black/10 flex items-center px-1">
                 <span className="font-serif italic text-lg opacity-40">System Doctor</span>
              </div>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-1">Digital Signature Applied</p>
           </div>
           <div className="h-20 w-20 flex items-center justify-center bg-[#F3F2F1] rounded-lg opacity-20 border border-[#EDEBE9]">
              <span className="text-[8px] font-bold uppercase text-center tracking-tighter">Laboratory QR Code Space</span>
           </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1 p-3 bg-[#F3F9FD] border-[#DEECF9] cursor-pointer hover:shadow-md transition-all">
           <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-[#0078D4]" />
              <div className="text-left">
                <p className="text-xs font-bold text-[#0078D4] leading-none mb-1">Print Document</p>
                <p className="text-[10px] text-[#616161]">Download PDF version for manual hand-off</p>
              </div>
           </div>
        </Card>
        <Card className="flex-1 p-3 bg-[#F4F9F4] border-[#CEF1CB] cursor-pointer hover:shadow-md transition-all">
           <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-[#107C10]" />
              <div className="text-left">
                <p className="text-xs font-bold text-[#107C10] leading-none mb-1">Digital Referral</p>
                <p className="text-[10px] text-[#616161]">Send directly to HealthConnect Laboratory Network</p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
