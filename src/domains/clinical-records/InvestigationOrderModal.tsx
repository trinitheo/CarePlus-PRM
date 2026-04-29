import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Microscope, X, Search, ChevronDown, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { saveInvestigation } from '../../services/clinicalFirestoreService';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface InvestigationOrderModalProps {
  patientId: string;
  children: React.ReactNode;
}

export function InvestigationOrderModal({ patientId, children }: InvestigationOrderModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Form State
  const [category, setCategory] = React.useState('laboratory');
  const [testName, setTestName] = React.useState('');
  const [priority, setPriority] = React.useState('Routine');
  const [indication, setIndication] = React.useState('');
  const [instructions, setInstructions] = React.useState('');

  // Fluent 2 Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.33, 0, 0.1, 1]
      }
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={children} nativeButton={true} />
      <DialogContent showCloseButton={false} className="sm:max-w-[700px] w-[95vw] p-0 overflow-hidden bg-white border-[#EDEBE9] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] focus:outline-none">
        {/* Fluent 2 Header Pattern */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#EDEBE9] shrink-0 bg-white z-10">
          <DialogHeader className="p-0">
            <DialogTitle className="text-[20px] font-bold tracking-tight text-[#242424] flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-10 w-10 bg-[#845701] flex items-center justify-center rounded-lg shadow-sm"
              >
                <Microscope className="h-5.5 w-5.5 text-white" />
              </motion.div>
              <motion.span
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                Investigation Order
              </motion.span>
            </DialogTitle>
          </DialogHeader>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)} 
            className="h-9 w-9 rounded-md text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea 
          className="flex-1" 
          viewportRef={scrollRef}
        >
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="px-10 py-8 space-y-8 max-w-2xl mx-auto"
          >
            {/* Test Category & Search */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#242424]">Test Category <span className="text-[#A4262C]">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 border-[#8A8886]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laboratory">Laboratory / Pathology</SelectItem>
                    <SelectItem value="imaging">Imaging (X-Ray, MRI, CT)</SelectItem>
                    <SelectItem value="functional">Functional Testing</SelectItem>
                    <SelectItem value="ekg">Cardiology / EKG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#242424]">Search Tests</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 text-[#616161] group-focus-within:text-[#0078D4]" />
                  </div>
                  <Input 
                    placeholder="e.g., CBC, MRI Brain" 
                    className="h-11 pl-10 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Priority */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Priority Status</Label>
              <div className="flex gap-3">
                {['Routine', 'Urgent', 'STAT'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 h-11 rounded-md border text-[13px] font-bold transition-all ${
                      priority === p 
                        ? 'bg-[#0078D4]/5 border-[#0078D4] text-[#0078D4]' 
                        : 'bg-white border-[#8A8886] text-[#242424] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Clinical Indication */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Clinical Indication <span className="text-[#A4262C]">*</span></Label>
              <Textarea 
                placeholder="Reason for requesting this test (e.g., suspected anemia, follow-up on lesion)..." 
                className="min-h-[100px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
              />
            </motion.div>

            {/* Notes */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#616161]">Handling Instructions / Notes</Label>
              <Textarea 
                placeholder="e.g. Patient to fast for 12 hours prior, use contrast..." 
                className="min-h-[100px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </motion.div>
          </motion.div>
        </ScrollArea>

        <DialogFooter className="px-10 py-6 bg-[#FAFAFA] border-t border-[#EDEBE9] flex justify-end items-center gap-4 shrink-0 z-10">
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => setIsOpen(false)}
            className="text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] font-semibold text-[14px] rounded-md px-8 h-11 transition-colors border-none bg-transparent outline-none cursor-pointer focus:ring-2 focus:ring-[#EDEBE9]"
          >
            Discard
          </button>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              disabled={isSubmitting || !category || !testName || !indication}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await saveInvestigation(patientId, {
                    category,
                    testName,
                    priority,
                    indication,
                    instructions
                  });
                  setIsOpen(false);
                  // Reset form
                  setCategory('laboratory');
                  setTestName('');
                  setPriority('Routine');
                  setIndication('');
                  setInstructions('');
                } catch (e) {
                  // Error handled in service
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="bg-[#845701] hover:bg-[#704A01] text-white font-bold text-[14px] rounded-md px-12 h-11 shadow-lg shadow-[#845701]/20 transition-all tracking-tight"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Order Investigation
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
