
import React, { useState } from 'react';
import type { ImagingModality, ImagingOrder, Order, Patient } from '../../types';
import FormTextArea from '../../../PatientMFE/components/form/FormTextArea';
import FormSelect from '../../../PatientMFE/components/form/FormSelect';
import FormInput from '../../../PatientMFE/components/form/FormInput';
import { 
    XRayIcon, CTScanIcon, MRIcon, UltrasoundIcon, MammogramIcon, PETScanIcon, FluoroscopyIcon, NuclearMedicineIcon, ArrowLeftIcon
} from '../../../../components/icons';

interface ImagingOrderFormProps {
    onSave: (orderData: Omit<Order, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'>) => void;
    patient: Patient;
    onClose: () => void;
}

const STEPS = [
    { id: 'modality', name: 'Modality' },
    { id: 'specification', name: 'Specification' },
    { id: 'details', name: 'Details & Review' },
];

const MODALITIES = [
    { name: 'X-Ray', icon: <XRayIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'CT', icon: <CTScanIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'MRI', icon: <MRIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'Ultrasound', icon: <UltrasoundIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'Mammogram', icon: <MammogramIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'PET', icon: <PETScanIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'Fluoroscopy', icon: <FluoroscopyIcon className="w-8 h-8 text-sky-600" /> },
    { name: 'Nuclear Medicine', icon: <NuclearMedicineIcon className="w-8 h-8 text-sky-600" /> },
] as const;

const GENERAL_XRAY_OPTIONS = [
    'CHEST 2 VIEW (PA & LAT)', 'ABDOMEN 1 VIEW (KUB)', 'ABD COMPLETE (Include LLD Erect)',
    'ABDOMEN ACUTE SERIES', 'SHUNT SERIES', 'BONE AGE STUDIES', 'BONE SURVEY COMPLETE',
    'BONE HEMMSKELETON (24mos. and under)', 'NECK SOFT TISSUE', 'SPINE COMPLETE',
];

const FLUORO_OPTIONS = [
    'UGI', 'UGI and SMALL BOWEL', 'SMALL BOWEL SERIES', 'RETROGRADE VCUG',
    'CONTRACT ENEMA', 'ESOPHOGRAM', 'DYSPHAGIA', 'OTHER (Specify)',
];

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8 border-b border-slate-200 pb-6 last:border-b-0 last:mb-0">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-sky-500 inline-block">{title}</h3>
        {children}
    </div>
);

