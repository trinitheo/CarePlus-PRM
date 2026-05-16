import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { 
  Sparkles, 
  Search, 
  Loader2, 
  Pill, 
  History, 
  ArrowRight,
  FlaskConical,
  AlertCircle,
  Share2,
  Printer,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Lock
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { searchMedications, getMedicationStrengths, ClinicalCode } from '../../services/clinicalRegistryService';
import { generateFriendlyInstructions, checkLabMonitoringRequirements } from '../../services/aiService';
import { savePrescription } from '../../services/clinicalFirestoreService';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface PrescriptionPadModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    canWrite?: boolean;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-[#DEECF9] text-[#0078D4] px-1 rounded-md font-black">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

export function PrescriptionPadModal({ isOpen, onClose, patientId, patientName, canWrite = true }: PrescriptionPadModalProps) {
    const { userProfile } = useCurrentUser();
    const [medicationName, setMedicationName] = useState('');
    const [suggestions, setSuggestions] = useState<ClinicalCode[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const [dose, setDose] = useState('');
    const [strengthSuggestions, setStrengthSuggestions] = useState<string[]>([]);
    const [isFetchingStrengths, setIsFetchingStrengths] = useState(false);
    
    const [route, setRoute] = useState('oral');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [durationUnit, setDurationUnit] = useState('days');
    const [refills, setRefills] = useState('0');
    const [notes, setNotes] = useState('');
    const [isGeneratingSig, setIsGeneratingSig] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [recommendedLab, setRecommendedLab] = useState<any>(null);
    const [pharmacyNetwork, setPharmacyNetwork] = useState<'surescripts' | 'print' | 'internal'>('surescripts');
    const [selectedPharmacy, setSelectedPharmacy] = useState('CVS Pharmacy #0421 - Downtown');

    const pharmacies = [
      'CVS Pharmacy #0421 - Downtown',
      'Walgreens Specialty - North Park',
      'Rite Aid #1024 - Medical Plaza',
      'Community Health Pharmacy (Internal)'
    ];

    // Medication Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (medicationName.length >= 3) {
                setIsSearching(true);
                try {
                   const results = await searchMedications(medicationName);
                   setSuggestions(results);
                   setShowSuggestions(results.length > 0);
                } catch (error) {
                   console.error("NormRX Search Error:", error);
                } finally {
                   setIsSearching(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [medicationName]);

    const handleSelectMedication = async (med: string) => {
        setMedicationName(med);
        setShowSuggestions(false);
        setIsFetchingStrengths(true);
        
        // Auto-population logic for dosage and route
        // Strength pattern: 81 MG, 10/325 MG, 500 MG
        const strengthMatch = med.match(/(\d+(\/\d+)?\s*(mg|mcg|ml|g|units|iu|%))/i);
        if (strengthMatch) {
            setDose(strengthMatch[0]);
        }

        // Route detection
        const medLower = med.toLowerCase();
        if (medLower.includes('oral') || medLower.includes('capsule') || medLower.includes('tablet')) {
            setRoute('oral');
        } else if (medLower.includes('injection') || medLower.includes('injectable') || medLower.includes('iv')) {
            setRoute('iv');
        } else if (medLower.includes('topical') || medLower.includes('cream') || medLower.includes('ointment')) {
            setRoute('topical');
        } else if (medLower.includes('subcutaneous') || medLower.includes('pen injector')) {
            setRoute('sc');
        }
        
        try {
          const [strengths, labReq] = await Promise.all([
            getMedicationStrengths(med),
            checkLabMonitoringRequirements(med)
          ]);
          
          setStrengthSuggestions(strengths);
          setRecommendedLab(labReq.required ? labReq : null);
        } finally {
          setIsFetchingStrengths(false);
        }
    };

    const handleGenerateSig = async () => {
        if (!medicationName || !dose || !frequency) return;
        setIsGeneratingSig(true);
        try {
            const sig = await generateFriendlyInstructions(
                medicationName,
                dose,
                frequency
            );
            setNotes(sig);
        } finally {
            setIsGeneratingSig(false);
        }
    };
    
    const handleSave = async () => {
        if (!medicationName || !dose || !frequency) return;
        setIsSaving(true);
        setErrorMessage(null);
        try {
            await savePrescription(patientId, {
                medicationName,
                dosage: dose,
                route,
                frequency,
                duration: `${duration} ${durationUnit}`,
                refills: parseInt(refills) || 0,
                sig: notes,
                authorName: userProfile?.displayName || 'Clinical Provider',
                labMonitoring: recommendedLab?.required ? recommendedLab : null
            });
            resetForm();
            onClose();
        } catch (error: any) {
            console.error('Prescription save failure:', error);
            setErrorMessage(error.message?.includes('permission') ? 'Security: Access Denied' : 'Sync error: Rx not saved');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setMedicationName('');
        setSuggestions([]);
        setDose('');
        setStrengthSuggestions([]);
        setRoute('oral');
        setFrequency('');
        setDuration('');
        setDurationUnit('days');
        setRefills('0');
        setNotes('');
        setRecommendedLab(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[650px] w-full p-0 overflow-hidden bg-white border-none rounded-3xl shadow-2xl h-[85vh] flex flex-col">
                <DialogHeader className="px-8 py-6 bg-[#FAFAFA] border-b border-[#EDEBE9]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#DEECF9] flex items-center justify-center">
                            <Pill className="h-5 w-5 text-[#0078D4]" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-[#242424]">New Prescription for {patientName}</DialogTitle>
                            <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest mt-0.5">NormRX Clinical Drug Repository</p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-8">
                        {/* Medication Search */}
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label className="text-[13px] font-bold text-[#242424]">
                                    Medication Name <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Badge variant="outline" className="bg-[#F3F2F1] border-none text-[#616161] text-[7px] font-black uppercase tracking-widest px-1.5 py-0">
                                        Powered by NormRX
                                    </Badge>
                                </div>
                            </div>
                            <div className="relative">
                                <Input 
                                    placeholder="Start typing medication name..." 
                                    className="h-11 bg-white border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 rounded-xl text-[14px] font-medium transition-all"
                                    value={medicationName}
                                    onChange={(e) => setMedicationName(e.target.value)}
                                    onFocus={() => medicationName.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                                    autoComplete="off"
                                />
                                {isSearching && <Loader2 className="absolute right-4 top-3.5 h-4 w-4 animate-spin text-[#0078D4]" />}
                                {medicationName && !isSearching && (
                                    <button 
                                        onClick={() => { setMedicationName(''); setSuggestions([]); setShowSuggestions(false); }}
                                        className="absolute right-4 top-3.5"
                                    >
                                        <ArrowRight className="h-4 w-4 text-[#A19F9D] rotate-45" />
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {(showSuggestions || (isSearching && medicationName.length >= 3)) && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute z-[100] w-full bg-white border border-[#EDEBE9] rounded-xl shadow-2xl mt-1 overflow-hidden fluent-shadow-deep"
                                    >
                                        <div className="max-h-60 overflow-y-auto">
                                            {isSearching ? (
                                                <div className="px-4 py-8 text-center text-[#616161]">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0078D4] opacity-50" />
                                                    <p className="text-[11px] font-black uppercase tracking-widest">Searching NormRX...</p>
                                                </div>
                                            ) : suggestions.length > 0 ? (
                                                suggestions.map((s, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => handleSelectMedication(s.display)}
                                                        className="px-4 py-3 text-[12px] leading-relaxed text-[#323130] hover:bg-[#F3F9FD] cursor-pointer flex items-start justify-between group border-b border-[#F3F2F1] last:border-0 transition-colors"
                                                    >
                                                        <div className="flex-1 pr-6 font-medium">
                                                            <Highlight text={s.display} highlight={medicationName} />
                                                        </div>
                                                        <ArrowRight className="h-3 w-3 mt-1 opacity-0 group-hover:opacity-40 transition-all shrink-0" />
                                                    </div>
                                                ))
                                            ) : medicationName.length >= 3 ? (
                                                <div className="px-4 py-8 text-center text-[#A19F9D]">
                                                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-20" />
                                                    <p className="text-[11px] font-black uppercase tracking-widest">No clinical matches found</p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Dose & Route */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-bold text-[#242424]">Dosage / Strength</Label>
                                <div className="space-y-2">
                                    <Input 
                                        placeholder="e.g., 20mg" 
                                        className="h-11 rounded-xl"
                                        value={dose}
                                        onChange={(e) => setDose(e.target.value)}
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {strengthSuggestions.slice(0, 5).map((s, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setDose(s)}
                                                className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${dose === s ? 'bg-[#0078D4] text-white' : 'bg-[#F3F2F1] text-[#616161] hover:bg-[#EDEBE9]'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-bold text-[#242424]">Route</Label>
                                <Select value={route} onValueChange={setRoute}>
                                    <SelectTrigger className="h-11 rounded-xl border-[#8A8886]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="oral">Oral</SelectItem>
                                        <SelectItem value="iv">Intravenous</SelectItem>
                                        <SelectItem value="im">Intramuscular</SelectItem>
                                        <SelectItem value="topical">Topical</SelectItem>
                                        <SelectItem value="sc">Subcutaneous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Frequency & Duration */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-bold text-[#242424]">Frequency</Label>
                                <Input 
                                    placeholder="e.g., BID (Twice daily)" 
                                    className="h-11 rounded-xl"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-bold text-[#242424]">Duration</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="number"
                                        className="h-11 rounded-xl w-24 text-center"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    />
                                    <Select value={durationUnit} onValueChange={setDurationUnit}>
                                        <SelectTrigger className="h-11 rounded-xl flex-1 border-[#8A8886]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="days">Days</SelectItem>
                                            <SelectItem value="weeks">Weeks</SelectItem>
                                            <SelectItem value="months">Months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Lab Correlation Notification */}
                        {recommendedLab && (
                             <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#FFF4CE] border border-[#FDE300] rounded-2xl p-5 flex gap-4 shadow-sm"
                            >
                                <FlaskConical className="h-6 w-6 text-[#845701] shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black uppercase text-[#845701] tracking-widest">Lab Monitoring Required</h4>
                                    <p className="text-sm font-bold text-[#242424] opacity-80">{recommendedLab.testName} ({recommendedLab.frequency})</p>
                                    <p className="text-[11px] font-medium text-[#845701] italic mt-1 font-serif leading-relaxed">"{recommendedLab.rationale}"</p>
                                </div>
                            </motion.div>
                        )}

                        {/* SIG Instructions */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[13px] font-bold text-[#242424]">Patient Directions (SIG)</Label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 rounded-lg text-[#0078D4] hover:bg-[#F3F9FD] gap-2 font-bold text-[10px] uppercase tracking-widest"
                                    onClick={handleGenerateSig}
                                    disabled={isGeneratingSig || !medicationName || !dose || !frequency}
                                >
                                    {isGeneratingSig ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    AI Smart-Draft
                                </Button>
                            </div>
                            <Textarea 
                                className="min-h-[100px] rounded-2xl border-[#8A8886] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 bg-white text-sm font-serif p-4 italic text-[#616161]"
                                placeholder="Patient-friendly instructions will appear here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* e-Prescribing Section */}
                        <div className="pt-4 border-t border-[#EDEBE9] space-y-4">
                            <div className="flex items-center justify-between">
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
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-8 py-6 bg-[#FAFAFA] border-t border-[#EDEBE9] flex flex-col gap-4">
                    {errorMessage && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#A4262C] bg-[#FDE7E9] px-4 py-2 rounded-xl">
                            <AlertCircle className="h-3 w-3" />
                            {errorMessage}
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button variant="outline" onClick={onClose} className="rounded-xl h-12 px-6 text-[13px] font-bold text-[#242424] border-[#EDEBE9] hover:bg-[#F3F2F1]">
                            Cancel
                        </Button>
                        {canWrite ? (
                            <Button 
                                className="rounded-xl h-12 px-8 bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[13px] shadow-lg shadow-[#0078D4]/10 gap-3"
                                disabled={isSaving || !medicationName || !dose || !frequency}
                                onClick={handleSave}
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                                Save Prescription
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 bg-[#F3F2F1] px-6 py-3 rounded-xl border border-[#EDEBE9]">
                                <Lock className="h-4 w-4 text-[#616161]" />
                                <span className="text-[11px] font-black uppercase text-[#616161]">Read Only</span>
                            </div>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PrescriptionPadModal;
