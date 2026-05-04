import React, { useState, useMemo, useCallback } from 'react';
import type { Patient, LabOrder, Order } from '../../types';
import FormTextArea from '../../../PatientMFE/components/form/FormTextArea';
import FormSelect from '../../../PatientMFE/components/form/FormSelect';
import FormCheckbox from '../../../PatientMFE/components/form/FormCheckbox';
import SelectionSummary from '../SelectionSummary';
import { ChevronDown } from '../../../../components/icons';
import { SPECIMEN_TEST_MAP, SpecimenType } from '../../data';

interface LabOrderFormProps {
    onSave: (orderData: Omit<Order, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'>) => Promise<void>;
    patient: Patient;
}

const SPECIMEN_TYPES: { id: SpecimenType, label: string, icon: string }[] = [
    { id: 'blood', label: 'Blood', icon: '🩸' },
    { id: 'urine', label: 'Urine', icon: '💧' },
    { id: 'stool', label: 'Stool', icon: '💩' },
    { id: 'sputum', label: 'Sputum', icon: '🫁' },
    { id: 'swab', label: 'Swab', icon: '🧬' },
    { id: 'tissue', label: 'Tissue', icon: '🔬' },
    { id: 'csf', label: 'CSF', icon: '🧠' },
];

interface CollapsibleTestPanelProps {
    panelName: string;
    description: string;
    testsToDisplay: string[];
    isChecked: boolean;
    isIndeterminate: boolean;
    onPanelToggle: () => void;
    onTestToggle: (testName: string) => void;
    selectedTests: Set<string>;
}

const CollapsibleTestPanel: React.FC<CollapsibleTestPanelProps> = ({
    panelName,
    description,
    testsToDisplay,
    isChecked,
    isIndeterminate,
    onPanelToggle,
    onTestToggle,
    selectedTests,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="card-panel p-0">
            <div className="flex items-center p-3 border-b border-slate-200">
                <FormCheckbox
                    label=""
                    checked={isChecked}
                    isIndeterminate={isIndeterminate}
                    onChange={onPanelToggle}
                    id={`panel-${panelName}`}
                />
                <label htmlFor={`panel-${panelName}`} className="flex-1 cursor-pointer ml-2">
                    <p className="font-semibold text-slate-800">{panelName}</p>
                    {description && <p className="text-xs text-slate-500">{description}</p>}
                </label>
                {testsToDisplay.length > 0 && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-full hover:bg-slate-100"
                        aria-expanded={isOpen}
                        aria-controls={`panel-content-${panelName}`}
                    >
                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
            {isOpen && testsToDisplay.length > 0 && (
                <div id={`panel-content-${panelName}`} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 animate-fade-in-fast">
                    {testsToDisplay.map(test => (
                        <FormCheckbox
                            key={test}
                            label={test}
                            checked={selectedTests.has(test)}
                            onChange={() => onTestToggle(test)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const LabOrderForm: React.FC<LabOrderFormProps> = ({ onSave, patient }) => {
    const [selectedSpecimen, setSelectedSpecimen] = useState<SpecimenType>('blood');
    const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
    const [otherTestsText, setOtherTestsText] = useState('');
    const [reasonForRequest, setReasonForRequest] = useState('');
    const [urgency, setUrgency] = useState<LabOrder['urgency']>('Routine');
    const [fastingRequired, setFastingRequired] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const allPanelsMap = useMemo(() => {
        const map: Record<string, { tests?: string[], includes?: string[] }> = {};
        const currentTestData = SPECIMEN_TEST_MAP[selectedSpecimen];
        currentTestData.forEach(category => {
            Object.entries(category.panels).forEach(([panelName, panelData]) => {
                map[panelName] = panelData as { tests?: string[]; includes?: string[] };
            });
        });
        return map;
    }, [selectedSpecimen]);

    const getAllPanelTests = useCallback((panelName: string): string[] => {
        const panel = allPanelsMap[panelName];
        if (!panel) return [];

        let allTests = [...(panel.tests || [])];
        if (panel.includes) {
            panel.includes.forEach(includedPanelName => {
                allTests.push(...getAllPanelTests(includedPanelName));
            });
        }
        return [...new Set(allTests)];
    }, [allPanelsMap]);

    const otherTests = useMemo(() => otherTestsText.split('\n').map(t => t.trim()).filter(t => t), [otherTestsText]);
    const allSelectedTestsForSummary = useMemo(() => Array.from(new Set([...selectedTests, ...otherTests])).sort(), [selectedTests, otherTests]);

    const handleSpecimenChange = (specimenId: SpecimenType) => {
        setSelectedSpecimen(specimenId);
        setSelectedTests(new Set()); // Clear selection on change
        setOtherTestsText('');
    };

    const handlePanelToggle = (panelName: string) => {
        const panelTests = getAllPanelTests(panelName);
        const selectedPanelTestsCount = panelTests.filter(test => selectedTests.has(test)).length;

        setSelectedTests(prev => {
            const newSet = new Set(prev);
            if (selectedPanelTestsCount > 0) { 
                panelTests.forEach(test => newSet.delete(test));
            } else { 
                panelTests.forEach(test => newSet.add(test));
            }
            return newSet;
        });
    };
    
    const handleTestToggle = (testName: string) => {
        setSelectedTests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testName)) {
                newSet.delete(testName);
            } else {
                newSet.add(testName);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        const allSelectedTests = new Set([...selectedTests, ...otherTests]);

        if (allSelectedTests.size === 0 || !reasonForRequest) {
            alert('Please select or enter at least one test and provide a reason for the request.');
            return;
        }

        setIsSaving(true);
        try {
            const orderData: Omit<LabOrder, 'id' | 'patientId' | 'orderDate' | 'status' | 'orderingPhysician'> = {
                orderType: 'Lab',
                tests: Array.from(allSelectedTests).map(testName => ({ testId: testName.toLowerCase().replace(/\s/g, '-'), testName })),
                reasonForRequest,
                urgency,
                fastingRequired,
                specimenType: selectedSpecimen,
            };
            await onSave(orderData);
        } catch (error) {
            console.error("Failed to save lab order:", error);
            alert("There was an error saving the lab order. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left side: Test Selection */}
            <div className="w-full lg:w-2/3 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 mb-4 overflow-x-auto pb-2 scrollbar-autohide">
                    {SPECIMEN_TYPES.map(spec => (
                        <button
                            key={spec.id}
                            onClick={() => handleSpecimenChange(spec.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                                selectedSpecimen === spec.id
                                ? 'bg-sky-100 text-sky-700'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>{spec.icon}</span>
                            <span>{spec.label}</span>
                        </button>
                    ))}
                </div>

                 <div className="max-h-[55vh] lg:max-h-[50vh] overflow-y-auto pr-2 space-y-6 scrollbar-autohide">
                    {SPECIMEN_TEST_MAP[selectedSpecimen].map(category => (
                        <div key={category.category}>
                            <h3 className="text-lg font-semibold text-slate-800">{category.category}</h3>
                            {category.description && <p className="text-sm text-slate-600 -mt-1 mb-3">{category.description}</p>}
                            <div className="space-y-3">
                                {Object.entries(category.panels).map(([panelName, panelData]) => {
                                    const allTestsForPanel = getAllPanelTests(panelName);
                                    const selectedCount = allTestsForPanel.filter(test => selectedTests.has(test)).length;
                                    const isChecked = allTestsForPanel.length > 0 && selectedCount === allTestsForPanel.length;
                                    const isIndeterminate = selectedCount > 0 && selectedCount < allTestsForPanel.length;
                                    return (
                                        <CollapsibleTestPanel
                                            key={panelName}
                                            panelName={panelName}
                                            description={(panelData as any).description}
                                            testsToDisplay={(panelData as any).tests || []}
                                            selectedTests={selectedTests}
                                            isChecked={isChecked}
                                            isIndeterminate={isIndeterminate}
                                            onPanelToggle={() => handlePanelToggle(panelName)}
                                            onTestToggle={handleTestToggle}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <div key="other-tests-category">
                        <h3 className="text-lg font-semibold text-slate-800">Other</h3>
                        <p className="text-sm text-slate-600 -mt-1 mb-3">Specify any tests not listed above. Separate multiple tests with a new line.</p>
                        <div className="card-panel p-4">
                             <FormTextArea
                                label=""
                                value={otherTestsText}
                                onChange={e => setOtherTestsText(e.target.value)}
                                rows={3}
                                placeholder="e.g., Vitamin D Level&#10;Ferritin"
                                className="!p-0 !border-0 !shadow-none !ring-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Summary and Details */}
            <div className="w-full lg:w-1/3 space-y-4">
                <SelectionSummary title="Selected Tests">
                    {allSelectedTestsForSummary.length > 0 ? (
                        <ul className="list-disc list-inside max-h-48 overflow-y-auto scrollbar-autohide">
                            {allSelectedTestsForSummary.map(test => <li key={test}>{test}</li>)}
                        </ul>
                    ) : (
                        <p className="text-slate-400 italic">No tests selected.</p>
                    )}
                </SelectionSummary>
                
                <FormTextArea
                    label="Reason for Request / Diagnosis"
                    value={reasonForRequest}
                    onChange={e => setReasonForRequest(e.target.value)}
                    rows={3}
                    required
                    placeholder="e.g., Routine checkup, R51"
                />
                
                <FormSelect label="Urgency" value={urgency} onChange={e => setUrgency(e.target.value as LabOrder['urgency'])}>
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                </FormSelect>
                
                <FormCheckbox
                    label="Fasting Required"
                    checked={fastingRequired}
                    onChange={e => setFastingRequired(e.target.checked)}
                />
                
                <button 
                    onClick={handleSave} 
                    disabled={allSelectedTestsForSummary.length === 0 || !reasonForRequest || isSaving}
                    className="btn-neu text-sky-600 w-full"
                >
                    {isSaving ? 'Submitting...' : 'Submit Requisition'}
                </button>
            </div>
        </div>
    );
};

export default LabOrderForm;