const StepIndicator: React.FC<{ currentStep: string }> = ({ currentStep }) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    return (
        <div className="flex justify-between items-center relative mb-8">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200" style={{transform: 'translateY(-50%)'}}></div>
            <div className="absolute top-1/2 left-0 h-0.5 bg-sky-600 transition-all duration-300" style={{
                transform: 'translateY(-50%)',
                width: `${(currentIndex / (STEPS.length - 1)) * 100}%`
            }}></div>
            {STEPS.map((step, index) => {
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;
                return (
                    <div key={step.id} className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-white border-2 border-slate-300 text-slate-500'
                        }`}>
                            {isCompleted ? '✓' : index + 1}
                        </div>
                        <span className={`mt-2 text-xs font-semibold ${isActive ? 'text-sky-600' : 'text-slate-500'}`}>{step.name}</span>
                    </div>
                );
            })}
        </div>
    );
};

const ImagingOrderForm: React.FC<ImagingOrderFormProps> = ({ onSave, patient, onClose }) => {
    const [step, setStep] = useState<'modality' | 'specification' | 'details'>('modality');
    const [modality, setModality] = useState<ImagingModality | null>(null);
    const [bodyPart, setBodyPart] = useState('');
    const [reasonForRequest, setReasonForRequest] = useState('');
    const [urgency, setUrgency] = useState<ImagingOrder['urgency']>('Routine');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // State for specification step
    const [selectedGeneralExams, setSelectedGeneralExams] = useState<string[]>([]);
    const [selectedFluoroExams, setSelectedFluoroExams] = useState<string[]>([]);
    const [specificBodyPart, setSpecificBodyPart] = useState('');
    
    const handleNext = () => {
        if (step === 'modality') {
            setStep('specification');
        } else if (step === 'specification') {
            if (modality === 'X-Ray') {
                const parts: string[] = [];
                if (selectedGeneralExams.length > 0) parts.push(selectedGeneralExams.join(', '));
                if (selectedFluoroExams.length > 0) parts.push(`Fluoroscopy: ${selectedFluoroExams.join(', ')}`);
                setBodyPart(parts.join('; '));
            } else {
                setBodyPart(specificBodyPart);
            }
            setStep('details');
        }
    };

    const handleBack = () => {
        if (step === 'details') setStep('specification');
        else if (step === 'specification') setStep('modality');
    };

    const handleSave = () => {
        if (!modality || !bodyPart || !reasonForRequest) return;
        
        const finalReason = additionalNotes 
            ? `${reasonForRequest}\n\nAdditional Notes: ${additionalNotes}` 
            : reasonForRequest;

        const orderData: Omit<ImagingOrder, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'> = {
            orderType: 'Imaging',
            modality,
            bodyPart,
            reasonForRequest: finalReason,
            urgency,
        };
        onSave(orderData);
    };
    
    const handleCheckboxToggle = (list: string[], item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };
    
    const renderContent = () => {
        switch (step) {
            case 'modality':
                return (
                    <div className="animate-fade-in-fast">
                        <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Select Imaging Modality</h2>
                        <p className="text-center text-slate-500 mb-6">Choose the appropriate imaging technique for this order.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {MODALITIES.map(mod => (
                                <button key={mod.name} onClick={() => { setModality(mod.name); handleNext(); }}
                                    className={`p-4 text-center card-panel transition-all duration-200 ${modality === mod.name ? 'border-sky-500 ring-2 ring-sky-500' : 'hover:border-sky-400'}`}>
                                    {mod.icon}
                                    <p className="font-semibold text-slate-700 mt-2 text-sm">{mod.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'specification':
                 if (modality !== 'X-Ray') {
                     return (
                         <div className="animate-fade-in-fast">
                             <h2 className="text-xl font-bold text-slate-800 mb-4">Specify {modality} Exam</h2>
                             <p className="text-slate-600 mb-2">Specify the body part and details for the {modality} scan.</p>
                             <FormInput label="Body Part / Exam Name" value={specificBodyPart} onChange={(e) => setSpecificBodyPart(e.target.value)} placeholder={`e.g., Abdomen/Pelvis w/ Contrast`} required />
                         </div>
                     )
                 }
                return (
                     <div className="animate-fade-in-fast">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">X-Ray Study Specification</h2>
                        <p className="text-slate-500 mb-6">Please select the type of X-ray and any fluoroscopy needs.</p>
                        
                        <FormSection title="General X-Ray">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {GENERAL_XRAY_OPTIONS.map(exam => (
                                    <label key={exam} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedGeneralExams.includes(exam) ? 'bg-sky-50 border-sky-400' : 'border-slate-200 hover:border-sky-300'}`}>
                                        <input type="checkbox" checked={selectedGeneralExams.includes(exam)} onChange={() => handleCheckboxToggle(selectedGeneralExams, exam, setSelectedGeneralExams)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm font-medium text-slate-700">{exam}</span>
                                    </label>
                                ))}
                            </div>
                        </FormSection>

                        <FormSection title="Fluoroscopy - Must be scheduled">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {FLUORO_OPTIONS.map(exam => (
                                    <label key={exam} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedFluoroExams.includes(exam) ? 'bg-sky-50 border-sky-400' : 'border-slate-200 hover:border-sky-300'}`}>
                                        <input type="checkbox" checked={selectedFluoroExams.includes(exam)} onChange={() => handleCheckboxToggle(selectedFluoroExams, exam, setSelectedFluoroExams)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm font-medium text-slate-700">{exam}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-4">
                                <FormTextArea label="Additional Fluoroscopy Notes" value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Add any special instructions or notes here" rows={3} />
                            </div>
                        </FormSection>
                    </div>
                );
            case 'details':
                return (
                    <div className="space-y-4 animate-fade-in-fast">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-lg font-bold text-slate-800 mb-2">Order Summary</h4>
                            <p><strong>Modality:</strong> {modality}</p>
                            <p><strong>Exam/Body Part:</strong> {bodyPart}</p>
                        </div>
                        <FormTextArea label="Reason for Request / Clinical Indication" value={reasonForRequest} onChange={e => setReasonForRequest(e.target.value)} rows={3} required />
                        <FormSelect label="Urgency" value={urgency} onChange={e => setUrgency(e.target.value as ImagingOrder['urgency'])}>
                            <option value="Routine">Routine</option>
                            <option value="Urgent">Urgent</option>
                            <option value="STAT">STAT</option>
                        </FormSelect>
                    </div>
                );
        }
    };

    const isNextDisabled = () => {
        if (step === 'modality') return !modality;
        if (step === 'specification') {
            if (modality !== 'X-Ray') {
                return specificBodyPart.trim() === '';
            }
            return selectedGeneralExams.length === 0 && selectedFluoroExams.length === 0;
        }
        return false;
    };


    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            <div className="text-center mb-4 p-2">
                <p className="font-bold text-lg text-slate-800">{patient.name}</p>
                <p className="text-sm text-slate-500">ID: {patient.id} | Age: {patient.age}</p>
            </div>
            
            <StepIndicator currentStep={step} />

            <div className="flex-1 overflow-y-auto p-1 mb-4">
                {renderContent()}
            </div>
            
            <div className="flex-shrink-0 pt-4 border-t border-slate-200 flex justify-between items-center">
                <button onClick={onClose} className="btn-neu">Cancel</button>
                <div className="flex items-center gap-2">
                    {step !== 'modality' && <button onClick={handleBack} className="btn-neu">Back</button>}
                    {step !== 'details' ? (
                        <button onClick={handleNext} disabled={isNextDisabled()} className="btn-neu text-sky-600">
                            Next
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={!modality || !bodyPart || !reasonForRequest} className="btn-neu text-sky-600">Submit Order</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImagingOrderForm;
