import { useMemo } from 'react';
import { useQueryModel } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Network, User, Activity, Watch, Pill, Utensils, Database, FileText, 
  Microscope, Stethoscope, UserPlus, Heart, Droplets, Users, 
  DollarSign, Accessibility, MessagesSquare, HeartHandshake, ClipboardCheck, Shield 
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';

interface GraphNode {
  id: string;
  label: string;
  icon: any;
  type: 'core' | 'source' | 'interaction';
  x?: number;
  y?: number;
  color?: string;
}

export function KnowledgeGraph({ 
  patientId,
  onNodeClick 
}: { 
  patientId: string;
  onNodeClick?: (nodeId: string) => void;
}) {
  const { patients, healthRecords, clinicalIntakes, interactions, vitals: mockVitals } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);
  const localPatient = patients ? patients[patientId] : undefined;
  
  const patient = useMemo(() => {
    const firestorePatient = clinicalData.patient;
    const merged = { ...(localPatient || {}) };
    
    if (firestorePatient) {
      Object.keys(firestorePatient).forEach(key => {
        const val = firestorePatient[key];
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            if (val.length > 0) merged[key] = val;
          } else if (val !== '' && val !== 0) {
            merged[key] = val;
          }
        }
      });
    }
    
    if (!merged.id) merged.id = patientId;
    return merged;
  }, [localPatient, clinicalData.patient, patientId]);

  const records = healthRecords[patientId] || [];
  const mockInteractions = interactions[patientId] || [];

  // Merge Firestore interactions with mock interactions
  const firestoreInteractions = (clinicalData.interactions as any[])
    .map(i => ({
      ...i,
      timestamp: i.createdAt?.seconds ? i.createdAt.seconds * 1000 : (i.timestamp || Date.now())
    }));
  
  const patentInteractionsCombined = [...firestoreInteractions, ...mockInteractions];

  const localVitals = mockVitals[patientId] || [];

  // Merge vitals: prioritize firestore if available, merge with local for immediate feedback
  const mergedVitals = useMemo(() => {
    const firestoreVitalsMapped = (clinicalData.vitals as any[]).map(v => ({
      ...v,
      timestamp: v.createdAt?.seconds ? v.createdAt.seconds * 1000 : (v.timestamp || Date.now())
    }));

    const vitalsMap = new Map();
    localVitals.forEach(v => vitalsMap.set(v.timestamp, v));
    firestoreVitalsMapped.forEach(v => vitalsMap.set(v.timestamp, v));

    return Array.from(vitalsMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [clinicalData.vitals, localVitals]);
  const latestVitals = mergedVitals[mergedVitals.length - 1];
  const intake = clinicalIntakes[patientId];

  // Simple "Graph" layout constants
  const center = { x: 200, y: 150 };
  const radius = 100;

  const nodes: GraphNode[] = [
    { id: 'patient', label: 'O', icon: () => <span className="text-white font-black text-xs">O</span>, x: center.x, y: center.y, type: 'core' },
    
    // Unified Encounter Node (Intake + SOAP)
    ...(intake || clinicalData.clinical_records.length > 0 ? [{ 
      id: 'encounters', 
      label: 'Clinical Record', 
      icon: ClipboardCheck, 
      type: 'source',
      color: '#0078D4'
    } as GraphNode] : []),

    ...(clinicalData.prescriptions.length > 0 || true ? [{ id: 'rx', label: 'Prescriptions', icon: Pill, type: 'source', color: '#107C10' } as GraphNode] : []),
    ...(clinicalData.investigations.length > 0 || true ? [{ id: 'lab', label: 'LABS', icon: Microscope, type: 'source', color: '#0078D4' } as GraphNode] : []),
    
    // Health Device Integration Node
    ...(records.length > 0 ? [{ 
      id: 'devices', 
      label: 'DEVICES', 
      icon: Watch, 
      type: 'source',
      color: '#00B7C3' 
    } as GraphNode] : []),
    
    // Consolidated Ongoing Conditions Node
    ...(patient?.conditions && patient.conditions.length > 0 || true ? [{
      id: 'ongoing-conditions',
      label: 'CONDITIONS',
      icon: Activity,
      type: 'source',
      color: '#A4262C' // Crimson red
    } as GraphNode] : []),
    
    // Multi-disciplinary Interaction Nodes
    ...Array.from(new Set([...patentInteractionsCombined.map(i => i.type), 'social_care'])).map(type => {
      let icon = Users;
      let label = (type as string).toUpperCase();
      let color = '#0078D4';

      if (type === 'social_care') { icon = HeartHandshake; label = 'SOCIAL CARE'; color = '#E3008C'; }
      if (type === 'billing') { icon = DollarSign; label = 'Billing'; color = '#107C10'; }
      if (type === 'pt') { icon = Accessibility; label = 'PT / Rehab'; color = '#5C2D91'; }
      if (type === 'support_group') { icon = MessagesSquare; label = 'Support'; color = '#008272'; }
      if (type === 'nursing') { icon = Stethoscope; label = 'Nursing'; color = '#D13438'; }

      return { id: `interaction-${type}`, label, icon, type: 'interaction', color } as GraphNode;
    })
  ];

  return (
    <div className="flex-1 p-0 relative bg-white overflow-hidden flex flex-col">
      {/* SVG Visualization */}
      <svg viewBox="0 0 400 300" className="w-full h-full mt-[-14px]">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#0078D4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0078D4" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Connections */}
        {nodes.filter(n => n.id !== 'patient').map((node, i) => {
          const totalNodes = nodes.length - 1;
          const angle = (i / totalNodes) * Math.PI * 2;
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + Math.sin(angle) * radius;
          
          return (
            <motion.line 
              key={`line-${node.id}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: i * 0.05 }}
              x1={center.x} y1={center.y} 
              x2={x} y2={y} 
              stroke={node.type === 'interaction' ? (node as any).color : "#EDEBE9"} 
              strokeWidth={node.type === 'interaction' ? "1" : "1"} 
              strokeOpacity={node.type === 'interaction' ? 0.3 : 0.8}
              strokeDasharray={node.type === 'interaction' ? "0" : "4 4"}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          let x = node.x;
          let y = node.y;

          if (node.id !== 'patient') {
            const angle = (nodes.indexOf(node) / (nodes.length - 1)) * Math.PI * 2;
            x = center.x + Math.cos(angle) * (node.type === 'interaction' ? radius + 15 : radius);
            y = center.y + Math.sin(angle) * (node.type === 'interaction' ? radius + 15 : radius);
          }

          const isCore = node.type === 'core';
          const isInteraction = node.type === 'interaction';

          return (
            <motion.g 
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: i * 0.03 
              }}
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer"
              onClick={() => onNodeClick?.(node.id)}
            >
              <circle 
                cx={x} cy={y} 
                r={isCore ? 32 : isInteraction ? 28 : 24} 
                className={`${isCore ? 'fill-[#0078D4]' : 'fill-white'} stroke-[#EDEBE9]`}
                strokeWidth="1.5"
                style={isInteraction ? { stroke: node.color, strokeOpacity: 0.6 } : node.type === 'source' ? { stroke: node.color, strokeOpacity: 0.4 } : {}}
              />
              {isCore && (
                <circle cx={x} cy={y} r={40} fill="url(#nodeGradient)" />
              )}
              <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                <div className="flex items-center justify-center w-full h-full">
                  {typeof node.icon === 'function' ? (
                    <node.icon />
                  ) : (
                    <node.icon className={`w-5 h-5 ${isCore ? 'text-white' : ''}`} style={!isCore ? { color: node.color || '#0078D4' } : {}} />
                  )}
                </div>
              </foreignObject>
              <text 
                x={x} y={y + (isCore ? 48 : 42)} 
                textAnchor="middle" 
                className={`text-[9px] font-black uppercase tracking-widest ${isCore ? 'fill-[#242424]' : 'fill-[#242424]'}`}
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Legend/Side Panel - Styled for Rework */}
      <div className="bg-white/90 backdrop-blur-md border-t border-[#EDEBE9] p-3 flex items-center justify-between mt-auto shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#F3F9FD] flex items-center justify-center">
            <Network className="h-4 w-4 text-[#0078D4]" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Connectome Connectivity</div>
            <div className="text-xs font-bold text-[#242424]">
              {records.length + mergedVitals.length + clinicalData.clinical_records.length + patentInteractionsCombined.length} total active edges
            </div>
          </div>
        </div>
        <div className="flex -space-x-2">
          {[Pill, Activity, HeartHandshake, DollarSign].map((Icon, i) => (
            <div key={i} className="h-6 w-6 rounded-full bg-white border border-[#EDEBE9] flex items-center justify-center shadow-sm">
              <Icon className="h-3 w-3 text-[#616161]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
