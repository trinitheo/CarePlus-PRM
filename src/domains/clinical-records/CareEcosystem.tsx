import { useQueryModel } from '../../store/eventStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  HeartHandshake, DollarSign, Accessibility, MessagesSquare, 
  Stethoscope, Users, Clock, ArrowUpRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';

export function CareEcosystem({ patientId }: { patientId: string }) {
  const { interactions: mockInteractions } = useQueryModel();
  const clinicalData = usePatientClinicalData(patientId);

  // Merge Firestore interactions with mock interactions
  const firestoreInteractions = (clinicalData.interactions as any[])
    .map(i => ({
      ...i,
      timestamp: i.createdAt?.seconds ? i.createdAt.seconds * 1000 : (i.timestamp || Date.now())
    }));

  const localMockInteractions = mockInteractions[patientId] || [];
  
  // Filter out mock interactions that might have been saved to Firestore already (by matching content/type roughly if needed)
  // For simplicity, we'll just combine them and sort by timestamp
  const mergedInteractions = [...firestoreInteractions, ...localMockInteractions]
    .sort((a, b) => b.timestamp - a.timestamp);

  const getIcon = (type: string) => {
    switch (type) {
      case 'social_care': return HeartHandshake;
      case 'financial': return DollarSign;
      case 'pt': return Accessibility;
      case 'support_group': return MessagesSquare;
      case 'nursing': return Stethoscope;
      default: return Users;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'social_care': return 'text-[#E3008C] bg-[#FDE7F3]';
      case 'financial': return 'text-[#107C10] bg-[#DFF6DD]';
      case 'pt': return 'text-[#5C2D91] bg-[#EFE9F5]';
      case 'support_group': return 'text-[#008272] bg-[#E1F2F1]';
      case 'nursing': return 'text-[#D13438] bg-[#FDE7E9]';
      default: return 'text-[#0078D4] bg-[#DEECF9]';
    }
  };

  return (
    <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardHeader className="py-2.5 px-4 border-b border-[#F3F2F1] bg-white shrink-0 flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <CardTitle className="text-[12px] font-bold text-[#242424] flex items-center gap-2 uppercase tracking-widest opacity-80">
            <Users className="h-3.5 w-3.5 text-[#E3008C]" />
            Patient Support Ecosystem
          </CardTitle>
          <p className="text-[9px] text-[#616161] font-medium leading-none mt-0.5">Medical and social care team audit log</p>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
          {mergedInteractions.map((interaction, idx) => {
            const Icon = getIcon(interaction.type);
            const colorClass = getColor(interaction.type);
            
            return (
              <motion.div
                key={interaction.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-[#EDEBE9] hover:border-[#0078D4]/30 hover:shadow-sm transition-all rounded-lg p-3 bg-white overflow-hidden relative group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${colorClass.split(' ')[1]}`} />
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#242424]">{interaction.authorRole?.replace('_', ' ').toUpperCase() || 'STAFF'}</span>
                          <div className="h-1 w-1 rounded-full bg-[#BDBDBD]" />
                          <span className="text-[9px] font-bold text-[#616161] uppercase">{interaction.type?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-medium text-[#A19F9D]">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(interaction.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#242424] leading-tight line-clamp-2">{interaction.content}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {mergedInteractions.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-center space-y-2 bg-[#FAFAFA] rounded-2xl border border-dashed border-[#EDEBE9]">
              <Users className="h-8 w-8 text-[#BDBDBD]" />
              <p className="text-xs text-[#616161] font-medium">No care interactions ecosystem nodes established yet.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
  );
}
