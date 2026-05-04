import React from 'react';
import { Beaker, Activity, Zap } from 'lucide-react';
import { OrderCategory } from './InvestigationOrderForm';

interface OrderCategorySelectionProps {
  onSelectCategory: (category: OrderCategory) => void;
}

export function OrderCategorySelection({ onSelectCategory }: OrderCategorySelectionProps) {

  const handleSelect = (e: React.MouseEvent, type: OrderCategory) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Delay state update to allow click event bubbling to finish.
    // This prevents Base UI/Radix outside-click handlers from seeing an unmounted element and closing the dialog.
    setTimeout(() => {
      onSelectCategory(type);
    }, 10);
  };

  const OrderTypeButton = ({ type, label, icon, description, color }: any) => (
    <button
      type="button"
      onClick={(e) => handleSelect(e, type)}
      className="w-full flex items-start text-left gap-4 p-5 rounded-xl border border-[#EDEBE9] bg-white hover:border-[#0078D4] hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
    >
      <div className={`p-4 rounded-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-[16px] font-bold text-[#242424] mb-1">{label}</h3>
        <p className="text-[13px] text-[#616161] leading-relaxed">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OrderTypeButton 
        type="laboratory" 
        label="Laboratory / Pathology" 
        icon={<Beaker className="w-8 h-8 text-[#D13438]" />} 
        color="bg-[#FDF3F4]"
        description="Order blood work, urine tests, cultures, and other specimen-based diagnostics."
      />
      <OrderTypeButton 
        type="imaging" 
        label="Imaging" 
        icon={<Activity className="w-8 h-8 text-[#0078D4]" />} 
        color="bg-[#F3F9FD]"
        description="Order X-rays, CT scans, MRIs, and other radiological procedures."
      />
      <OrderTypeButton 
        type="functional" 
        label="Special Study" 
        icon={<Zap className="w-8 h-8 text-[#107C10]" />} 
        color="bg-[#F4F9F4]"
        description="Order other types of tests like ECGs, sleep studies, or stress tests."
      />
    </div>
  );
}
