import React, { useState } from 'react';
import { 
  Beaker, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileUp, 
  ClipboardList,
  ChevronRight,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';

export function InvestigationWorkflow() {
  const [activeTab, setActiveTab] = useState<'pending' | 'resulted' | 'reviewed'>('pending');

  const orders = [
    { id: '1', patient: 'James Logan', test: 'Full Blood Count', status: 'pending', priority: 'routine', time: '2h ago' },
    { id: '2', patient: 'Sarah Connor', test: 'MRI Lumbar Spine', status: 'resulted', priority: 'urgent', time: '1h ago' },
    { id: '3', patient: 'Ellen Ripley', test: 'HbA1c', status: 'pending', priority: 'routine', time: '4h ago' },
  ];

  return (
    <div className="p-8 space-y-8 font-segoe max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <Beaker className="h-8 w-8 text-[#0078D4]" />
            Diagnostic Lifecycle
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">Order tracking, result integration, and clinical acknowledgment</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 rounded-xl font-bold px-6 border-[#EDEBE9]">
              <Filter className="h-4 w-4 mr-2" />
              Service Category
           </Button>
           <Button className="bg-[#0078D4] hover:bg-[#005A9E] text-white px-6 h-12 rounded-xl flex gap-2 font-black shadow-lg shadow-[#0078D4]/20">
              <Plus className="h-5 w-5" />
              Create Order
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Queue Column */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-[#A19F9D] mb-6 tracking-widest">Efficiency Metrics</h3>
               <div className="space-y-6">
                  <div>
                     <p className="text-2xl font-black text-[#242424]">4.2h</p>
                     <p className="text-[11px] font-bold text-[#616161] uppercase tracking-wider">Avg Turnaround Time</p>
                  </div>
                  <div>
                     <p className="text-2xl font-black text-amber-600">18</p>
                     <p className="text-[11px] font-bold text-[#616161] uppercase tracking-wider">Pending Orders</p>
                  </div>
                  <div>
                     <p className="text-2xl font-black text-rose-500">3</p>
                     <p className="text-[11px] font-bold text-[#616161] uppercase tracking-wider">Critical Unreviewed</p>
                  </div>
               </div>
            </div>

            <div className="bg-[#242424] p-6 rounded-3xl text-white shadow-xl">
               <h3 className="text-[10px] font-black uppercase text-blue-400 mb-4 tracking-widest">Laboratory Status</h3>
               <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-300">LIS Sync Status</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] uppercase">Active</Badge>
               </div>
               <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Laboratory Information System is pushing real-time results for 14 active patients.
               </p>
            </div>
         </div>

         {/* Main Workflow Column */}
         <div className="lg:col-span-3 bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden flex flex-col h-[70vh]">
            <div className="flex border-b border-[#F3F2F1]">
               {(['pending', 'resulted', 'reviewed'] as const).map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[#0078D4]' : 'text-[#A19F9D] hover:text-[#616161]'}`}
                 >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0078D4]" />}
                 </button>
               ))}
            </div>

            <ScrollArea className="flex-1 p-6">
               <div className="space-y-4">
                  {orders.filter(o => o.status === activeTab || (activeTab === 'pending' && o.status === 'pending')).map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-2xl border border-[#EDEBE9] hover:border-[#DEECF9] transition-all group flex items-center justify-between">
                       <div className="flex items-center gap-5">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${order.priority === 'urgent' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                             <ClipboardList className="h-6 w-6" />
                          </div>
                          <div>
                             <h4 className="text-[13px] font-black text-[#242424]">{order.test}</h4>
                             <p className="text-sm font-medium text-[#616161]">{order.patient}</p>
                             <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${order.priority === 'urgent' ? 'text-rose-500' : 'text-[#A19F9D]'}`}>
                                   {order.priority}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-[#EDEBE9]" />
                                <span className="text-[10px] font-bold text-[#A19F9D] uppercase flex items-center gap-1">
                                   <Clock className="h-3 w-3" />
                                   {order.time}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-3">
                          {activeTab === 'pending' && (
                            <Button variant="outline" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest px-6 border-[#EDEBE9]">
                               <FileUp className="h-4 w-4 mr-2" />
                               Upload Result
                            </Button>
                          )}
                          {activeTab === 'resulted' && (
                            <Button className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                               Acknowledge
                            </Button>
                          )}
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

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
