import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { UserPlus, X, Search, ChevronDown, Flag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { saveReferral } from '../../services/clinicalFirestoreService';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface NewReferralModalProps {
  patientId: string;
  children: React.ReactNode;
}

export function NewReferralModal({ patientId, children }: NewReferralModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Form State
  const [fromProvider, setFromProvider] = React.useState('Dr. Sarah Chen');
  const [toProvider, setToProvider] = React.useState('');
  const [specialty, setSpecialty] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [urgency, setUrgency] = React.useState('routine');
  const [notes, setNotes] = React.useState('');

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
                className="h-10 w-10 bg-[#A4262C] flex items-center justify-center rounded-lg shadow-sm"
              >
                <UserPlus className="h-5.5 w-5.5 text-white" />
              </motion.div>
              <motion.span
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                New Referral
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
            {/* From & To Row */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#616161]">From</Label>
                <div className="relative">
                  <Input 
                    value={fromProvider} 
                    disabled
                    className="h-11 bg-[#F3F2F1] border-[#EDEBE9] text-[#242424] font-medium rounded-md text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#242424]">To (Provider / Clinic)</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4 text-[#616161] group-focus-within:text-[#0078D4]" />
                    </div>
                    <Input 
                      placeholder="e.g., Dr. Alan Grant" 
                      className="h-11 pl-10 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                      value={toProvider}
                      onChange={(e) => setToProvider(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#242424]">Specialty <span className="text-[#A4262C]">*</span></Label>
                  <Input 
                    placeholder="e.g., Gastroenterology" 
                    className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Reason for Referral */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Reason for Referral <span className="text-[#A4262C]">*</span></Label>
              <Textarea 
                placeholder="Briefly describe the reason for this referral..." 
                className="min-h-[100px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </motion.div>

            {/* Urgency */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="h-11 border-[#8A8886] focus:ring-[#0078D4]/20">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="stat">STAT / Urgent</SelectItem>
                  <SelectItem value="within-1-week">Within 1 Week</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Additional Notes */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#616161]">Additional Notes (Optional)</Label>
              <Textarea 
                placeholder="Include any relevant history, findings, or specific questions for the consultant..." 
                className="min-h-[140px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              disabled={isSubmitting || !specialty || !reason}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await saveReferral(patientId, {
                    fromProvider,
                    toProvider,
                    specialty,
                    reason,
                    urgency,
                    notes
                  });
                  setIsOpen(false);
                  // Reset form
                  setFromProvider('Dr. Sarah Chen');
                  setToProvider('');
                  setSpecialty('');
                  setReason('');
                  setUrgency('routine');
                  setNotes('');
                } catch (e) {
                  // Error handled in service
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="bg-[#A4262C] hover:bg-[#8D2126] text-white font-bold text-[14px] rounded-md px-12 h-11 shadow-lg shadow-[#A4262C]/20 transition-all tracking-tight"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Issue Referral
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
