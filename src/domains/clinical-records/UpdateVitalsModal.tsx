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

interface UpdateVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  currentVitals?: any;
}

export function UpdateVitalsModal({ isOpen, onClose, patientId, currentVitals }: UpdateVitalsModalProps) {
  const [vitals, setVitals] = useState({
    hr: currentVitals?.hr?.toString() || '',
    bp: currentVitals?.bp || '',
    temp: currentVitals?.temp?.toString() || '',
    rr: '16',
    spo2: '98',
    glucose: '98',
    weight: '88.5',
    height: '178',
    bmi: '27.9',
    hba1c: '6.8',
    gcs: '15/15',
    avpu: 'Alert'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePatientVitals(patientId, {
        ...vitals,
        hr: vitals.hr ? Number(vitals.hr) : null,
        temp: vitals.temp ? Number(vitals.temp) : null,
        rr: vitals.rr ? Number(vitals.rr) : null,
        spo2: vitals.spo2 ? Number(vitals.spo2) : null,
        glucose: vitals.glucose ? Number(vitals.glucose) : null,
        weight: vitals.weight ? Number(vitals.weight) : null,
        height: vitals.height ? Number(vitals.height) : null,
        bmi: vitals.bmi ? Number(vitals.bmi) : null,
        hba1c: vitals.hba1c ? Number(vitals.hba1c) : null,
        updatedAt: new Date()
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
    { label: 'Blood Pressure', key: 'bp', unit: '', placeholder: '120/80' },
    { label: 'Temperature', key: 'temp', unit: '°C' },
    { label: 'Resp. Rate', key: 'rr', unit: 'breaths/min' },
    { label: 'SpO2', key: 'spo2', unit: '%' },
    { label: 'Glucose', key: 'glucose', unit: 'mg/dL' },
    { label: 'Weight', key: 'weight', unit: 'kg' },
    { label: 'Height', key: 'height', unit: 'cm' },
    { label: 'BMI', key: 'bmi', unit: '' },
    { label: 'HbA1c', key: 'hba1c', unit: '%' },
    { label: 'GCS', key: 'gcs', unit: '' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden font-segoe">
        <DialogHeader className="p-4 py-3 border-b border-[#F3F2F1] flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-[#242424]">Update Patient Vitals</DialogTitle>
        </DialogHeader>

        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 bg-[#FAFBFC]">
          {inputFields.map((field) => (
            <div key={field.key} className="bg-white p-2.5 px-3 rounded-xl border border-[#EDEBE9] shadow-sm hover:border-[#0078D4] transition-all group">
              <Label className="text-[9px] font-bold text-[#616161] mb-0.5 block tracking-tight uppercase opacity-70">
                {field.label}
              </Label>
              <div className="flex items-baseline justify-between gap-2">
                <input 
                  type={field.type || 'text'}
                  value={(vitals as any)[field.key]}
                  onChange={(e) => setVitals({ ...vitals, [field.key]: e.target.value })}
                  className="w-full text-base font-semibold text-[#242424] border-none focus:ring-0 p-0 placeholder:text-[#EDEBE9] bg-transparent"
                  placeholder={field.placeholder || ''}
                />
                <span className="text-[8px] font-bold text-[#A19F9D] uppercase tracking-tighter shrink-0">
                  {field.unit}
                </span>
              </div>
            </div>
          ))}

          <div className="bg-white p-2.5 px-3 rounded-xl border border-[#EDEBE9] shadow-sm hover:border-[#0078D4] transition-all group">
             <Label className="text-[9px] font-bold text-[#616161] mb-0.5 block tracking-tight uppercase opacity-70">
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

        <DialogFooter className="p-3 px-4 bg-white border-t border-[#F3F2F1] flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-10 rounded-xl bg-[#F3F2F1] text-[#616161] font-bold hover:bg-[#EDEBE9]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 h-10 rounded-xl bg-[#0078D4] text-white font-bold hover:bg-[#005A9E] shadow-md shadow-[#0078D4]/20"
          >
            {isSaving ? 'Saving...' : 'Save Vitals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
