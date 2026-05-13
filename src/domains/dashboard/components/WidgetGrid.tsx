
import React from 'react';
import { motion } from 'motion/react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget } from './DashboardUI';
import { WidgetSize, DashboardView } from '../types';

export function WidgetGrid({ children, isEditing, order, onToggleVisibility, onToggleSize, visibility, sizes, viewClass }: { 
  children: Record<string, React.ReactNode>;
  isEditing: boolean;
  order: string[];
  onToggleVisibility: (id: string) => void;
  onToggleSize: (id: string) => void;
  visibility: Record<string, boolean>;
  sizes: Record<string, WidgetSize>;
  viewClass: DashboardView;
}) {
  const displayOrder = isEditing ? order : order.filter(id => visibility[id]);

  const getSizeClasses = (id: string) => {
    const size = sizes[id] || '1x1';
    const isCompact = viewClass === 'compact';
    
    switch (size) {
      case '1x1': return 'col-span-1 row-span-1';
      case '1x2': return 'col-span-1 row-span-2';
      case '2x1': return 'col-span-2 row-span-1';
      case '2x2': return 'col-span-2 row-span-2';
      case '2x3': return 'col-span-2 row-span-3';
      case '4x2': return isCompact ? 'col-span-2 row-span-2' : 'col-span-4 row-span-2';
      default: return 'col-span-1 row-span-1';
    }
  };

  return (
    <SortableContext
      items={displayOrder}
      strategy={verticalListSortingStrategy}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 flex-1 min-h-0"
        style={{ gridAutoRows: '150px' }}>
        {displayOrder.map((id, i) => {
          const currentSize = sizes[id] || '1x1';
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.33, 1, 0.68, 1] }}
              className={`flex flex-col min-h-0 ${getSizeClasses(id)}`}
            >
              <SortableWidget 
                id={id} 
                isEditing={isEditing} 
                onToggleVisibility={() => onToggleVisibility(id)}
                onToggleSize={() => onToggleSize(id)}
                visible={visibility[id]}
                size={currentSize}
              >
                {children[id]}
              </SortableWidget>
            </motion.div>
          );
        })}
      </div>
    </SortableContext>
  );
}
