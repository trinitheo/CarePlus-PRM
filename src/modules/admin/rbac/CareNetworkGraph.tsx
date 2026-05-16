
import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Users, UserPlus, Activity, ArrowLeft } from 'lucide-react';
import { mockDb } from '../../../lib/mockDatabase';
import { authService } from '../../../services/authService';

export function CareNetworkGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate fetch
      await new Promise(r => setTimeout(r, 800));

      const nodes: any[] = [];
      const links: any[] = [];

      // Professionals
      const demoUsers = await authService.getDemoUsers();
      demoUsers.forEach(u => {
        nodes.push({ 
          id: u.id, 
          name: u.displayName, 
          group: 'Professional', 
          role: u.role,
          avatar: u.avatar,
          val: 18
        });
      });

      // Patients
      const patients = Object.values(mockDb.patients);
      patients.forEach((p: any) => {
        nodes.push({ 
          id: p.id, 
          name: p.name, 
          group: 'Patient', 
          age: p.age,
          gender: p.gender,
          val: 12
        });

        // Create links
        // In our mock, everyone knows everyone for demo purposes
        // Or we can be specific
        demoUsers.forEach(u => {
          if (u.role === 'admin' || u.role === 'clinician' || u.role === 'nurse') {
            links.push({
              source: p.id,
              target: u.id,
              label: u.role === 'clinician' ? 'Primary Provider' : 'Care Team'
            });
          }
        });
      });

      setGraphData({ nodes, links });
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-500" />
            Care Network Explorer
          </h2>
          <p className="text-sm text-slate-500 font-medium">Visualizing organizational care relationships</p>
        </div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-200 animate-pulse"></div>
            <span>Patients</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
            <span>Professionals</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative bg-slate-50/50" ref={containerRef}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-sky-500 border-t-transparent"></div>
                <p className="text-sm font-bold text-sky-600 uppercase tracking-widest animate-pulse">Mapping Network...</p>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="name"
              nodeColor={node => node.group === 'Patient' ? '#0ea5e9' : '#10b981'}
              nodeRelSize={6}
              linkColor={() => '#cbd5e1'}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              onNodeClick={setSelectedNode}
              linkWidth={link => 1}
              backgroundColor="#00000000"
            />
          )}
        </div>

        {selectedNode && (
          <div className="w-80 bg-white border-l border-slate-100 overflow-y-auto p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setSelectedNode(null)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-6 bg-slate-100 px-3 py-1.5 rounded-full transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Reset View
            </button>
            
            <div className="mb-6">
              <div className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${
                selectedNode.group === 'Patient' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {selectedNode.group}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{selectedNode.name}</h3>
              {selectedNode.role && <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-wide">{selectedNode.role}</p>}
              {selectedNode.age && <p className="text-slate-500 mt-1">Age: {selectedNode.age} • {selectedNode.gender}</p>}
              {selectedNode.avatar && (
                <img 
                  src={selectedNode.avatar} 
                  alt={selectedNode.name} 
                  className="w-20 h-20 rounded-2xl object-cover mt-4 shadow-lg shadow-slate-200 border-2 border-white ring-1 ring-slate-100"
                />
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Network Connections
              </h4>
              <div className="space-y-2">
                {graphData.links
                  .filter(l => (typeof l.source === 'object' ? (l.source as any).id : l.source) === selectedNode.id || 
                              (typeof l.target === 'object' ? (l.target as any).id : l.target) === selectedNode.id)
                  .map((l: any, idx) => {
                    const otherNode = (typeof l.source === 'object' ? (l.source as any).id : l.source) === selectedNode.id 
                      ? (typeof l.target === 'object' ? l.target : graphData.nodes.find(n => n.id === l.target))
                      : (typeof l.source === 'object' ? l.source : graphData.nodes.find(n => n.id === l.source));
                    
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{(otherNode as any)?.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium tracking-tight">{(otherNode as any)?.role || 'Patient'}</p>
                        </div>
                        <span className="text-[9px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-400 uppercase">
                          {l.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
