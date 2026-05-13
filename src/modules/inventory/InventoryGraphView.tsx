import React, { useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { InventoryItem } from '../../services/inventoryService';

interface InventoryGraphViewProps {
  items: InventoryItem[];
}

export function InventoryGraphView({ items }: InventoryGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const nodes = items.map(item => ({
      id: item.id,
      name: item.name,
      val: Math.max(item.stockLevel / (item.minThreshold || 1), 1),
      color: item.stockLevel <= item.minThreshold ? '#ef4444' : '#0078D4',
      category: item.category
    }));

    const links: { source: string; target: string }[] = [];
    items.forEach(item => {
      if (item.dependencies) {
        item.dependencies.forEach(depId => {
          if (items.find(i => i.id === depId)) {
            links.push({ source: item.id, target: depId });
          }
        });
      }
    });

    return { nodes, links };
  }, [items]);

  return (
    <div ref={containerRef} className="bg-[#f8f9fa] rounded-3xl border border-[#EDEBE9] shadow-inner overflow-hidden h-[600px] relative">
      <div className="absolute top-6 left-6 z-10 space-y-2 pointer-events-none">
         <div className="bg-white/90 backdrop-blur p-3 rounded-xl border shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#616161] mb-1">Graph Legend</p>
            <div className="flex items-center gap-2 mb-1">
               <div className="w-3 h-3 rounded-full bg-[#0078D4]" />
               <span className="text-[10px] font-bold text-[#242424]">Healthy Stock</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
               <span className="text-[10px] font-bold text-[#242424]">Critical Stock</span>
            </div>
         </div>
         <p className="text-[10px] font-medium text-[#A19F9D]">Scroll to zoom • Drag to move • Click to focus</p>
      </div>

      <ForceGraph2D
        graphData={data}
        nodeLabel="name"
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkColor={() => '#EDEBE9'}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Inter`;
          const textWidth = ctx.measureText(label).width;
          
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val * 2, 0, 2 * Math.PI, false);
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#616161';
          ctx.fillText(label, node.x, node.y + (node.val * 2) + 6);
        }}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#FAFAFA"
      />
    </div>
  );
}
