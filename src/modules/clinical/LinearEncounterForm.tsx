import React from 'react';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { MedicalNode } from '../../types';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  Activity, 
  Lightbulb, 
  Navigation,
  FileText,
  Type
} from 'lucide-react';

interface LinearEncounterFormProps {
  nodes: MedicalNode[];
  onUpdateNode: (nodeId: string, updates: Partial<MedicalNode['data']>) => void;
}

export function LinearEncounterForm({ nodes, onUpdateNode }: LinearEncounterFormProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'narrative': return FileText;
      case 'background': return History;
      case 'screening': return Search;
      case 'objective': return Activity;
      case 'synthesis': return Lightbulb;
      case 'disposition': return Navigation;
      default: return Type;
    }
  };

  return (
    <div className="space-y-12 py-8 max-w-3xl mx-auto px-4">
      {nodes.map((node, idx) => {
        const Icon = getIcon(node.type);
        return (
          <motion.div 
            key={node.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative"
          >
            <div className="absolute -left-6 top-0 bottom-0 w-px bg-[#EDEBE9] hidden lg:block" />
            <div className="absolute -left-10 top-0 bg-white border border-[#EDEBE9] p-2 rounded-full shadow-sm hidden lg:flex">
              <Icon className="h-4 w-4 text-[#0078D4]" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#242424] uppercase tracking-tighter">{node.data.label}</h3>
                  <p className="text-xs text-[#616161] font-medium tracking-tight">System Node ID: {node.id.toUpperCase()}</p>
                </div>
                <Select 
                  value={node.data.status} 
                  onValueChange={(val) => onUpdateNode(node.id, { status: val as any })}
                >
                  <SelectTrigger className="w-32 h-8 text-[11px] font-bold uppercase border-[#EDEBE9]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal" className="text-[11px] font-bold uppercase">Normal</SelectItem>
                    <SelectItem value="abnormal" className="text-[11px] font-bold uppercase text-[#D13438]">Abnormal</SelectItem>
                    <SelectItem value="critical" className="text-[11px] font-bold uppercase text-[#A4262C]">Critical</SelectItem>
                    <SelectItem value="pending" className="text-[11px] font-bold uppercase italic">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea 
                value={node.data.details}
                onChange={(e) => onUpdateNode(node.id, { details: e.target.value })}
                placeholder={`Enter ${node.data.label.toLowerCase()} details here...`}
                className="min-h-[140px] bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white focus:ring-1 focus:ring-[#0078D4]/20 rounded-xl p-4 text-[13px] leading-relaxed resize-none shadow-inner"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
