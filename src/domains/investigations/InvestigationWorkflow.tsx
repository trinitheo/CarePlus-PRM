import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Microscope, 
  Beaker, 
  Activity, 
  Zap, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ChevronRight, 
  ClipboardCheck,
  AlertCircle,
  FlaskConical,
  Eye,
  TestTube2
} from 'lucide-react';
import { Investigation, InvestigationStatus } from '../../types';
import { updateInvestigation } from '../../services/clinicalFirestoreService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';

interface InvestigationWorkflowProps {
  patientId: string;
  investigations: Investigation[];
  canWrite?: boolean;
}

export function InvestigationWorkflow({ patientId, investigations, canWrite }: InvestigationWorkflowProps) {
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultSummary, setResultSummary] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resulted' | 'reviewed' | 'cancelled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'laboratory' | 'imaging' | 'functional'>('all');

  const filteredInvestigations = investigations.filter(inv => {
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && ['ordered', 'sample_collected'].includes(inv.status)) ||
      statusFilter === inv.status;
    
    const matchesCategory = categoryFilter === 'all' || categoryFilter === inv.category;
    
    return matchesStatus && matchesCategory;
  });

  const handleOpenResultModal = (inv: Investigation) => {
    setSelectedInvestigation(inv);
    setResultSummary(inv.resultSummary || '');
    setIsResultModalOpen(true);
  };

  const handleUpdateStatus = async (inv: Investigation, newStatus: InvestigationStatus) => {
    try {
      await updateInvestigation(patientId, inv.id, { status: newStatus });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleSubmitResults = async () => {
    if (!selectedInvestigation) return;
    setIsUpdating(true);
    try {
      await updateInvestigation(patientId, selectedInvestigation.id, {
        resultSummary,
        status: 'resulted',
        resultDate: Date.now()
      });
      setIsResultModalOpen(false);
      setSelectedInvestigation(null);
    } catch (e) {
      console.error("Failed to save results", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: InvestigationStatus) => {
    switch (status) {
      case 'ordered': return <Badge className="bg-[#FFF4CE] text-[#845701] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Ordered</Badge>;
      case 'sample_collected': return <Badge className="bg-[#DEECF9] text-[#005A9E] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">In Progress</Badge>;
      case 'resulted': return <Badge className="bg-[#DFF6DD] text-[#107C10] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Resulted</Badge>;
      case 'reviewed': return <Badge className="bg-[#F3F2F1] text-[#616161] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Reviewed</Badge>;
      case 'cancelled': return <Badge className="bg-[#FDE7E9] text-[#A4262C] border-none uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">Cancelled</Badge>;
      default: return <Badge className="bg-[#F3F2F1] text-[#616161] uppercase text-[9px] font-black px-2.5 py-0.5 rounded-md">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'laboratory': return <TestTube2 className="h-4 w-4 text-[#D13438]" />;
      case 'imaging': return <Activity className="h-4 w-4 text-[#0078D4]" />;
      case 'functional': return <Zap className="h-4 w-4 text-[#107C10]" />;
      default: return <Microscope className="h-4 w-4 text-[#616161]" />;
    }
  };

  const pendingCount = investigations.filter(i => ['ordered', 'sample_collected'].includes(i.status)).length;
  const awaitedCount = investigations.filter(i => i.status === 'resulted').length;
  const completedCount = investigations.filter(i => i.status === 'reviewed').length;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {[
          { id: 'pending', label: 'PENDING ORDERS', count: pendingCount, icon: Clock, color: 'amber' },
          { id: 'resulted', label: 'AWAITING REVIEW', count: awaitedCount, icon: CheckCircle2, color: 'green' },
          { id: 'reviewed', label: 'COMPLETED (LAST 30D)', count: completedCount, icon: FileText, color: 'gray' },
        ].map((stat) => (
          <button 
            key={stat.id}
            onClick={() => setStatusFilter(stat.id as any)}
            className={`flex items-stretch text-left rounded-xl border border-[#EDEBE9] bg-white shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-[#0078D4]/30 active:scale-[0.98] ${
              statusFilter === stat.id ? 'ring-2 ring-[#0078D4] ring-offset-2' : ''
            }`}
          >
            <div className={`w-1 shrink-0 ${
              stat.color === 'amber' ? 'bg-[#FFB900]' : 
              stat.color === 'green' ? 'bg-[#107C10]' : 
              'bg-[#616161]'
            }`} />
            <CardContent className="p-4 flex items-center gap-5 flex-1">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                stat.color === 'amber' ? 'bg-amber-50' : 
                stat.color === 'green' ? 'bg-green-50' : 
                'bg-slate-50'
              }`}>
                <stat.icon className={`h-6 w-6 ${
                  stat.color === 'amber' ? 'text-[#845701]' : 
                  stat.color === 'green' ? 'text-[#107C10]' : 
                  'text-[#616161]'
                }`} />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-[#616161] tracking-wider mb-1 uppercase">{stat.label}</p>
                <h4 className="text-3xl font-black text-[#242424] leading-none mb-1">{stat.count}</h4>
              </div>
            </CardContent>
          </button>
        ))}
      </div>

      {/* Main Workflow View */}
      <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-md rounded-2xl overflow-hidden bg-white min-h-0">
        <CardHeader className="py-5 px-8 border-b border-[#F3F2F1] bg-[#FAFAFA]/30 flex flex-row items-center justify-between shrink-0">
          <div>
            <CardTitle className="text-[16px] font-black text-[#242424] uppercase tracking-wider mb-1">INVESTIGATION REGISTRY</CardTitle>
            <CardDescription className="text-[12px] font-medium text-[#616161] opacity-70">Track clinical studies from requisition to clinical closure.</CardDescription>
          </div>
          
          {/* Combined Tabs Bar */}
          <div className="flex items-center gap-4">
             <div className="flex bg-[#F3F2F1]/80 p-0.5 rounded-lg border border-[#EDEBE9]">
                {(['all', 'laboratory', 'imaging', 'functional'] as const).map(cat => (
                  <button 
                    key={cat}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                      categoryFilter === cat 
                        ? 'bg-white shadow-sm text-[#242424]' 
                        : 'text-[#616161] hover:text-[#242424]'
                    }`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
             </div>
             
             {statusFilter !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStatusFilter('all')}
                  className="h-8 text-[10px] font-bold text-[#0078D4] hover:bg-[#DEECF9] px-3 uppercase tracking-widest"
                >
                  Clear Filters
                </Button>
             )}
          </div>
        </CardHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 px-8 py-3 bg-[#F8F9FA]/80 border-b border-[#EDEBE9] text-[10px] font-black uppercase tracking-[0.1em] text-[#616161] shrink-0 sticky top-0 z-10">
            <div className="col-span-1">Icon</div>
            <div className="col-span-3 lg:col-span-4">Study / Test Name</div>
            <div className="col-span-2">Date Ordered</div>
            <div className="col-span-2">Priority / Urgency</div>
            <div className="col-span-2 lg:col-span-2">Current Status</div>
            <div className="col-span-2 lg:col-span-1 text-right">Actions</div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="divide-y divide-[#F3F2F1]">
              <AnimatePresence mode="popLayout">
                {filteredInvestigations.length > 0 ? (
                  filteredInvestigations.map((inv) => (
                    <motion.div 
                      key={inv.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleOpenResultModal(inv)}
                      className="grid grid-cols-12 px-8 py-5 items-center hover:bg-[#F3F9FD] group transition-all cursor-pointer"
                    >
                      <div className="col-span-1">
                        <div className="h-10 w-10 rounded-xl bg-white border border-[#EDEBE9] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {getCategoryIcon(inv.category)}
                        </div>
                      </div>
                      <div className="col-span-3 lg:col-span-4 pr-6">
                        <h4 className="text-[14px] font-black text-[#242424] leading-tight mb-1 group-hover:text-[#0078D4] transition-colors">
                          {inv.tests?.[0]?.testName || 'Investigation'}
                          {inv.tests && inv.tests.length > 1 && <span className="ml-1 text-[11px] text-[#0078D4] font-bold opacity-60">+{inv.tests.length - 1}</span>}
                        </h4>
                        <p className="text-[11px] font-bold text-[#616161] truncate opacity-50 uppercase tracking-tight">{inv.indication}</p>
                      </div>
                      <div className="col-span-2 text-[12px] font-bold text-[#242424]">
                        {inv.createdAt?.seconds 
                          ? new Date(inv.createdAt.seconds * 1000).toISOString().split('T')[0]
                          : '2026-05-05'}
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          inv.priority === 'STAT' ? 'text-[#D13438]' : inv.priority === 'Urgent' ? 'text-[#0078D4]' : 'text-[#616161] opacity-70'
                        }`}>
                          {inv.priority}
                        </span>
                      </div>
                      <div className="col-span-2 lg:col-span-2">
                        {getStatusBadge(inv.status)}
                      </div>
                      <div className="col-span-2 lg:col-span-1 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                           {canWrite && inv.status === 'ordered' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-8 border-[#EDEBE9] bg-white text-[#242424] text-[10px] font-black uppercase tracking-widest px-4 hover:border-[#0078D4] hover:bg-[#DEECF9] hover:text-[#0078D4] transition-all"
                               onClick={() => handleUpdateStatus(inv, 'sample_collected')}
                             >
                                Collect Sample
                             </Button>
                           )}
                           {canWrite && inv.status === 'sample_collected' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-8 bg-[#DEECF9] border-[#0078D4] text-[#0078D4] text-[10px] font-black uppercase tracking-widest px-4 hover:bg-[#CFE4FA] transition-all"
                               onClick={() => handleOpenResultModal(inv)}
                             >
                                Enter Result
                             </Button>
                           )}
                           {canWrite && inv.status === 'resulted' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-8 bg-[#DFF6DD] border-[#107C10] text-[#107C10] text-[10px] font-black uppercase tracking-widest px-4 hover:bg-[#CEF1CB] transition-all"
                               onClick={() => handleUpdateStatus(inv, 'reviewed')}
                             >
                                Review
                             </Button>
                           )}
                           <button 
                             onClick={() => handleOpenResultModal(inv)}
                             className="h-8 w-8 rounded-full flex items-center justify-center text-[#A19F9D] hover:bg-[#F3F2F1] hover:text-[#242424] transition-all"
                           >
                             <ChevronRight className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-24 text-center"
                  >
                    <div className="h-16 w-16 rounded-3xl bg-[#F3F2F1] border border-[#EDEBE9] flex items-center justify-center mb-4 opacity-40">
                      <Microscope className="h-8 w-8 text-[#616161]" />
                    </div>
                    <p className="text-lg font-black text-[#242424] opacity-80">NO STUDIES FOUND</p>
                    <p className="text-[12px] text-[#616161] font-medium mt-1 max-w-[280px] opacity-60">No investigation orders match current filters. New orders will appear here for tracking.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Result Entry Modal */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-none">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-black text-[#242424] flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6 text-[#107C10]" />
              {selectedInvestigation?.status === 'reviewed' ? 'View Results' : 'Add Clinical Results'}
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              Finalise imaging or laboratory data for clinical review.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#616161]">Patient ID</Label>
                <div className="px-3 py-2 bg-[#FAFAFA] border border-[#EDEBE9] rounded-lg text-xs font-mono">{patientId}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#616161]">Order ID</Label>
                <div className="px-3 py-2 bg-[#FAFAFA] border border-[#EDEBE9] rounded-lg text-xs font-mono">{selectedInvestigation?.id}</div>
              </div>
            </div>

            <div className="p-4 bg-[#F3F9FD] rounded-xl border border-[#DEECF9]">
              <h5 className="text-[11px] font-bold text-[#005A9E] uppercase tracking-widest mb-2">Requested Tests</h5>
              <div className="flex flex-wrap gap-2">
                {selectedInvestigation?.tests.map((t, idx) => (
                  <Badge key={idx} className="bg-white border-[#DEECF9] text-[#242424] text-[11px] font-bold px-2 py-1 rounded-md">
                    {t.testName}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Findings / Result Summary</Label>
              <Textarea 
                placeholder="Detailed findings, impressions, or specific values..."
                className="min-h-[150px] bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 rounded-xl text-[14px] p-4 leading-relaxed transition-all"
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                readOnly={selectedInvestigation?.status === 'reviewed'}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EDEBE9]">
            <Button variant="ghost" className="font-bold text-[#616161] hover:text-[#242424]" onClick={() => setIsResultModalOpen(false)}>
              Close
            </Button>
            {canWrite && selectedInvestigation?.status !== 'reviewed' && (
              <Button 
                onClick={handleSubmitResults} 
                disabled={isUpdating || !resultSummary.trim()}
                className="bg-[#107C10] hover:bg-[#0B590B] text-white font-bold px-8"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
                Submit Requisition
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
