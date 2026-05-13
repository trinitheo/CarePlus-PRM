
import React from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WidgetSize } from '../types';

export function SectionHeader({ icon: Icon, label, count, color, action }: {
  icon: React.ElementType; label: string; count?: number; color: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#444441] flex-1">{label}</span>
      {action ? (
        <div className="shrink-0">{action}</div>
      ) : count !== undefined && count > 0 && (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#0078D4] text-white text-[9px] font-black flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 px-4">
      <p className="text-[11px] text-[#A19F9D] font-medium text-center">{message}</p>
    </div>
  );
}

export function ListItem({ leading, headline, supporting, trailing, onClick, urgent }: {
  leading?: React.ReactNode; headline: string; supporting?: React.ReactNode;
  trailing?: React.ReactNode; onClick?: () => void; urgent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F5F4F3] transition-colors group ${urgent ? 'bg-red-50/50' : ''}`}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <p className={`text-[12.5px] font-semibold truncate ${urgent ? 'text-red-800' : 'text-[#242424]'}`}>{headline}</p>
        {supporting && <p className="text-[11px] text-[#757370] mt-0.5 truncate">{supporting}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </button>
  );
}

export function DashCard({ children, className = '', isEditing, onToggleVisibility, onToggleSize, visible = true, size = '1x1' }: { 
  children: React.ReactNode; 
  className?: string;
  isEditing?: boolean;
  onToggleVisibility?: () => void;
  onToggleSize?: () => void;
  visible?: boolean;
  size?: WidgetSize;
}) {
  return (
    <div className={`
      relative bg-white rounded-3xl border transition-all h-full
      ${visible ? 'border-[#EDEBE9]' : 'border-[#EDEBE9] opacity-40'} 
      overflow-hidden flex flex-col shadow-sm ${className}
      ${isEditing ? 'ring-2 ring-offset-2 ring-[#0078D4]/20' : ''}
    `}>
      {isEditing && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onToggleSize?.(); }}
            className="h-8 w-auto px-2 rounded-full bg-white/80 backdrop-blur hover:bg-white text-[10px] font-black text-[#0078D4]"
          >
            {size}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }}
            className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur hover:bg-white"
          >
            {visible ? <Eye className="h-4 w-4 text-[#0078D4]" /> : <EyeOff className="h-4 w-4 text-[#A19F9D]" />}
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}

export function SortableWidget({ id, children, isEditing, onToggleVisibility, onToggleSize, visible, size }: { 
  id: string; 
  children: React.ReactNode;
  isEditing: boolean;
  onToggleVisibility: () => void;
  onToggleSize: () => void;
  visible: boolean;
  size: WidgetSize;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`h-full ${isDragging ? 'rotate-1 scale-[1.02]' : ''}`}>
      {isEditing ? (
        <div className="h-full relative group">
          <DashCard 
            isEditing={isEditing} 
            onToggleVisibility={onToggleVisibility} 
            onToggleSize={onToggleSize}
            visible={visible}
            size={size}
          >
            <div 
              {...attributes} 
              {...listeners} 
              className="absolute left-1/2 -top-1 -translate-x-1/2 h-6 w-12 bg-[#F5F4F3] rounded-b-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#EDEBE9] transition-colors z-20"
            >
              <GripVertical className="h-3 w-3 text-[#A19F9D]" />
            </div>
            <div className="h-full pointer-events-none select-none">
              {children}
            </div>
          </DashCard>
        </div>
      ) : (
        <div className="h-full">
          {children}
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, color = '#0078D4', size = 'sm' }: { name: string; color?: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-black text-white shrink-0`} style={{ background: color }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
