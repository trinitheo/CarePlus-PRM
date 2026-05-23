import React, { useState } from 'react';
import { useCommandDispatcher, Patient, ClinicalIntake } from '../../store/eventStore';
import { savePatient, saveClinicalIntake, updatePatientVitals } from '../../services/clinicalFirestoreService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Activity, ClipboardList, Stethoscope, Heart, ShieldCheck, Loader2, Thermometer, ChevronRight, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SolidificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function SolidificationModal({ isOpen, onClose, patient }: SolidificationModalProps) {
  const dispatch = useCommandDispatcher();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Clinical Intake State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [ongoingConditions, setOngoingConditions] = useState('');
  const [allergies, setAllergies] = useState('');

  // Baseline Vitals State
  const [vitals, setVitals] = useState({
    hr: '80',
    bp: '120/80',
    temp: '37.0',
    rr: '16',
    spo2: '98',
    glucose: '100',
    weight: '70',
    height: '175',
  });

  const handleVitalsChange = (field: string, val: string) => {
    setVitals(prev => ({ ...prev, [field]: val }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      toast.error("Please enter the Chief Complaint to continue.");
      return;
    }
    setActiveStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const intakeId = `intake-${Date.now()}`;
      
      // Calculate BMI
      const weightNum = parseFloat(vitals.weight || '0');
      const heightNum = parseFloat(vitals.height || '0') / 100;
      let bmiVal = 0;
      if (weightNum > 0 && heightNum > 0) {
        bmiVal = parseFloat((weightNum / (heightNum * heightNum)).toFixed(1));
      }

      // 1. Prepare updated Patient Record
      const updatedConditions = ongoingConditions
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const updatedPatient: Patient = {
        ...patient,
        conditions: updatedConditions.length > 0 ? updatedConditions : (patient.conditions || []),
        isDraft: false, // Solidify the record!
        chiefComplaint: chiefComplaint.trim()
      };

      // 2. Prepare Clinical Intake Record
      const formattedIntake: ClinicalIntake = {
        id: intakeId,
        patientId: patient.id,
        chiefComplaint: chiefComplaint.trim(),
        historyOfPresentIllness: hpi.trim(),
        medicalHistory: updatedConditions.join(', '),
        surgicalHistory: '',
        familyHistory: '',
        socialHistory: 'Baseline recorded at initial examination',
        medications: '',
        allergies: allergies.trim() || 'No known allergies',
        reviewOfSystems: 'Baseline ROS normal or unchanged at physical exam',
        immunizations: '',
        hospitalizations: '',
        timestamp: Date.now()
      };

      // 3. Prepare Vitals Payload
      const vitalsPayload = {
        hr: Number(vitals.hr) || 80,
        bp: vitals.bp || '120/80',
        temp: Number(vitals.temp) || 37.0,
        rr: Number(vitals.rr) || 16,
        spo2: Number(vitals.spo2) || 98,
        glucose: Number(vitals.glucose) || 100,
        weight: Number(vitals.weight) || 70,
        height: Number(vitals.height) || 175,
        bmi: bmiVal,
        gcs: '15/15',
        timestamp: Date.now(),
        patientId: patient.id
      };

      console.log("Saving solidified clinical patient file to cloud...");

      // Call Firestore syncing functions sequentially
      await savePatient(patient.id, updatedPatient);
      await saveClinicalIntake(patient.id, intakeId, formattedIntake);
      await updatePatientVitals(patient.id, vitalsPayload);

      // Dispatch to event store for local synchronous rendering
      dispatch({
        type: 'PATIENT_REGISTERED',
        payload: updatedPatient
      });

      dispatch({
        type: 'CLINICAL_INTAKE_RECORDED',
        payload: formattedIntake
      });

      dispatch({
        type: 'VITALS_RECORDED',
        payload: vitalsPayload
      });

      toast.success("Initial history saved. Patient record solidified successfully!");
      onClose();
    } catch (err) {
      console.error("Solidification error occurred:", err);
      toast.error("Failed to save and solidify patient history.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white border-none rounded-2xl shadow-2xl font-segoe">
        <DialogHeader className="p-6 pb-4 border-b border-[#F3F2F1] bg-[#FAFAFA] flex flex-row items-center gap-3 space-y-0">
          <div className="h-10 w-10 bg-[#DEECF9] rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#0078D4]" />
          </div>
          <div>
            <DialogTitle className="text-lg font-black text-[#242424] tracking-tight">Solidify Patient History</DialogTitle>
            <DialogDescription className="text-xs font-medium text-[#616161]">
              Perform initial provider examination to activate the medical twin for {patient.name}.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-[#F3F2F1] bg-[#FAFAFA]/50 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black ${activeStep === 1 ? 'bg-[#0078D4] text-white' : 'bg-[#DFF6DD] text-[#107C10]'}`}>
              {activeStep === 1 ? '1' : '✓'}
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#242424]">Clinical Presentation</span>
          </div>
          <div className="h-[1px] w-12 bg-[#EDEBE9]" />
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black ${activeStep === 2 ? 'bg-[#0078D4] text-white' : 'bg-[#F3F2F1] text-[#616161]'}`}>
              2
            </span>
            <span className={`text-xs font-black uppercase tracking-wider ${activeStep === 2 ? 'text-[#242424]' : 'text-[#616161]'}`}>Objective Vitals</span>
          </div>
        </div>

        {activeStep === 1 ? (
          <form onSubmit={handleNext} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-[#616161]">Chief Complaint *</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3.5 h-4 w-4 text-[#A19F9D]" />
                <Input
                  className="pl-9 h-11 font-medium bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white"
                  placeholder="e.g. Acute severe lower back pain radiating down left leg"
                  required
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-[#616161]">History of Present Illness (HPI)</Label>
              <Textarea
                className="min-h-[110px] p-3 font-medium bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white leading-relaxed"
                placeholder="Describe the duration, severity, onset, triggers, and progression of current symptoms..."
                value={hpi}
                onChange={e => setHpi(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-[#616161]">Ongoing Medical Conditions (Comma-separated)</Label>
                <Input
                  className="h-11 font-medium bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white"
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  value={ongoingConditions}
                  onChange={e => setOngoingConditions(e.target.value)}
                />
                <p className="text-[10px] font-medium text-[#A19F9D]">This seeds the Patient's live conditions list.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-[#616161]">Allergies & Sensitivities</Label>
                <Input
                  className="h-11 font-medium bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white"
                  placeholder="e.g. Latex, Penicillin, Peanuts"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                />
                <p className="text-[10px] font-medium text-[#A19F9D]">Critical allergy flags for electronic prescribing guardrails.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#EDEBE9] flex justify-end">
              <Button type="submit" className="bg-[#0078D4] hover:bg-[#006ABD] text-white font-black uppercase tracking-widest text-xs h-11 px-6 rounded-xl flex items-center gap-2">
                Configure Objective Vitals
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0078D4] flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              Clinical Baseline Biometrics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Heart Rate (bpm)</Label>
                <Input type="number" value={vitals.hr} onChange={e => handleVitalsChange('hr', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Blood Pressure (mmHg)</Label>
                <Input type="text" value={vitals.bp} onChange={e => handleVitalsChange('bp', e.target.value)} className="h-11 bg-[#FAFAFA]" placeholder="120/80" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Temperature (°C)</Label>
                <Input type="number" step="0.1" value={vitals.temp} onChange={e => handleVitalsChange('temp', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Respiration Rate</Label>
                <Input type="number" value={vitals.rr} onChange={e => handleVitalsChange('rr', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">SpO2 (%)</Label>
                <Input type="number" value={vitals.spo2} onChange={e => handleVitalsChange('spo2', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Blood Glucose</Label>
                <Input type="number" value={vitals.glucose} onChange={e => handleVitalsChange('glucose', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Weight (kg)</Label>
                <Input type="number" value={vitals.weight} onChange={e => handleVitalsChange('weight', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-[#616161]">Height (cm)</Label>
                <Input type="number" value={vitals.height} onChange={e => handleVitalsChange('height', e.target.value)} className="h-11 bg-[#FAFAFA]" required />
              </div>
            </div>

            <div className="pt-6 border-t border-[#EDEBE9] flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setActiveStep(1)} className="border-[#EDEBE9] hover:bg-[#F3F2F1] text-xs font-black uppercase tracking-widest text-[#616161] h-11 px-5 rounded-xl">
                Back to Presentation
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#107C10] hover:bg-[#0B590B] text-white font-black uppercase tracking-widest text-xs h-11 px-6 rounded-xl flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Solidifying Graph...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Solidify & Start History
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
