import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Stethoscope, Clock, CheckCircle2, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../lib/motion';

interface Procedure {
  id: string;
  procedureName: string;
  priority: string;
  targetDate?: string;
  preparation?: string;
  notes?: string;
  status?: string;
  authorName?: string;
  createdAt?: any;
}

interface ProceduresListProps {
  patientId: string;
  procedures: Procedure[];
}

export function ProceduresList({ procedures }: ProceduresListProps) {
  const getStatusBadge = (status?: string) => {
    const s = status || 'scheduled';
    switch (s) {
      case 'scheduled': return <Badge className="bg-[#FFF4CE] text-[#845701] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Scheduled</Badge>;
      case 'in_progress': return <Badge className="bg-[#DEECF9] text-[#005A9E] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">In Progress</Badge>;
      case 'completed': return <Badge className="bg-[#DFF6DD] text-[#107C10] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-[#FDE7E9] text-[#A4262C] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Cancelled</Badge>;
      default: return <Badge className="bg-[#F3F2F1] text-[#616161] uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">{s}</Badge>;
    }
  };

  const pendingCount = procedures.filter(p => !p.status || p.status === 'scheduled').length;
  const completedCount = procedures.filter(p => p.status === 'completed').length;

  return (
    <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-md rounded-2xl overflow-hidden bg-white min-h-0">
      <CardHeader className="py-5 px-8 border-b border-[#F3F2F1] bg-[#FAFAFA]/30 flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="text-[16px] font-black text-[#242424] uppercase tracking-wider mb-1">PROCEDURE REGISTRY</CardTitle>
          <CardDescription className="text-[12px] font-medium text-[#616161] opacity-70">Surgical and clinical interventions tracking.</CardDescription>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest">Scheduled</p>
            <p className="text-xl font-black text-[#242424]">{pendingCount}</p>
          </div>
          <div className="h-8 w-[1px] bg-[#EDEBE9] self-center" />
          <div className="text-right">
            <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest">Completed</p>
            <p className="text-xl font-black text-[#242424]">{completedCount}</p>
          </div>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 px-8 py-3 bg-[#F8F9FA]/80 border-b border-[#EDEBE9] text-[10px] font-black uppercase tracking-[0.1em] text-[#616161] shrink-0 sticky top-0 z-10">
          <div className="col-span-1">Icon</div>
          <div className="col-span-5">Procedure Details</div>
          <div className="col-span-2">Target Date</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="divide-y divide-[#F3F2F1]">
            <AnimatePresence mode="popLayout">
              {procedures.length > 0 ? (
                procedures.map((proc, idx) => (
                  <motion.div 
                    key={proc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transition.entrance, delay: idx * 0.05 }}
                    className="grid grid-cols-12 px-8 py-5 items-center hover:bg-[#F3F9FD] group transition-all cursor-pointer"
                  >
                    <div className="col-span-1">
                      <div className="h-10 w-10 rounded-xl bg-white border border-[#EDEBE9] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Stethoscope className="h-5 w-5 text-[#5C2D91]" />
                      </div>
                    </div>
                    <div className="col-span-5 pr-6">
                      <h4 className="text-[14px] font-black text-[#242424] leading-tight mb-1 group-hover:text-[#0078D4] transition-colors">{proc.procedureName}</h4>
                      <p className="text-[11px] font-bold text-[#616161] truncate opacity-50 uppercase tracking-tight">Ordered by: {proc.authorName || 'Clinical Provider'}</p>
                    </div>
                    <div className="col-span-2 text-[12px] font-bold text-[#242424] flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#A19F9D]" />
                      {proc.targetDate || 'TBD'}
                    </div>
                    <div className="col-span-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        proc.priority === 'emergency' ? 'text-[#D13438]' : proc.priority === 'urgent' ? 'text-[#0078D4]' : 'text-[#616161] opacity-70'
                      }`}>
                        {proc.priority}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      {getStatusBadge(proc.status)}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-[#F3F2F1] border border-[#EDEBE9] flex items-center justify-center mb-4 opacity-40">
                    <Stethoscope className="h-8 w-8 text-[#616161]" />
                  </div>
                  <p className="text-lg font-black text-[#242424] opacity-80 uppercase tracking-tighter">No Procedures Scheduled</p>
                  <p className="text-[12px] text-[#616161] font-medium mt-1 max-w-[280px] opacity-60">Interventions and surgical orders will be tracked here once issued.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
