
import React from 'react';
import type { Order } from '../types';
import { LabTestIcon, ImagingStudyIcon, SpecialTestIcon } from '../../../components/icons';
import StatusStepper from './StatusStepper';

interface OrderItemCardProps {
    order: Order;
    onSubmitResults: (order: Order) => void;
}

const getOrderIcon = (type: Order['orderType']) => {
    switch (type) {
        case 'Lab': return <LabTestIcon className="w-6 h-6 text-red-500" />;
        case 'Imaging': return <ImagingStudyIcon className="w-6 h-6 text-blue-500" />;
        case 'SpecialTest': return <SpecialTestIcon className="w-6 h-6 text-green-500" />;
    }
};

const getOrderTitle = (order: Order): string => {
    switch (order.orderType) {
        case 'Lab': return order.tests.map(t => t.testName).join(', ');
        case 'Imaging': return `${order.modality} - ${order.bodyPart}`;
        case 'SpecialTest': return order.testName;
    }
};

const OrderItemCard: React.FC<OrderItemCardProps> = ({ order, onSubmitResults }) => {
    return (
        <div className="card-panel p-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className="bg-slate-100 p-3 rounded-lg flex-shrink-0">
                        {getOrderIcon(order.orderType)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{getOrderTitle(order)}</p>
                        <p className="text-sm text-slate-500">Reason: {order.reasonForRequest}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Ordered by {order.orderingPhysician} on {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex sm:flex-col items-end gap-2 flex-shrink-0">
                    <StatusStepper status={order.status} />
                    {order.status !== 'Completed' && (
                        <button 
                            onClick={() => onSubmitResults(order)}
                            className="btn-neu text-sky-600 text-sm py-1.5 px-3"
                        >
                            Submit Results
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderItemCard;
