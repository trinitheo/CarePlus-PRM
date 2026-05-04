
import React, { useState, useEffect } from 'react';
import type { Api } from '../../api_contract/patient';
export { NewOrderModal } from './components/NewOrderModal';
import { TestOrderingView as TestOrderingViewComponent } from './TestOrderingView';
import { testOrderService, EnrichedOrder } from './services/testOrderService';
import OrderStats from './components/OrderStats';
import GlobalOrderList from './components/GlobalOrderList';
import SubmitResultsModal from './components/modals/SubmitResultsModal';
import { usePatients } from '../PatientMFE/context/PatientContext';
import PatientSelectModal from './components/PatientSelectModal';
import { NewOrderModal } from './components/NewOrderModal';
import { PlusIcon, TestOrderingIcon } from '../../components/icons';

// Placeholder for the view embedded in the patient chart
export const TestOrderingView: React.FC<{ patient: Api.V1.Patient; onRecordUpdate: () => void }> = ({ patient, onRecordUpdate }) => {
    return <TestOrderingViewComponent patient={patient} onRecordUpdate={onRecordUpdate} />;
};

// The standalone MFE view (Dashboard)
const TestOrderingMFE: React.FC = () => {
    const [orders, setOrders] = useState<EnrichedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [orderToProcess, setOrderToProcess] = useState<EnrichedOrder | null>(null);
    
    // Create New Order Workflow
    const [isPatientSelectOpen, setIsPatientSelectOpen] = useState(false);
    const [selectedPatientForOrder, setSelectedPatientForOrder] = useState<Api.V1.Patient | null>(null);
    const { addOrder, updateOrder } = usePatients();

    const fetchOrders = async () => {
        setIsLoading(true);
        const data = await testOrderService.getAllOrders();
        setOrders(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleProcessOrder = (order: EnrichedOrder) => {
        setOrderToProcess(order);
    };

    const handleSubmitResults = async (order: Api.V1.Order, results: string, parsedResults?: Api.V1.LabResultValue[]) => {
        // Logic duplicated from patient view - ideally centralized in context/service
        let updatedOrder: Api.V1.Order;
        
        switch (order.orderType) {
            case 'Lab':
                updatedOrder = { ...order, status: 'Completed', results, parsedResults } as Api.V1.LabOrder;
                break;
            case 'Imaging':
                updatedOrder = { ...order, status: 'Completed', report: results } as Api.V1.ImagingOrder;
                break;
            case 'SpecialTest':
                updatedOrder = { ...order, status: 'Completed', results } as Api.V1.SpecialTestOrder;
                break;
            default:
                updatedOrder = order;
        }
        
        // Find patientId from order (EnrichedOrder or Order both have it)
        const patientId = order.patientId;
        await updateOrder(patientId, updatedOrder);
        
        setOrderToProcess(null);
        fetchOrders(); // Refresh dashboard
    };

    const handlePatientSelect = (patient: Api.V1.Patient) => {
        setSelectedPatientForOrder(patient);
        setIsPatientSelectOpen(false);
        // NewOrderModal will automatically open because selectedPatientForOrder is truthy
    };

    const handleCreateOrder = async (orderData: any) => {
        if(selectedPatientForOrder) {
            await addOrder(selectedPatientForOrder.id, orderData);
            setSelectedPatientForOrder(null);
            fetchOrders();
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col p-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <TestOrderingIcon className="w-8 h-8 text-sky-600" />
                        Diagnostic Command Center
                    </h1>
                    <p className="text-slate-500 mt-1">Manage all lab, imaging, and procedure orders across the practice.</p>
                </div>
                <button 
                    onClick={() => setIsPatientSelectOpen(true)}
                    className="btn-neu bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2 shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" /> New Order
                </button>
            </header>

            <div className="flex-1 flex flex-col min-h-0 gap-6">
                <OrderStats orders={orders} />
                <GlobalOrderList orders={orders} onProcessOrder={handleProcessOrder} />
            </div>

            {/* Modals */}
            {orderToProcess && (
                <SubmitResultsModal
                    isOpen={!!orderToProcess}
                    onClose={() => setOrderToProcess(null)}
                    onSave={handleSubmitResults}
                    order={orderToProcess}
                />
            )}

            <PatientSelectModal 
                isOpen={isPatientSelectOpen}
                onClose={() => setIsPatientSelectOpen(false)}
                onSelect={handlePatientSelect}
            />

            {selectedPatientForOrder && (
                <NewOrderModal
                    isOpen={!!selectedPatientForOrder}
                    onClose={() => setSelectedPatientForOrder(null)}
                    onSave={handleCreateOrder}
                    patient={selectedPatientForOrder}
                />
            )}
        </div>
    );
};

export default TestOrderingMFE;
