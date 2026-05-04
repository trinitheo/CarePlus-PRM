
import React, { useState } from 'react';
import type { Patient, Order, OrderStatus } from './types';
import OrderList from './components/OrderList';
import SubmitResultsModal from './components/modals/SubmitResultsModal';
import { usePatients } from '../PatientMFE/context/PatientContext';

interface TestOrderingViewProps {
    patient: Patient;
    onRecordUpdate: () => void;
}

const FILTERS: OrderStatus[] = ['Ordered', 'In Progress', 'Completed', 'Cancelled'];

// This component is used INSIDE the Patient Chart
export const TestOrderingView: React.FC<TestOrderingViewProps> = ({ patient, onRecordUpdate }) => {
    const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
    const [orderToSubmitResults, setOrderToSubmitResults] = useState<Order | null>(null);
    const { updateOrder } = usePatients();

    const handleSubmitResults = (order: Order, results: string, parsedResults?: any[]) => {
        let updatedOrder: Order;
        
        switch (order.orderType) {
            case 'Lab':
                updatedOrder = {
                    ...order,
                    status: 'Completed',
                    results,
                    parsedResults,
                };
                break;
            case 'Imaging':
                updatedOrder = {
                    ...order,
                    status: 'Completed',
                    report: results,
                };
                break;
            case 'SpecialTest':
                updatedOrder = {
                    ...order,
                    status: 'Completed',
                    results,
                };
                break;
            default:
                updatedOrder = order;
        }
        
        updateOrder(patient.id, updatedOrder);
        setOrderToSubmitResults(null);
        onRecordUpdate(); 
    };
    
    return (
        <>
            <div className="card-panel p-6 sm:p-8">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Test Orders</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setActiveFilter('All')} className={`px-3 py-1.5 text-sm rounded-lg ${activeFilter === 'All' ? 'neu-sunken-sm font-semibold' : 'btn-neu'}`}>All</button>
                        {FILTERS.map(filter => (
                            <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-3 py-1.5 text-sm rounded-lg ${activeFilter === filter ? 'neu-sunken-sm font-semibold' : 'btn-neu'}`}>
                                {filter}
                            </button>
                        ))}
                    </div>
                </header>
                <OrderList
                    orders={patient.orders || []}
                    filter={activeFilter}
                    onSubmitResults={setOrderToSubmitResults}
                />
            </div>
            {orderToSubmitResults && (
                <SubmitResultsModal
                    isOpen={!!orderToSubmitResults}
                    onClose={() => setOrderToSubmitResults(null)}
                    onSave={handleSubmitResults}
                    order={orderToSubmitResults}
                />
            )}
        </>
    );
};
