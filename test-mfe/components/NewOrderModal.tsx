import React, { useState } from 'react';
import Modal from '../../MedicalRecordsMFE/components/modals/Modal';
import type { Patient, OrderType, Order } from '../types';
import { LabTestIcon, ImagingStudyIcon, SpecialTestIcon } from '../../../components/icons';
import LabOrderForm from './forms/LabOrderForm';
import ImagingOrderForm from './forms/ImagingOrderForm';
import SpecialTestOrderForm from './forms/SpecialTestOrderForm';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (orderData: Omit<Order, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'>) => Promise<void>;
    patient: Patient;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSave, patient }) => {
    const [orderType, setOrderType] = useState<OrderType | null>(null);

    const handleSelectType = (type: OrderType) => {
        setOrderType(type);
    };

    const handleSave = async (orderData: Omit<Order, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'>) => {
        await onSave(orderData);
        // The parent component now handles closing and navigation.
        // handleClose();
    };

    const handleClose = () => {
        setOrderType(null);
        onClose();
    };
    
    const getTitle = () => {
        if (!orderType) {
            return `New Order for ${patient.name}`;
        }
        switch (orderType) {
            case 'Lab': return `New Lab Order for ${patient.name}`;
            case 'Imaging': return `New Imaging Order for ${patient.name}`;
            case 'SpecialTest': return `New Special Study for ${patient.name}`;
        }
    };

    const OrderTypeButton: React.FC<{ type: OrderType; label: string; icon: React.ReactNode; description: string }> = ({ type, label, icon, description }) => (
        <button
            onClick={() => handleSelectType(type)}
            className="w-full flex items-start text-left gap-4 p-4 card-panel hover:border-sky-500 transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="bg-slate-100 p-4 rounded-lg flex-shrink-0">{icon}</div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">{label}</h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
        </button>
    );

    const renderContent = () => {
        if (!orderType) {
            return (
                <div className="space-y-4">
                    <OrderTypeButton 
                        type="Lab" 
                        label="Lab" 
                        icon={<LabTestIcon className="w-8 h-8 text-red-500" />} 
                        description="Order blood work, urine tests, cultures, and other specimen-based diagnostics."
                    />
                    <OrderTypeButton 
                        type="Imaging" 
                        label="Imaging" 
                        icon={<ImagingStudyIcon className="w-8 h-8 text-blue-500" />} 
                        description="Order X-rays, CT scans, MRIs, and other radiological procedures."
                    />
                    <OrderTypeButton 
                        type="SpecialTest" 
                        label="Special Study" 
                        icon={<SpecialTestIcon className="w-8 h-8 text-green-500" />} 
                        description="Order other types of tests like ECGs, sleep studies, or stress tests."
                    />
                </div>
            );
        }

        switch (orderType) {
            case 'Lab': return <LabOrderForm onSave={handleSave} patient={patient} />;
            case 'Imaging': return <ImagingOrderForm onSave={handleSave} patient={patient} onClose={handleClose} />;
            case 'SpecialTest': return <SpecialTestOrderForm onSave={handleSave} />;
            default: return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()} size={!orderType ? 'md' : '6xl'}>
            {renderContent()}
        </Modal>
    );
};
