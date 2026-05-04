
import React, { useState } from 'react';
import Modal from '../../MedicalRecordsMFE/components/modals/Modal';
import { testOrderService } from '../services/testOrderService';
import { SearchIcon, ChevronRight } from '../../../components/icons';
import type { Patient } from '../types';

interface PatientSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (patient: Patient) => void;
}

const PatientSelectModal: React.FC<PatientSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.length > 1) {
            const matches = await testOrderService.searchPatients(val);
            setResults(matches);
            setHasSearched(true);
        } else {
            setResults([]);
            setHasSearched(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Patient for New Order" size="md">
            <div className="p-1 space-y-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search patient by name or ID..." 
                        autoFocus
                        value={searchTerm}
                        onChange={handleSearch}
                        className="input-neu w-full pl-10 py-3 text-lg"
                    />
                </div>

                <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                    {results.map(patient => (
                        <button
                            key={patient.id}
                            onClick={() => onSelect(patient)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <img src={patient.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                                <div>
                                    <p className="font-bold text-slate-800">{patient.name}</p>
                                    <p className="text-xs text-slate-500">DOB: {patient.dob} • ID: {patient.id}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    ))}
                    {hasSearched && results.length === 0 && (
                        <p className="text-center text-slate-500 py-8">No patients found.</p>
                    )}
                    {!hasSearched && (
                        <p className="text-center text-slate-400 py-8 text-sm">Start typing to find a patient.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default PatientSelectModal;
