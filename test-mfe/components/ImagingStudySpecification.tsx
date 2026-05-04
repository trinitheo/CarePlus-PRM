import React, { useState } from 'react';
import type { ImagingModality, XRayExam } from '../types';
import XRayExamCard from './XRayExamCard';
import { 
    ArrowLeftIcon,
    HeartIcon as LungsIcon,
    FileText as StomachIcon,
    MoreVerticalIcon as SpineIcon,
    User as NeckIcon,
    Settings as BoneIcon,
    Sparkles as OtherIcon
} from '../../../components/icons';

const XRAY_EXAMS: XRayExam[] = [
    { name: 'CHEST 2 VIEW (PA & LAT)', icon: LungsIcon },
    { name: 'ABDOMEN 1 VIEW (KUB)', icon: StomachIcon },
    { name: 'ABD COMPLETE (Include LLD Erect)', icon: StomachIcon },
    { name: 'ABDOMEN ACUTE SERIES', icon: StomachIcon },
    { name: 'NECK SOFT TISSUE', icon: NeckIcon },
    { name: 'SPINE COMPLETE', icon: SpineIcon },
    { name: 'BONE AGE STUDIES', icon: BoneIcon },
    { name: 'BONE SURVEY COMPLETE', icon: BoneIcon },
    { name: 'BONE HEMMSKELETON (24mos. and under)', icon: BoneIcon },
    { name: 'SHUNT SERIES', icon: OtherIcon },
];


interface ImagingStudySpecificationProps {
    modality: ImagingModality;
    onSubmit: (specification: any) => void;
    onBack: () => void;
}

