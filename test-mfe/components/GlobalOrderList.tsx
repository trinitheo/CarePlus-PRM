
import React, { useState } from 'react';
import type { EnrichedOrder } from '../services/testOrderService';
import type { OrderStatus, OrderType } from '../types';
import { 
    SearchIcon, LabTestIcon, ImagingStudyIcon, SpecialTestIcon 
} from '../../../components/icons';
import StatusStepper from './StatusStepper';

interface GlobalOrderListProps {
    orders: EnrichedOrder[];
    onProcessOrder: (order: EnrichedOrder) => void;
}

const GlobalOrderList: React.FC<GlobalOrderListProps> = ({ orders, onProcessOrder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<OrderType | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('Ordered'); // Default to Ordered to show worklist

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.orderType === 'Lab' && order.tests.some(t => t.testName.toLowerCase().includes(searchTerm.toLowerCase()))) ||
            (order.orderType === 'Imaging' && (order.modality + order.bodyPart).toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = typeFilter === 'All' || order.orderType === typeFilter;
        
        // Custom status logic: If filter is 'Ordered', show 'Ordered' AND 'In Progress'
        const matchesStatus = statusFilter === 'All' 
            ? true 
            : statusFilter === 'Ordered' 
                ? (order.status === 'Ordered' || order.status === 'In Progress')
                : order.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    const getIcon = (type: OrderType) => {
        switch (type) {
            case 'Lab': return <LabTestIcon className="w-5 h-5 text-red-500" />;
            case 'Imaging': return <ImagingStudyIcon className="w-5 h-5 text-blue-500" />;
            case 'SpecialTest': return <SpecialTestIcon className="w-5 h-5 text-green-500" />;
        }
    };

    const getDescription = (order: EnrichedOrder) => {
        switch (order.orderType) {
            case 'Lab': return order.tests.map(t => t.testName).join(', ');
            case 'Imaging': return `${order.modality} - ${order.bodyPart}`;
            case 'SpecialTest': return order.testName;
        }
    };

    return (
        <div className="card-panel flex flex-col h-full overflow-hidden">
            {/* Filters Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[250px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients or tests..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input-neu w-full pl-9 py-2 text-sm"
                        />
                    </div>
                    <select 
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value as any)}
                        className="input-neu py-2 text-sm"
                    >
                        <option value="All">All Types</option>
                        <option value="Lab">Labs</option>
                        <option value="Imaging">Imaging</option>
                        <option value="SpecialTest">Special</option>
                    </select>
                </div>

                <div className="flex p-1 bg-slate-200 rounded-lg">
                    {(['All', 'Ordered', 'Completed', 'Cancelled'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                statusFilter === status 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {status === 'Ordered' ? 'Active' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Order Details</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ordered By</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 w-16">
                                    <div className="p-2 bg-slate-100 rounded-lg w-fit">
                                        {getIcon(order.orderType)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={order.patientAvatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{order.patientName}</p>
                                            <p className="text-xs text-slate-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                        {'urgency' in order && order.urgency === 'STAT' && (
                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">STAT</span>
                                        )}
                                        {'urgency' in order && order.urgency === 'Urgent' && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Urgent</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 truncate">{getDescription(order)}</p>
                                    <p className="text-xs text-slate-500 truncate">{order.reasonForRequest}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {order.orderingPhysician}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusStepper status={order.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {order.status !== 'Completed' && order.status !== 'Cancelled' ? (
                                        <button 
                                            onClick={() => onProcessOrder(order)}
                                            className="btn-neu text-sky-600 text-xs py-1.5 px-3"
                                        >
                                            Enter Results
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">View Only</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <p>No orders found matching filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalOrderList;
