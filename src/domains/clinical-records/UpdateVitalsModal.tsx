import React, { useState } from 'react';
import { 
  X, Minus, Square, Send, 
  Activity, Heart, Thermometer, Wind, 
  Droplets, Scale, Ruler, Trash2, 
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../../components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select';
import { updatePatientVitals } from '../../services/clinicalFirestoreService';
import { useCommandDispatcher } from '../../store/eventStore';

interface UpdateVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  currentVitals?: any;
}

export function UpdateVitalsModal({ isOpen, onClose, patientId, currentVitals }: UpdateVitalsModalProps) {
  const dispatch = useCommandDispatcher();
  const [vitals, setVitals] = useState({
    hr: '',
    bp: '',
    temp: '',
    rr: '',
    spo2: '',
    glucose: '',
    weight: '',
    height: '',
    bmi: '',
    hba1c: '',
    gcs_e: 4,
    gcs_v: 5,
    gcs_m: 6,
    avpu: 'Alert'
  });

  // Sync state when modal opens or currentVitals changes
  React.useEffect(() => {
    if (isOpen) {
      setVitals({
        hr: currentVitals?.hr?.toString() || '',
        bp: currentVitals?.bp || '',
        temp: currentVitals?.temp?.toString() || '',
        rr: currentVitals?.rr?.toString() || '16',
        spo2: currentVitals?.spo2?.toString() || '98',
        glucose: currentVitals?.glucose?.toString() || '98',
        weight: currentVitals?.weight?.toString() || '88.5',
        height: currentVitals?.height?.toString() || '178',
        bmi: currentVitals?.bmi?.toString() || '27.9',
        hba1c: currentVitals?.hba1c?.toString() || '6.8',
        gcs_e: currentVitals?.gcs_e || 4,
        gcs_v: currentVitals?.gcs_v || 5,
        gcs_m: currentVitals?.gcs_m || 6,
        avpu: currentVitals?.avpu || 'Alert'
      });
    }
  }, [isOpen, currentVitals]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const gcsTotal = Number(vitals.gcs_e) + Number(vitals.gcs_v) + Number(vitals.gcs_m);
      
      const payload = {
        ...vitals,
        hr: vitals.hr ? Number(vitals.hr) : (currentVitals?.hr || 0),
        temp: vitals.temp ? Number(vitals.temp) : (currentVitals?.temp || 0),
        rr: vitals.rr ? Number(vitals.rr) : (currentVitals?.rr || 0),
        spo2: vitals.spo2 ? Number(vitals.spo2) : (currentVitals?.spo2 || 0),
        glucose: vitals.glucose ? Number(vitals.glucose) : (currentVitals?.glucose || 0),
        weight: vitals.weight ? Number(vitals.weight) : (currentVitals?.weight || 0),
        height: vitals.height ? Number(vitals.height) : (currentVitals?.height || 0),
        bmi: vitals.bmi ? Number(vitals.bmi) : (currentVitals?.bmi || 0),
        hba1c: vitals.hba1c ? Number(vitals.hba1c) : (currentVitals?.hba1c || 0),
        gcs: `${gcsTotal}/15`,
        timestamp: Date.now(),
        updatedAt: new Date()
      };

      await updatePatientVitals(patientId, payload);
      
      // Dispatch to local event store for Ledger reflection
      dispatch({
        type: 'VITALS_RECORDED',
        payload: {
          patientId,
          hr: payload.hr,
          bp: payload.bp,
          temp: payload.temp,
          timestamp: payload.timestamp
        }
      });

      onClose();
    } catch (error) {
      console.error('Error updating vitals:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputFields = [
    { label: 'Heart Rate', key: 'hr', unit: 'bpm', type: 'number' },
    { label: 'Blood Pressure', key: 'bp', unit: 'mmHg', placeholder: '120/80' },
    { label: 'Temperature', key: 'temp', unit: '°C', type: 'number' },
    { label: 'Resp. Rate', key: 'rr', unit: 'br/min', type: 'number' },
    { label: 'SpO2', key: 'spo2', unit: '%', type: 'number' },
    { label: 'Glucose', key: 'glucose', unit: 'mg/dL', type: 'number' },
    { label: 'Weight', key: 'weight', unit: 'kg', type: 'number' },
    { label: 'Height', key: 'height', unit: 'cm', type: 'number' },
    { label: 'BMI', key: 'bmi', unit: '', type: 'number' },
    { label: 'HbA1c', key: 'hba1c', unit: '%', type: 'number' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[416px] w-full bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden font-segoe">
        <DialogHeader className="p-4 py-2.5 border-b border-[#F3F2F1] flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold text-[#242424]">Update Patient Vitals</DialogTitle>
        </DialogHeader>

        <div className="p-3 grid grid-cols-2 gap-2 bg-[#FAFBFC]">
          {inputFields.map((field) => (
            <div key={field.key} className="bg-white p-2 px-3 rounded-xl border border-[#EDEBE9] shadow-sm hover:border-[#0078D4] transition-all group">
              <Label className="text-[9px] font-bold text-[#616161] mb-0 block tracking-tight uppercase opacity-70">
                {field.label}
              </Label>
              <div className="flex items-baseline gap-2">
                <input 
                  type={field.type || 'text'}
                  value={(vitals as any)[field.key]}
                  onChange={(e) => setVitals({ ...vitals, [field.key]: e.target.value })}
                  className="flex-1 w-0 text-base font-semibold text-[#242424] border-none focus:ring-0 p-0 placeholder:text-[#EDEBE9] bg-transparent"
                  placeholder={field.placeholder || ''}
                />
                <span className="text-[8px] font-bold text-[#A19F9D] uppercase tracking-tighter shrink-0">
                  {field.unit}
                </span>
              </div>
            </div>
          ))}

          <div className="bg-white p-2 px-3 rounded-xl border border-[#EDEBE9] shadow-sm hover:border-[#0078D4] transition-all group col-span-2">
            <Label className="text-[9px] font-bold text-[#616161] mb-1 block tracking-tight uppercase opacity-70">
              GCS Components (Eye, Verbal, Motor)
            </Label>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col flex-1">
                <span className="text-[8px] font-bold text-[#A19F9D] mb-0.5">E</span>
                <input 
                  type="number" 
                  min="1" max="4"
                  value={vitals.gcs_e} 
                  onChange={(e) => setVitals({ ...vitals, gcs_e: Number(e.target.value) })}
                  className="w-full text-sm font-semibold border-b border-[#F3F2F1] focus:border-[#0078D4] focus:ring-0 p-0 bg-transparent"
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[8px] font-bold text-[#A19F9D] mb-0.5">V</span>
                <input 
                  type="number" 
                  min="1" max="5"
                  value={vitals.gcs_v} 
                  onChange={(e) => setVitals({ ...vitals, gcs_v: Number(e.target.value) })}
                  className="w-full text-sm font-semibold border-b border-[#F3F2F1] focus:border-[#0078D4] focus:ring-0 p-0 bg-transparent"
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[8px] font-bold text-[#A19F9D] mb-0.5">M</span>
                <input 
                  type="number" 
                  min="1" max="6"
                  value={vitals.gcs_m} 
                  onChange={(e) => setVitals({ ...vitals, gcs_m: Number(e.target.value) })}
                  className="w-full text-sm font-semibold border-b border-[#F3F2F1] focus:border-[#0078D4] focus:ring-0 p-0 bg-transparent"
                />
              </div>
              <div className="flex flex-col items-center pl-2 border-l border-[#F3F2F1]">
                <span className="text-[8px] font-bold text-[#A19F9D] mb-0.5 uppercase">Total</span>
                <span className="text-sm font-bold text-[#0078D4]">{Number(vitals.gcs_e) + Number(vitals.gcs_v) + Number(vitals.gcs_m)}/15</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-2 px-3 rounded-xl border border-[#EDEBE9] shadow-sm hover:border-[#0078D4] transition-all group">
             <Label className="text-[9px] font-bold text-[#616161] mb-0 block tracking-tight uppercase opacity-70">
                AVPU
              </Label>
              <Select value={vitals.avpu} onValueChange={(val) => setVitals({ ...vitals, avpu: val })}>
                <SelectTrigger className="border-none p-0 h-auto focus:ring-0 shadow-none text-base font-semibold text-[#242424] bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alert">Alert</SelectItem>
                  <SelectItem value="Voice">Voice</SelectItem>
                  <SelectItem value="Pain">Pain</SelectItem>
                  <SelectItem value="Unresponsive">Unresponsive</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>

        <DialogFooter className="p-2.5 px-4 bg-white border-t border-[#F3F2F1] flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-9 rounded-xl bg-[#F3F2F1] text-[#616161] font-bold hover:bg-[#EDEBE9]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 h-9 rounded-xl bg-[#0078D4] text-white font-bold hover:bg-[#005A9E] shadow-md shadow-[#0078D4]/20"
          >
            {isSaving ? 'Saving...' : 'Save Vitals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
