import React, { useMemo } from 'react';
import type { Order, OrderStatus } from '../types';
import OrderItemCard from './OrderItemCard';

interface OrderListProps {
    orders: Order[];
    filter: OrderStatus | 'All';
    onSubmitResults: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, filter, onSubmitResults }) => {
    const sortedOrders = useMemo(() => {
        return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [orders]);
    
    const filteredOrders = useMemo(() => {
        if (filter === 'All') return sortedOrders;
        return sortedOrders.filter(order => order.status === filter);
    }, [sortedOrders, filter]);

    if (filteredOrders.length === 0) {
        return (
            <div className="text-center py-16 text-slate-500">
                <p className="font-semibold text-lg">No Orders Found</p>
                <p className="mt-1">{filter === 'All' ? 'This patient has no orders on record.' : `No orders with status "${filter}".`}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {filteredOrders.map(order => (
                <OrderItemCard key={order.id} order={order} onSubmitResults={onSubmitResults} />
            ))}
        </div>
    );
};

export default OrderList;
