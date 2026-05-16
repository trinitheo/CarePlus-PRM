import React from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
  Panel,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MedicalNode, ClinicalHistoryMap } from '../../types';
import { motion } from 'motion/react';
import { 
  User, 
  FileText, 
  History, 
  Search, 
  Activity, 
  Lightbulb, 
  Navigation,
  AlertCircle,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';

const NODE_TYPES = {
  clinical: ({ data, selected }: NodeProps) => {
    const Icon = data.icon as any || FileText;
    const statusColors = {
      normal: 'border-[#107C10] shadow-[#107C10]/10',
      abnormal: 'border-[#D13438] shadow-[#D13438]/10',
      critical: 'border-[#A4262C] bg-[#FFF4F4] shadow-[#A4262C]/20',
      pending: 'border-[#616161] border-dashed shadow-none'
    };

    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-white border-2 p-3 rounded-xl min-w-[180px] shadow-lg transition-all ${statusColors[data.status as keyof typeof statusColors] || 'border-[#EDEBE9]'} ${selected ? 'ring-2 ring-[#0078D4] ring-offset-2' : ''}`}
      >
        <Handle type="target" position={Position.Top} className="w-2 h-2 bg-[#0078D4]" />
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-1.5 rounded-lg ${selected ? 'bg-[#0078D4] text-white' : 'bg-[#F3F2F1] text-[#616161]'}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#616161]">{data.category as string}</p>
            <h4 className="text-[13px] font-bold text-[#242424] leading-tight">{data.label as string}</h4>
          </div>
        </div>
        <div className="text-[11px] text-[#424242] line-clamp-3 leading-relaxed mb-2 bg-[#FAFAFA] p-2 rounded-md border border-[#EDEBE9] min-h-[44px]">
          {(data.details as string) || <span className="italic text-[#A19F9D]">No details captured...</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {data.status === 'normal' && <CheckCircle2 className="h-3 w-3 text-[#107C10]" />}
            {data.status === 'abnormal' && <AlertCircle className="h-3 w-3 text-[#D13438]" />}
            <span className={`text-[9px] font-bold uppercase ${data.status === 'normal' ? 'text-[#107C10]' : data.status === 'abnormal' ? 'text-[#D13438]' : 'text-[#616161]'}`}>
              {data.status as string}
            </span>
          </div>
          <button className="text-[#616161] hover:text-[#242424]">
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-[#0078D4]" />
      </motion.div>
    );
  },
  central: ({ data }: NodeProps) => (
    <motion.div 
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="bg-[#0078D4] text-white p-5 rounded-full w-40 h-40 flex flex-col items-center justify-center text-center shadow-2xl border-4 border-white"
    >
      <User className="h-8 w-8 mb-2" />
      <h3 className="text-sm font-black uppercase tracking-tighter leading-none">{data.label as string}</h3>
      <p className="text-[10px] opacity-80 mt-1 font-bold">{data.dob as string}</p>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </motion.div>
  )
};

interface RadialMindMapProps {
  data: ClinicalHistoryMap;
  onNodeClick: (node: MedicalNode) => void;
  patientName?: string;
  patientDOB?: string;
}

export function RadialMindMap({ data, onNodeClick, patientName = "Unknown Patient", patientDOB = "N/A" }: RadialMindMapProps) {
  const initialNodes: Node[] = [
    {
      id: 'center',
      type: 'central',
      position: { x: 400, y: 300 },
      data: { label: patientName, dob: patientDOB }
    },
    ...data.nodes.map(n => ({
      id: n.id,
      type: 'clinical',
      position: n.position,
      data: { ...n.data, icon: getIconForType(n.type), category: n.type.toUpperCase() }
    }))
  ];

  const initialEdges: Edge[] = data.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: '#0078D4', strokeWidth: 2 },
    labelStyle: { fill: '#616161', fontWeight: 700, fontSize: 10 }
  }));

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  return (
    <div className="w-full h-full bg-[#FAF9F8] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds))}
        onEdgesChange={(changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds))}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        onNodeClick={(_, node) => {
          if (node.id !== 'center') {
            const medicalNode = data.nodes.find(n => n.id === node.id);
            if (medicalNode) onNodeClick(medicalNode);
          }
        }}
      >
        <Background gap={20} color="#EDEBE9" />
        <Controls />
        <Panel position="top-right">
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-[#EDEBE9] shadow-lg flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#616161] uppercase">Canvas Map Legend</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#107C10]" />
                <span className="text-[11px] font-medium text-[#242424]">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D13438]" />
                <span className="text-[11px] font-medium text-[#242424]">Abnormal</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case 'narrative': return FileText;
    case 'background': return History;
    case 'screening': return Search;
    case 'objective': return Activity;
    case 'synthesis': return Lightbulb;
    case 'disposition': return Navigation;
    default: return FileText;
  }
}
