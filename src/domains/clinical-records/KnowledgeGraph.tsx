import { useQueryModel } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Network, User, Activity, Watch, Pill, Utensils, Database, FileText, Microscope, Stethoscope, UserPlus, Heart, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';

interface GraphNode {
  id: string;
  label: string;
  icon: any;
  type: 'core' | 'source';
  x?: number;
  y?: number;
}

export function KnowledgeGraph({ patientId }: { patientId: string }) {
  const { patients, healthRecords, clinicalIntakes, vitals: mockVitals } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);
  const patient = patients[patientId];
  const records = healthRecords[patientId] || [];

  // Merge vitals logic same as ClinicalRecords
  const firestoreVitals = (clinicalData.vitals as any[])
    .map(v => ({
      ...v,
      timestamp: v.createdAt?.seconds ? v.createdAt.seconds * 1000 : Date.now()
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const mergedVitals = firestoreVitals.length > 0 ? firestoreVitals : (mockVitals[patientId] || []);
  const latestVitals = mergedVitals[mergedVitals.length - 1];
  const intake = clinicalIntakes[patientId];

  // Simple "Graph" layout constants
  const center = { x: 200, y: 150 };
  const radius = 90;

  const nodes: GraphNode[] = [
    { id: 'patient', label: patient?.name || 'Unknown', icon: User, x: center.x, y: center.y, type: 'core' },
    ...(latestVitals ? [
      { id: 'vitals', label: 'Vitals', icon: Activity, type: 'source' },
      ...(latestVitals.hr > 100 ? [{ id: 'hr', label: `HR: ${latestVitals.hr}`, icon: Heart, type: 'source' }] : []),
      ...(latestVitals.bp?.startsWith('16') || latestVitals.bp?.startsWith('17') || latestVitals.bp?.startsWith('18') ? [{ id: 'bp', label: `BP: ${latestVitals.bp}`, icon: Activity, type: 'source' }] : []),
      ...(latestVitals.spo2 < 95 ? [{ id: 'spo2', label: `SpO2: ${latestVitals.spo2}%`, icon: Droplets, type: 'source' }] : []),
    ] : []) as GraphNode[],
    ...(intake ? [{ id: 'intake', label: 'Intake', icon: Database, type: 'source' } as GraphNode] : []),
    ...Array.from(new Set(records.map(r => r.source))).map((source) => ({
      id: source,
      label: (source as string).replace('_', ' ').toUpperCase(),
      icon: source === 'watch' ? Watch : source === 'medication_log' ? Pill : Utensils,
      type: 'source'
    }) as GraphNode),
    ...(clinicalData.clinical_records.length > 0 ? [{ id: 'soap', label: 'SOAP', icon: FileText, type: 'source' } as GraphNode] : []),
    ...(clinicalData.prescriptions.length > 0 ? [{ id: 'rx', label: 'Rx', icon: Pill, type: 'source' } as GraphNode] : []),
    ...(clinicalData.investigations.length > 0 ? [{ id: 'lab', label: 'Labs', icon: Microscope, type: 'source' } as GraphNode] : []),
    ...(clinicalData.procedures.length > 0 ? [{ id: 'proc', label: 'Proc', icon: Stethoscope, type: 'source' } as GraphNode] : []),
    ...(clinicalData.referrals.length > 0 ? [{ id: 'ref', label: 'Ref', icon: UserPlus, type: 'source' } as GraphNode] : []),
  ];

  return (
    <div className="flex-1 p-0 relative bg-white">
      {/* SVG Visualization */}
      <svg viewBox="0 0 400 300" className="w-full h-full">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#0078D4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0078D4" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Connections */}
        {nodes.filter(n => n.id !== 'patient').map((node, i) => {
          const angle = (i / (nodes.length - 1)) * Math.PI * 2;
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + Math.sin(angle) * radius;
          
          return (
            <motion.line 
              key={`line-${node.id}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: i * 0.1 }}
              x1={center.x} y1={center.y} 
              x2={x} y2={y} 
              stroke="#EDEBE9" 
              strokeWidth="1.5" 
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          let x = node.x;
          let y = node.y;

          if (node.id !== 'patient') {
            const angle = (nodes.indexOf(node) / (nodes.length - 1)) * Math.PI * 2;
            x = center.x + Math.cos(angle) * radius;
            y = center.y + Math.sin(angle) * radius;
          }

          const isCore = node.type === 'core';

          return (
            <motion.g 
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: i * 0.05 
              }}
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer"
            >
              <circle 
                cx={x} cy={y} 
                r={isCore ? 28 : 20} 
                className={`${isCore ? 'fill-[#0078D4] shadow-lg' : 'fill-white'} stroke-[#EDEBE9]`}
                strokeWidth="1"
              />
              {isCore && (
                <circle cx={x} cy={y} r={35} fill="url(#nodeGradient)" />
              )}
              <foreignObject x={x - 10} y={y - 10} width="20" height="20">
                <div className="flex items-center justify-center w-full h-full">
                  <node.icon className={`w-4 h-4 ${isCore ? 'text-white' : 'text-[#0078D4]'}`} />
                </div>
              </foreignObject>
              <text 
                x={x} y={y + (isCore ? 42 : 32)} 
                textAnchor="middle" 
                className={`text-[9px] font-bold uppercase tracking-widest ${isCore ? 'fill-[#242424]' : 'fill-[#616161]'}`}
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Legend/Side Panel - Styled for Rework */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-[#EDEBE9] rounded-xl p-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#F3F9FD] flex items-center justify-center">
            <Database className="h-4 w-4 text-[#0078D4]" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Knowledge Density</div>
            <div className="text-xs font-bold text-[#242424]">{records.length + mergedVitals.length + clinicalData.clinical_records.length} total edges</div>
          </div>
        </div>
        <div className="flex -space-x-2">
          {[Pill, Activity, FileText].map((Icon, i) => (
            <div key={i} className="h-6 w-6 rounded-full bg-white border border-[#EDEBE9] flex items-center justify-center shadow-sm">
              <Icon className="h-3 w-3 text-[#616161]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
