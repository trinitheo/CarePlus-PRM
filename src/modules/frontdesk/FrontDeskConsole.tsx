import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  CreditCard, 
  Signature, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  LayoutGrid,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';

export function FrontDeskConsole({ onRegisterPatient }: { onRegisterPatient: () => void }) {
  const [activeQueue, setActiveQueue] = useState<'appointments' | 'walk-ins'>('appointments');

  const incoming = [
    { id: '1', patient: 'Sarah Reese', time: '10:30 AM', status: 'arrived', insurance: 'verified', balance: '$0.00' },
    { id: '2', patient: 'Michael Vaughn', time: '10:45 AM', status: 'pending', insurance: 'outdated', balance: '$120.00' },
    { id: '3', patient: 'Jack Bristow', time: '11:00 AM', status: 'pending', insurance: 'verified', balance: '$0.00' },
  ];

  return (
    <div className="p-8 space-y-8 font-segoe max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-[#0078D4]" />
            Patient Access Center
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">Check-in, insurance verification, and consent management hub</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 rounded-xl font-bold px-6 border-[#EDEBE9]">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Queue View
           </Button>
           <Button 
             onClick={onRegisterPatient}
             className="bg-[#242424] hover:bg-black text-white px-6 h-12 rounded-xl flex gap-2 font-black"
           >
              <UserPlus className="h-5 w-5" />
              Register Patient
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Verification Stats */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-[#A19F9D] mb-6 tracking-widest px-2">Compliance Check</h3>
               <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <p className="text-xs font-black text-emerald-800 uppercase">HIPAA Status</p>
                     </div>
                     <p className="text-2xl font-black text-[#242424]">94%</p>
                     <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Signed Consents</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                     <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="text-xs font-black text-amber-800 uppercase">Insurance</p>
                     </div>
                     <p className="text-2xl font-black text-[#242424]">8</p>
                     <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Action Required</p>
                  </div>
               </div>
            </div>

            <div className="bg-[#0078D4] p-6 rounded-3xl text-white shadow-xl shadow-[#0078D4]/20">
               <h3 className="text-[10px] font-black uppercase text-blue-200 mb-6 tracking-widest">Co-Pay Collection</h3>
               <div className="flex items-center justify-between mb-2">
                  <p className="text-3xl font-black">$1,450</p>
                  <CreditCard className="h-8 w-8 opacity-20" />
               </div>
               <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Recovered Today</p>
            </div>
         </div>

         {/* Main Registration/Check-in Terminal */}
         <div className="lg:col-span-3 bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden flex flex-col h-[70vh]">
            <div className="p-6 border-b border-[#F3F2F1] flex items-center justify-between">
               <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A19F9D]" />
                  <input 
                    type="text" 
                    placeholder="Search arrival queue..." 
                    className="w-full pl-12 pr-6 py-2.5 bg-[#FAFAFA] border border-[#F3F2F1] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0078D4]/20 outline-none"
                  />
               </div>
               <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#DEECF9] text-[#0078D4]">Appointment List</button>
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#A19F9D] hover:bg-[#FAFAFA]">Waitlist</button>
               </div>
            </div>

            <ScrollArea className="flex-1">
               <div className="p-2">
                  <table className="w-full border-collapse">
                     <thead>
                        <tr className="border-b border-[#F3F2F1]">
                           <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">Scheduled</th>
                           <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">Patient</th>
                           <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">Financial / Insurance</th>
                           <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#F3F2F1]">
                        {incoming.map(p => (
                           <tr key={p.id} className="hover:bg-[#FCFCFC] transition-colors group">
                              <td className="px-6 py-5">
                                 <p className="text-sm font-black text-[#242424]">{p.time}</p>
                                 <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    T-Minus 15m
                                 </p>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-[#F3F2F1] rounded-xl flex items-center justify-center font-black text-[#616161]">
                                       {p.patient.charAt(0)}
                                    </div>
                                    <p className="text-sm font-bold text-[#242424]">{p.patient}</p>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex flex-col gap-1.5">
                                    <Badge variant="ghost" className={`w-fit text-[9px] font-black uppercase tracking-widest ${p.insurance === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                       {p.insurance}
                                    </Badge>
                                    {p.balance !== '$0.00' && (
                                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                          Due: {p.balance}
                                       </p>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-[#616161]">
                                       <Signature className="h-4 w-4 mr-2" />
                                       Consent
                                    </Button>
                                    <Button 
                                       className={`h-8 text-[10px] font-black uppercase tracking-widest px-6 rounded-lg ${p.status === 'arrived' ? 'bg-[#EDEBE9] text-[#A19F9D] cursor-not-allowed' : 'bg-[#0078D4] hover:bg-[#005A9E] text-white shadow-lg shadow-[#0078D4]/20'}`}
                                    >
                                       {p.status === 'arrived' ? 'Checked In' : 'Check In'}
                                    </Button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </ScrollArea>
         </div>
      </div>
    </div>
  );
}
