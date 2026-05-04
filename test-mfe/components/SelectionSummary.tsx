import React from 'react';

interface SelectionSummaryProps {
    title: string;
    children: React.ReactNode;
}

const SelectionSummary: React.FC<SelectionSummaryProps> = ({ title, children }) => {
    return (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-lg font-bold text-slate-800 mb-2">{title}</h4>
            <div className="text-sm space-y-1 text-slate-600">
                {children}
            </div>
        </div>
    );
};

export default SelectionSummary;
