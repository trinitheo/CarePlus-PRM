
import React from 'react';
import type { EnrichedOrder } from '../services/testOrderService';
import { AlertCircleIcon, ClockIcon, CheckCircle, LabTestIcon } from '../../../components/icons';

interface OrderStatsProps {
    orders: EnrichedOrder[];
}

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: number, colorClass: string, subtext: string }> = ({ icon, title, value, colorClass, subtext }) => (
    <div className="card-panel p-4 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            <p className={`text-xs mt-1 font-medium ${colorClass.replace('bg-', 'text-').replace('-100', '-600')}`}>{subtext}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClass}`}>
            {icon}
        </div>
    </div>
);

const OrderStats: React.FC<OrderStatsProps> = ({ orders }) => {
    const stats = React.useMemo(() => {
        const pending = orders.filter(o => o.status === 'Ordered' || o.status === 'In Progress');
        // Fix: Check if urgency exists on the order object (SpecialTestOrder does not have urgency)
        const stat = pending.filter(o => 'urgency' in o && o.urgency === 'STAT');
        const completedToday = orders.filter(o => {
            if (o.status !== 'Completed') return false;
            const updated = (o as any).updatedAt ? new Date((o as any).updatedAt) : new Date(o.orderDate); // Fallback logic
            const today = new Date();
            return updated.getDate() === today.getDate() && updated.getMonth() === today.getMonth();
        });
        const labsPending = pending.filter(o => o.orderType === 'Lab');

        return {
            pendingCount: pending.length,
            statCount: stat.length,
            completedCount: completedToday.length,
            labsCount: labsPending.length
        };
    }, [orders]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
                icon={<AlertCircleIcon className="w-6 h-6 text-red-600" />}
                title="STAT Orders"
                value={stats.statCount}
                colorClass="bg-red-100"
                subtext="Require immediate attention"
            />
            <StatCard 
                icon={<ClockIcon className="w-6 h-6 text-amber-600" />}
                title="Pending"
                value={stats.pendingCount}
                colorClass="bg-amber-100"
                subtext="Awaiting results"
            />
            <StatCard 
                icon={<LabTestIcon className="w-6 h-6 text-blue-600" />}
                title="Lab Queue"
                value={stats.labsCount}
                colorClass="bg-blue-100"
                subtext="Specimens to process"
            />
            <StatCard 
                icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                title="Completed Today"
                value={stats.completedCount}
                colorClass="bg-green-100"
                subtext="Results available"
            />
        </div>
    );
};

export default OrderStats;
