import React, { useState } from 'react';
import type { Api } from '../../../../api_contract/patient';
import Modal from '../../../MedicalRecordsMFE/components/modals/Modal';
import FormTextArea from '../../../PatientMFE/components/form/FormTextArea';
import { parseResultsString } from '../../utils';

interface SubmitResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Api.V1.Order, results: string, parsedResults?: Api.V1.LabResultValue[]) => void;
    order: Api.V1.Order;
}

const SubmitResultsModal: React.FC<SubmitResultsModalProps> = ({ isOpen, onClose, onSave, order }) => {
    const [results, setResults] = useState('');
    const formId = 'submit-results-form';

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        let parsedResults;
        if (order.orderType === 'Lab') {
            parsedResults = parseResultsString(results);
        }
        onSave(order, results, parsedResults);
    };

    const footer = (
        <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="btn-neu">Cancel</button>
            <button type="submit" form={formId} className="btn-neu text-sky-600">Submit Results</button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Submit Results" footer={footer}>
            <form id={formId} onSubmit={handleSave}>
                <FormTextArea
                    label="Enter Results"
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    rows={10}
                    placeholder={
                        order.orderType === 'Lab'
                        ? 'For lab results, use format:\nTest|Value|Unit|ReferenceRange|Flag(H/L)\ne.g., Glucose|115|mg/dL|70-100|H'
                        : 'Enter the report or findings here.'
                    }
                />
            </form>
        </Modal>
    );
};

export default SubmitResultsModal;