const ImagingStudySpecification: React.FC<ImagingStudySpecificationProps> = ({ modality, onSubmit, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customExam, setCustomExam] = useState('');
    const [contrast, setContrast] = useState<'With' | 'Without' | 'With & Without' | 'none' | 'iv' | 'oral' | 'both'>('Without');
    const [bodyPart, setBodyPart] = useState('');
    const [protocol, setProtocol] = useState('');
    
    // CT/MRI specific
    const [slices, setSlices] = useState<number | ''>('');
    const [sequences, setSequences] = useState<string>('');

    const handleSubmitDetailed = () => {
        if (!bodyPart) return;
        let spec = bodyPart;
        if (protocol) spec += ` - ${protocol}`;
        if (modality !== 'Ultrasound' && modality !== 'Mammogram' && modality !== 'Nuclear Medicine' && modality !== 'X-Ray') {
             spec += ` (${contrast} Contrast)`;
        }
        onSubmit(spec);
    };

    const renderContent = () => {
        switch (modality) {
            case 'X-Ray':
                const filteredExams = XRAY_EXAMS.filter(exam => exam.name.toLowerCase().includes(searchTerm.toLowerCase()));
                return (
                    <>
                        <input
                            type="text"
                            placeholder="Search X-Ray exams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-neu w-full mb-4"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-autohide">
                            {filteredExams.map(exam => (
                                <XRayExamCard key={exam.name} exam={exam} onClick={() => onSubmit(exam.name)} />
                            ))}
                        </div>
                         <div className="mt-4 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Or enter custom exam..."
                                value={customExam}
                                onChange={(e) => setCustomExam(e.target.value)}
                                className="input-neu w-full"
                            />
                            <button onClick={() => onSubmit(customExam)} disabled={!customExam} className="btn-neu flex-shrink-0">Add</button>
                        </div>
                    </>
                );
            case 'CT':
                return (
                  <>
                    <p className="text-slate-600 mb-2">Specify CT scan details.</p>
                    <label className="block mb-2">
                      <span className="text-sm text-slate-700">Contrast</span>
                      <select value={contrast} onChange={(e) => setContrast(e.target.value as any)} className="input-neu mt-1 w-full">
                        <option value="none">No contrast</option>
                        <option value="iv">IV contrast</option>
                        <option value="oral">Oral contrast</option>
                        <option value="both">IV + Oral</option>
                      </select>
                    </label>
                    <label className="block mb-2">
                      <span className="text-sm text-slate-700">Slices (approx)</span>
                      <input type="number" value={slices} onChange={(e) => setSlices(e.target.value ? Number(e.target.value) : '')} className="input-neu mt-1 w-full" />
                    </label>
                    <label className="block mb-2">
                        <span className="text-sm text-slate-700">Body Part / Region</span>
                        <input
                            type="text"
                            placeholder={`e.g., Abdomen/Pelvis`}
                            value={bodyPart}
                            onChange={(e) => setBodyPart(e.target.value)}
                            className="input-neu mt-1 w-full"
                        />
                    </label>
                    <div className="text-right mt-4">
                      <button 
                        onClick={() => onSubmit({ modality: 'CT', bodyPart, contrast, slices })} 
                        className="btn-neu text-sky-600"
                        disabled={!bodyPart}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                );
            case 'MRI':
                return (
                  <>
                    <p className="text-slate-600 mb-2">Specify MRI sequences and contrast.</p>
                    <label className="block mb-2">
                      <span className="text-sm text-slate-700">Sequences (comma separated)</span>
                      <input type="text" placeholder="e.g., T1, T2, FLAIR" value={sequences} onChange={(e) => setSequences(e.target.value)} className="input-neu mt-1 w-full" />
                    </label>
                    <label className="block mb-2">
                      <span className="text-sm text-slate-700">Contrast</span>
                      <select value={contrast} onChange={(e) => setContrast(e.target.value as any)} className="input-neu mt-1 w-full">
                        <option value="none">No contrast</option>
                        <option value="iv">Gadolinium (IV)</option>
                      </select>
                    </label>
                    <label className="block mb-2">
                        <span className="text-sm text-slate-700">Body Part / Region</span>
                        <input
                            type="text"
                            placeholder={`e.g., Brain, Knee`}
                            value={bodyPart}
                            onChange={(e) => setBodyPart(e.target.value)}
                            className="input-neu mt-1 w-full"
                        />
                    </label>
                    <div className="text-right mt-4">
                      <button 
                        onClick={() => onSubmit({ modality: 'MRI', bodyPart, sequences: sequences.split(',').map(s => s.trim()).filter(Boolean), contrast })} 
                        className="btn-neu text-sky-600"
                        disabled={!bodyPart}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                );
            case 'Ultrasound':
            case 'Mammogram':
            case 'PET':
            case 'Fluoroscopy':
            case 'Nuclear Medicine':
                const showContrast = modality !== 'Ultrasound' && modality !== 'Mammogram' && modality !== 'Nuclear Medicine';
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Body Part</label>
                            <input
                                type="text"
                                placeholder={`e.g., Abdomen, Brain, C-Spine`}
                                value={bodyPart}
                                onChange={(e) => setBodyPart(e.target.value)}
                                className="input-neu w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Protocol / Specifics (Optional)</label>
                            <input
                                type="text"
                                placeholder={`e.g., Angiogram, Stone Protocol`}
                                value={protocol}
                                onChange={(e) => setProtocol(e.target.value)}
                                className="input-neu w-full"
                            />
                        </div>
                        {showContrast && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contrast</label>
                                <div className="flex gap-2">
                                    {(['Without', 'With', 'With & Without'] as const).map(option => (
                                        <button
                                            key={option}
                                            onClick={() => setContrast(option)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                contrast === option
                                                    ? 'bg-sky-600 text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-4 flex justify-end">
                             <button 
                                onClick={handleSubmitDetailed} 
                                disabled={!bodyPart}
                                className="btn-neu text-sky-600"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );
            default:
                return <div>Select a modality</div>;
        }
    };

    return (
        <div className="animate-fade-in-fast h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{modality} Specification</h2>
                    <p className="text-sm text-slate-500">Select specific exam details</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1">
                {renderContent()}
            </div>
        </div>
    );
};

export default ImagingStudySpecification;