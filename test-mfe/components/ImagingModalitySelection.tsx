
import React from 'react';
import type { ImagingModality } from '../types';
import { XRayIcon, CTScanIcon, MRIcon, UltrasoundIcon, MammogramIcon, PETScanIcon, FluoroscopyIcon, NuclearMedicineIcon } from '../../../components/icons';

interface ImagingModalitySelectionProps {
    onSelect: (modality: ImagingModality) => void;
}

const MODALITIES = [
    {
        name: 'X-Ray',
        description: 'Uses ionizing radiation to produce images of bones and some tissues.',
        icon: <XRayIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'CT',
        description: 'Combines X-rays from different angles for detailed cross-sectional images.',
        icon: <CTScanIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'MRI',
        description: 'Uses strong magnetic fields and radio waves for detailed images of soft tissues.',
        icon: <MRIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'Ultrasound',
        description: 'Uses sound waves to create real-time images of organs and structures.',
        icon: <UltrasoundIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'Mammogram',
        description: 'A specific type of low-dose X-ray for breast imaging.',
        icon: <MammogramIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'PET',
        description: 'Uses a radioactive tracer to show metabolic or biochemical function.',
        icon: <PETScanIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'Fluoroscopy',
        description: 'An X-ray "movie" to see internal body structures in motion.',
        icon: <FluoroscopyIcon className="w-10 h-10 text-sky-600" />,
    },
    {
        name: 'Nuclear Medicine',
        description: 'Uses small amounts of radioactive material to diagnose or treat diseases.',
        icon: <NuclearMedicineIcon className="w-10 h-10 text-sky-600" />,
    },
] as const;


const ModalityCard: React.FC<{
    modality: typeof MODALITIES[number];
    onClick: () => void;
}> = ({ modality, onClick }) => (
    <button
        onClick={onClick}
        className="text-left p-6 card-panel hover:border-sky-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1.5"
    >
        <div className="flex items-center gap-5 mb-3">
            <div className="bg-slate-100 p-4 rounded-full">
                {modality.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{modality.name}</h3>
        </div>
        <p className="text-base text-slate-500 min-h-[4rem]">{modality.description}</p>
    </button>
);

const ImagingModalitySelection: React.FC<ImagingModalitySelectionProps> = ({ onSelect }) => {
    return (
        <div className="animate-fade-in-fast">
            <p className="text-center text-slate-600 mb-8 text-lg">Select the type of imaging technology to proceed.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MODALITIES.map(modality => (
                    <ModalityCard
                        key={modality.name}
                        modality={modality}
                        onClick={() => onSelect(modality.name)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImagingModalitySelection;
