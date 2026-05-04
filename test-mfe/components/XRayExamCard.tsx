import React from 'react';
import type { XRayExam } from '../types';

interface XRayExamCardProps {
    exam: XRayExam;
    onClick: () => void;
}

const XRayExamCard: React.FC<XRayExamCardProps> = ({ exam, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-4 text-center card-panel hover:border-sky-500 transition-all duration-300 transform hover:-translate-y-1"
        >
            <exam.icon className="w-8 h-8 text-sky-600 mb-2" />
            <span className="text-sm font-semibold text-slate-700">{exam.name}</span>
        </button>
    );
};

export default XRayExamCard;
