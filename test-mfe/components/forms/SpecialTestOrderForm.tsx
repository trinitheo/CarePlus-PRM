import React, { useState } from 'react';
import type { SpecialTestOrder, Order } from '../../types';
import FormInput from '../../../PatientMFE/components/form/FormInput';
import FormTextArea from '../../../PatientMFE/components/form/FormTextArea';

interface SpecialTestOrderFormProps {
    onSave: (orderData: Omit<Order, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'>) => void;
}

const SpecialTestOrderForm: React.FC<SpecialTestOrderFormProps> = ({ onSave }) => {
    const [testName, setTestName] = useState('');
    const [reasonForRequest, setReasonForRequest] = useState('');
    const [details, setDetails] = useState('');

    const handleSave = () => {
        if (!testName || !reasonForRequest) return;

        const orderData: Omit<SpecialTestOrder, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'> = {
            orderType: 'SpecialTest',
            testName,
            reasonForRequest,
            details,
        };
        onSave(orderData);
    };

    return (
        <div className="space-y-4">
            <FormInput
                label="Test Name"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                placeholder="e.g., Echocardiogram, Sleep Study"
                required
            />
            <FormTextArea
                label="Reason for Request / Clinical Indication"
                value={reasonForRequest}
                onChange={e => setReasonForRequest(e.target.value)}
                rows={3}
                required
            />
             <FormTextArea
                label="Additional Details (Optional)"
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Include any specific instructions or parameters for the test."
                rows={4}
            />
            <div className="flex justify-end">
                <button onClick={handleSave} className="btn-neu text-sky-600">Submit Order</button>
            </div>
        </div>
    );
};

export default SpecialTestOrderForm;
