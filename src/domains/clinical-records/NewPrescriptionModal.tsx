import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Pill, X, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { savePrescription } from '../../services/clinicalFirestoreService';
import { generateFriendlyInstructions } from '../../services/aiService';
import { motion, AnimatePresence } from 'motion/react';

interface NewPrescriptionModalProps {
  patientId: string;
  children: React.ReactNode;
}

export function NewPrescriptionModal({ patientId, children }: NewPrescriptionModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Form State
  const [medicationName, setMedicationName] = React.useState('');
  const [dosage, setDosage] = React.useState('');
  const [route, setRoute] = React.useState('oral');
  const [frequency, setFrequency] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [durationUnit, setDurationUnit] = React.useState('days');
  const [refills, setRefills] = React.useState('0');
  const [sig, setSig] = React.useState('');

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
                className="h-10 w-10 bg-[#107C10] flex items-center justify-center rounded-lg shadow-sm"
              >
                < Pill className="h-5.5 w-5.5 text-white" />
              </motion.div>
              <motion.span
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                New Prescription
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
            {/* Medication Search */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Medication Name <span className="text-[#A4262C]">*</span></Label>
              <Input 
                placeholder="Start typing a drug name..." 
                className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px] transition-all"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
              />
            </motion.div>

            {/* Dosage & Route Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#242424]">Dosage <span className="text-[#A4262C]">*</span></Label>
                <Input 
                  placeholder="e.g., 10mg" 
                  className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#242424]">Route</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger className="h-11 border-[#8A8886] focus:ring-[#0078D4]/20">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="intravenous">Intravenous</SelectItem>
                    <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                    <SelectItem value="intramuscular">Intramuscular</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Frequency & Duration Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#242424]">Frequency <span className="text-[#A4262C]">*</span></Label>
                <Input 
                  placeholder="e.g., Once daily" 
                  className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#242424]">Duration</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g., 14" 
                    className="h-11 flex-1 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                  <Select value={durationUnit} onValueChange={setDurationUnit}>
                    <SelectTrigger className="h-11 w-28 border-[#8A8886]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">days</SelectItem>
                      <SelectItem value="weeks">weeks</SelectItem>
                      <SelectItem value="months">months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Refills */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-[13px] font-bold text-[#242424]">Refills</Label>
              <Input 
                placeholder="e.g., 3" 
                type="number"
                className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                value={refills}
                onChange={(e) => setRefills(e.target.value)}
              />
            </motion.div>

            {/* Directions (SIG) */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-bold text-[#242424]">Directions (SIG)</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isGeneratingAI || !medicationName || !dosage || !frequency}
                  onClick={async () => {
                    setIsGeneratingAI(true);
                    const instructions = await generateFriendlyInstructions(medicationName, dosage, frequency);
                    if (instructions) {
                      setSig(instructions);
                    }
                    setIsGeneratingAI(false);
                  }}
                  className="h-8 border-[#EDEBE9] bg-[#F1F0FF] text-[#5C2D91] hover:bg-[#EBE9FF] gap-1.5 px-3 rounded-full text-[11px] font-bold shadow-sm disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isGeneratingAI ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              <Textarea 
                placeholder="Patient-friendly instructions..." 
                className="min-h-[120px] bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-4 leading-relaxed resize-none shadow-sm transition-all duration-200"
                value={sig}
                onChange={(e) => setSig(e.target.value)}
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
              disabled={isSubmitting || !medicationName || !dosage || !frequency}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await savePrescription(patientId, {
                    medicationName,
                    dosage,
                    route,
                    frequency,
                    duration,
                    durationUnit,
                    refills: parseInt(refills) || 0,
                    sig
                  });
                  setIsOpen(false);
                  // Reset form
                  setMedicationName('');
                  setDosage('');
                  setRoute('oral');
                  setFrequency('');
                  setDuration('');
                  setDurationUnit('days');
                  setRefills('0');
                  setSig('');
                } catch (e) {
                  // Error handled in service
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="bg-[#107C10] hover:bg-[#0E6D0E] text-white font-bold text-[14px] rounded-md px-12 h-11 shadow-lg shadow-[#107C10]/20 transition-all tracking-tight"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finalize & Print
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
