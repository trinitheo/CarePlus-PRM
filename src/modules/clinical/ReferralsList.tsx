import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { UserPlus, Clock, CheckCircle2, ChevronRight, AlertCircle, ExternalLink, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../lib/motion';

interface Referral {
  id: string;
  fromProvider: string;
  toProvider: string;
  specialty: string;
  reason: string;
  urgency: string;
  notes?: string;
  status?: string;
  authorName?: string;
  createdAt?: any;
}

interface ReferralsListProps {
  patientId: string;
  referrals: Referral[];
}

export function ReferralsList({ referrals }: ReferralsListProps) {
  const getStatusBadge = (status?: string) => {
    const s = status || 'requested';
    switch (s) {
      case 'requested': return <Badge className="bg-[#FFF4CE] text-[#845701] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Requested</Badge>;
      case 'sent': return <Badge className="bg-[#DEECF9] text-[#005A9E] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Sent</Badge>;
      case 'accepted': return <Badge className="bg-[#DFF6DD] text-[#107C10] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Accepted</Badge>;
      case 'declined': return <Badge className="bg-[#FDE7E9] text-[#A4262C] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Declined</Badge>;
      default: return <Badge className="bg-[#F3F2F1] text-[#616161] uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">{s}</Badge>;
    }
  };

  const pendingCount = referrals.filter(r => !r.status || r.status === 'requested').length;
  const activeCount = referrals.filter(r => r.status === 'sent' || r.status === 'accepted').length;

  return (
    <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-md rounded-2xl overflow-hidden bg-white min-h-0">
      <CardHeader className="py-4 px-8 border-b border-[#F3F2F1] bg-[#FAFAFA]/30 flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="text-[16px] font-black text-[#242424] uppercase tracking-wider mb-0.5">OUTBOUND REFERRALS</CardTitle>
          <CardDescription className="text-[12px] font-medium text-[#616161] opacity-70">External specialist coordination and tracking.</CardDescription>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest">Awaiting</p>
            <p className="text-xl font-black text-[#845701]">{pendingCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest">Active</p>
            <p className="text-xl font-black text-[#0078D4]">{activeCount}</p>
          </div>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 px-8 py-3 bg-[#F8F9FA]/80 border-b border-[#EDEBE9] text-[10px] font-black uppercase tracking-[0.1em] text-[#616161] shrink-0 sticky top-0 z-10">
          <div className="col-span-1">Icon</div>
          <div className="col-span-4">Specialty & Target</div>
          <div className="col-span-4 pr-4">Reason for Referral</div>
          <div className="col-span-1">Urgency</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="divide-y divide-[#F3F2F1]">
            <AnimatePresence mode="popLayout">
              {referrals.length > 0 ? (
                referrals.map((ref, idx) => (
                  <motion.div 
                    key={ref.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transition.entrance, delay: idx * 0.05 }}
                    className="grid grid-cols-12 px-8 py-5 items-center hover:bg-[#F3F9FD] group transition-all cursor-pointer"
                  >
                    <div className="col-span-1">
                      <div className="h-10 w-10 rounded-xl bg-white border border-[#EDEBE9] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <UserPlus className="h-5 w-5 text-[#A4262C]" />
                      </div>
                    </div>
                    <div className="col-span-4 pr-6">
                      <h4 className="text-[14px] font-black text-[#242424] leading-tight mb-1 group-hover:text-[#0078D4] transition-colors">{ref.specialty}</h4>
                      <p className="text-[11px] font-bold text-[#616161] truncate opacity-50 uppercase tracking-tight flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {ref.toProvider || 'Community Provider'}
                      </p>
                    </div>
                    <div className="col-span-4 pr-8">
                       <p className="text-[12px] font-medium text-[#242424] line-clamp-2 leading-relaxed italic border-l-2 border-[#EDEBE9] pl-3">
                         "{ref.reason}"
                       </p>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        ref.urgency === 'stat' ? 'text-[#D13438]' : 'text-[#616161] opacity-70'
                      }`}>
                        {ref.urgency}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      {getStatusBadge(ref.status)}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-[#F3F2F1] border border-[#EDEBE9] flex items-center justify-center mb-4 opacity-40">
                    <UserPlus className="h-8 w-8 text-[#616161]" />
                  </div>
                  <p className="text-lg font-black text-[#242424] opacity-80 uppercase tracking-tighter">No Active Referrals</p>
                  <p className="text-[12px] text-[#616161] font-medium mt-1 max-w-[280px] opacity-60">Outbound specialist referrals will be listed here after issuance.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
