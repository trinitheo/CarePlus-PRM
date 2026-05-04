import React from 'react';
import type { OrderStatus } from '../types';

interface StatusStepperProps {
    status: OrderStatus;
}

const STEPS: OrderStatus[] = ['Ordered', 'In Progress', 'Completed'];

const StatusStepper: React.FC<StatusStepperProps> = ({ status }) => {
    const currentStepIndex = STEPS.indexOf(status);

    if (status === 'Cancelled') {
        return (
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm font-semibold text-red-700">Cancelled</span>
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-2">
            {STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                    <React.Fragment key={step}>
                        <div className="flex items-center gap-1">
                            <div className={`w-4 h-4 rounded-full ${isCurrent ? 'bg-sky-500 animate-pulse' : isCompleted ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            <span className={`text-sm font-semibold ${isCurrent ? 'text-sky-700' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
                                {step}
                            </span>
                        </div>
                        {index < STEPS.length - 1 && <div className="w-6 h-0.5 bg-slate-200"></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default StatusStepper;
