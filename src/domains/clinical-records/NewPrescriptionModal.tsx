import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Pill, X, Loader2, Sparkles, ChevronDown, AlertCircle, FlaskConical, Share2, Printer, MapPin, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { savePrescription } from '../../services/clinicalFirestoreService';
import { generateFriendlyInstructions, checkLabMonitoringRequirements } from '../../services/aiService';
import { searchMedications, getMedicationStrengths, ClinicalCode } from '../../services/clinicalRegistryService';
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
  const [suggestions, setSuggestions] = React.useState<ClinicalCode[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const [dosage, setDosage] = React.useState('');
  const [strengthSuggestions, setStrengthSuggestions] = React.useState<string[]>([]);
  const [isFetchingStrengths, setIsFetchingStrengths] = React.useState(false);
  
  const [route, setRoute] = React.useState('oral');
  const [frequency, setFrequency] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [durationUnit, setDurationUnit] = React.useState('days');
  const [refills, setRefills] = React.useState('0');
  const [sig, setSig] = React.useState('');

  // Advanced Feature States
  const [recommendedLab, setRecommendedLab] = React.useState<any>(null);
  const [autoOrderLab, setAutoOrderLab] = React.useState(false);
  const [pharmacyNetwork, setPharmacyNetwork] = React.useState<'surescripts' | 'print' | 'internal'>('surescripts');
  const [selectedPharmacy, setSelectedPharmacy] = React.useState('CVS Pharmacy #0421 - Downtown');

  const pharmacies = [
    'CVS Pharmacy #0421 - Downtown',
    'Walgreens Specialty - North Park',
    'Rite Aid #1024 - Medical Plaza',
    'Community Health Pharmacy (Internal)'
  ];

  // Handle Autocomplete
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (medicationName.length >= 2 && !suggestions.find(s => s.display === medicationName)) {
        setIsSearching(true);
        const results = await searchMedications(medicationName);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [medicationName]);

  // Handle Selection & Advanced Checks
  const handleSelectMedication = async (med: string) => {
    setMedicationName(med);
    setShowSuggestions(false);
    setIsFetchingStrengths(true);
    
    try {
      const [strengths, labReq] = await Promise.all([
        getMedicationStrengths(med),
        checkLabMonitoringRequirements(med)
      ]);
      
      setStrengthSuggestions(strengths);
      if (labReq.required) {
        setRecommendedLab(labReq);
        setAutoOrderLab(true);
      } else {
        setRecommendedLab(null);
        setAutoOrderLab(false);
      }
    } finally {
      setIsFetchingStrengths(false);
    }
  };

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

  const handleClose = () => {
    setIsOpen(false);
    // Short delay to allow exit animation before resetting form
    setTimeout(() => {
      setMedicationName('');
      setDosage('');
      setRoute('oral');
      setFrequency('');
      setDuration('');
      setDurationUnit('days');
      setRefills('0');
      setSig('');
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
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
                <Pill className="h-5.5 w-5.5 text-white" />
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
          <DialogClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="h-9 w-9 rounded-md text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
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
            <motion.div variants={itemVariants} className="space-y-2 relative">
              <Label className="text-[13px] font-bold text-[#242424]">Medication Name <span className="text-[#A4262C]">*</span></Label>
              <div className="relative">
                <Input 
                  placeholder="Start typing a drug name..." 
                  className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px] transition-all pr-10"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0078D4] opacity-50" />
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 w-full bg-white border border-[#EDEBE9] rounded-lg shadow-xl mt-1 overflow-hidden"
                  >
                    <ScrollArea className="max-h-[240px]">
                      <div className="p-1">
                        {suggestions.map((suggestion, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleSelectMedication(suggestion.display)}
                            className="px-4 py-2.5 text-[14px] text-[#242424] hover:bg-[#F3F2F1] cursor-pointer rounded-md flex items-center justify-between group"
                          >
                            <span className="font-medium">{suggestion.display}</span>
                            <span className="text-[10px] text-[#A19F9D] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Dosage & Route Row */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#242424]">Dosage <span className="text-[#A4262C]">*</span></Label>
                  <div className="relative">
                    <Input 
                      placeholder="e.g., 10mg" 
                      className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-md text-[14px]"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                    />
                    {isFetchingStrengths && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-3 w-3 animate-spin text-[#0078D4]" />
                      </div>
                    )}
                  </div>
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
              </div>

              {/* Multi-Dosage Suggestions */}
              <AnimatePresence>
                {strengthSuggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-2 pt-1"
                  >
                    {strengthSuggestions.slice(0, 4).map((s, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDosage(s)}
                        className={`h-7 px-3 text-[10px] font-bold rounded-full transition-all ${dosage === s ? 'bg-[#0078D4] text-white border-[#0078D4]' : 'border-[#EDEBE9] text-[#616161] hover:bg-[#F3F2F1]'}`}
                      >
                        {s}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* AI Lab Correlation Notification */}
            <AnimatePresence>
              {recommendedLab && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#FFF4CE] border border-[#FDE300] rounded-xl p-4 flex gap-4 shadow-sm"
                >
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-[#FDE300]/50 shadow-sm">
                    <FlaskConical className="h-5 w-5 text-[#845701]" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-[12px] font-black text-[#845701] uppercase tracking-wider">Clinical Alert: Lab Monitoring Required</h5>
                    <p className="text-[13px] font-medium text-[#242424] mt-1">
                      {recommendedLab.testName} is recommended {recommendedLab.frequency} for patients on this regimen.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <Button 
                        onClick={() => setAutoOrderLab(!autoOrderLab)}
                        variant={autoOrderLab ? "default" : "outline"}
                        className={`h-7 rounded-sm text-[10px] font-black uppercase tracking-tight py-0 px-3 ${autoOrderLab ? 'bg-[#845701] text-white border-none' : 'border-[#845701]/20 text-[#845701] bg-white/50'}`}
                      >
                        {autoOrderLab && <CheckCircle2 className="h-3 w-3 mr-2" />}
                        {autoOrderLab ? 'Lab Order Queued' : 'Authorize Automatic Order'}
                      </Button>
                      <p className="text-[9px] font-bold text-[#845701]/60 italic max-w-[200px]">
                        Rationale: {recommendedLab.rationale}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* e-Prescribing Section */}
            <motion.div variants={itemVariants} className="pt-4 border-t border-[#EDEBE9] space-y-4">
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#0078D4]" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#242424]">e-Prescribing Network</span>
                </div>
                <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm">
                   Surescripts v6.1 Verified
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'surescripts', label: 'E-Send', icon: Share2 },
                  { id: 'print', label: 'In-Hand', icon: Printer },
                  { id: 'internal', label: 'Facility', icon: MapPin },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPharmacyNetwork(opt.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5 ${pharmacyNetwork === opt.id ? 'bg-[#F3F9FD] border-[#0078D4] text-[#0078D4]' : 'bg-white border-[#EDEBE9] text-[#616161] hover:bg-[#FAFAFA]'}`}
                  >
                    <opt.icon className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{opt.label}</span>
                  </button>
                ))}
              </div>

              {pharmacyNetwork === 'surescripts' && (
                <div className="p-4 bg-[#F3F2F1] rounded-xl border border-[#EDEBE9] flex justify-between items-center group cursor-pointer hover:bg-[#EDEBE9] transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[#616161]" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#242424]">{selectedPharmacy}</span>
                      <span className="text-[9px] font-bold text-[#A19F9D] uppercase">Distance: 0.8 mi • 24/7 Hours</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#A19F9D] group-hover:text-[#242424]" />
                </div>
              )}
            </motion.div>
          </motion.div>
        </ScrollArea>

        <DialogFooter className="px-10 py-6 bg-[#FAFAFA] border-t border-[#EDEBE9] flex justify-end items-center gap-4 shrink-0 z-10">
          <DialogClose asChild>
            <button 
              type="button"
              disabled={isSubmitting}
              className="text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] font-semibold text-[14px] rounded-md px-8 h-11 transition-colors border-none bg-transparent outline-none cursor-pointer focus:ring-2 focus:ring-[#EDEBE9]"
              onClick={handleClose}
            >
              Discard
            </button>
          </DialogClose>
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
                  handleClose();
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
