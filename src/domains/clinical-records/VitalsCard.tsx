import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Activity, Heart, Thermometer, Wind, 
  Droplets, Scale, Ruler, TrendingUp, 
  ChevronRight, ShieldAlert, AlertCircle,
  CheckCircle2, Brain, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../lib/motion';
import { useWindowSizeClass } from '../../hooks/useAdaptiveWidth';
import { Vitals } from '../../store/eventStore';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Button } from '../../components/ui/button';
import { UpdateVitalsModal } from './UpdateVitalsModal';

// Microsoft Fluent 2 UI Design Tokens
const TOKENS = {
  neutral1: '#242424', // High contrast text
  neutral2: '#616161', // Secondary text
  neutral3: '#A19F9D', // De-emphasized text
  stroke1: '#EDEBE9',  // Standard border
  bg1: '#FFFFFF',      // White surface
  bg2: '#FAFAFA',      // Subtle surface
  brand: '#0078D4',    // Microsoft Blue
  critical: '#D13438', // Red
  warning: '#845701',  // Gold/Warning
  success: '#107C10',  // Green
};

interface VitalsCardProps {
  vitals: Vitals[];
  patientId: string;
}

export function VitalsCard({ vitals, patientId }: VitalsCardProps) {
  const sizeClass = useWindowSizeClass();
  const [isWatchmanExpanded, setIsWatchmanExpanded] = useState(sizeClass === 'expanded');
  const [isVitalsExpanded, setIsVitalsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const latestVitals = vitals[vitals.length - 1];

  const isCompact = sizeClass === 'compact';

  // Watchman Clinical Alerts Engine Logic
  const alerts = useMemo(() => {
    if (!latestVitals) return [];
    const found = [];
    
    if (latestVitals.hr > 110) {
      found.push({ id: 'hr-high', type: 'critical', title: 'Severe Tachycardia', detail: 'Sustained heart rate above 110 bpm.', icon: Heart });
    } else if (latestVitals.hr > 100) {
      found.push({ id: 'hr-elev', type: 'warning', title: 'Elevated HR', detail: 'Heart rate slightly elevated.', icon: Heart });
    }

    const bpParts = latestVitals.bp?.split('/');
    if (bpParts && bpParts.length === 2) {
      const [sys, dia] = bpParts.map(Number);
      if (sys > 160 || dia > 100) {
        found.push({ id: 'bp-critical', type: 'critical', title: 'Hypertensive Crisis', detail: 'Immediate clinical review required.', icon: Activity });
      } else if (sys > 140 || dia > 90) {
        found.push({ id: 'bp-alert', type: 'warning', title: 'Hypertension Stage 2', detail: 'BP consistently above target.', icon: Activity });
      }
    }

    const spo2 = latestVitals?.spo2 ?? 98;
    if (spo2 < 95) {
      found.push({ id: 'spo2-low', type: 'warning', title: 'Borderline Hypoxia', detail: 'O2 saturation below 95%.', icon: Droplets });
    }

    return found;
  }, [latestVitals]);

  const allMetrics = [
    { label: 'Heart Rate', value: latestVitals?.hr, icon: Heart, unit: 'bpm', color: TOKENS.critical },
    { label: 'Blood Pressure', value: latestVitals?.bp, icon: Activity, unit: 'mmHg', color: TOKENS.brand },
    { label: 'Resp Rate', value: latestVitals?.rr, icon: Wind, unit: 'bpm', color: TOKENS.success },
    { label: 'SpO2', value: latestVitals?.spo2, icon: Droplets, unit: '%', color: TOKENS.brand },
    { label: 'Temp', value: latestVitals?.temp !== undefined ? Number(latestVitals.temp).toFixed(1) : '--', icon: Thermometer, unit: '°C', color: TOKENS.warning },
    { label: 'Glucose', value: latestVitals?.glucose, icon: Activity, unit: 'mg/dL', color: TOKENS.warning },
    { label: 'BMI', value: latestVitals?.bmi, icon: TrendingUp, unit: '', color: TOKENS.critical },
    { label: 'Weight', value: latestVitals?.weight, icon: Scale, unit: 'kg', color: TOKENS.neutral2 },
    { label: 'Height', value: latestVitals?.height, icon: Ruler, unit: 'cm', color: TOKENS.neutral2 },
    { 
      label: 'GCS', 
      value: latestVitals?.gcs || '--', 
      subValue: latestVitals?.gcs_e ? `E${latestVitals.gcs_e}V${latestVitals.gcs_v}M${latestVitals.gcs_m}` : null,
      icon: ShieldAlert, 
      unit: '', 
      color: TOKENS.neutral1 
    },
    { 
      label: 'HbA1c',
      value: latestVitals?.hba1c || '--',
      icon: Droplets,
      unit: '%',
      color: TOKENS.warning
    },
    { 
      label: 'AVPU',
      value: latestVitals?.avpu || '--',
      icon: AlertCircle,
      unit: '',
      color: TOKENS.brand
    },
  ];

  const visibleMetrics = isVitalsExpanded ? allMetrics : allMetrics.slice(0, 8);

  return (
    <Card className={`border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white h-full flex flex-col transition-all duration-500`}>
      <CardHeader className="py-1.5 px-2 border-b border-[#F3F2F1] bg-white shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#0078D4]" />
          <CardTitle className="text-xl font-bold text-[#242424] tracking-tight">Vitals</CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2 bg-[#D13438] text-[8px] uppercase font-bold animate-pulse px-1.5 py-0">
              {alerts.length} Alerts
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-3 rounded-lg bg-[#0078D4] text-[10px] font-bold text-white uppercase tracking-wider hover:bg-[#005A9E] shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            Update
          </Button>
          <div 
            className="flex items-center gap-2 px-2 py-1 bg-[#FDE7E9] border border-[#FBC6CC] rounded-full cursor-pointer hover:bg-[#FBC6CC] transition-colors"
            onClick={() => setIsWatchmanExpanded(!isWatchmanExpanded)}
          >
            <Zap className={`h-3 w-3 ${isWatchmanExpanded ? 'text-[#D13438]' : 'text-[#616161]'}`} />
            <span className="text-[8px] font-black text-[#D13438] uppercase tracking-tighter">Watchman</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {/* Vitals Grid: 4 columns */}
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AnimatePresence initial={false}>
                {visibleMetrics.map((v, i) => (
                  <motion.div 
                    key={v.label}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={transition.entrance}
                    className="p-3 rounded-xl border border-[#EDEBE9] bg-[#FAF9F8] hover:bg-white hover:border-[#0078D4] hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: v.color }} />
                    <div className="text-[9px] font-bold text-[#616161] mb-1 uppercase tracking-widest flex items-center gap-1.5">
                      <v.icon className="h-3 w-3" style={{ color: v.color }} /> 
                      {v.label}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-xl font-bold tabular-nums tracking-tighter text-[#242424] group-hover:text-[#0078D4]">
                        {v.value}
                      </div>
                      <div className="text-[9px] font-bold text-[#A19F9D] lowercase italic">{v.unit}</div>
                    </div>
                    {(v as any).subValue && (
                      <div className="mt-1 text-[9px] font-bold text-[#0078D4] opacity-80">
                        {(v as any).subValue}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Expand/Collapse Toggle */}
            <div className="flex justify-center mt-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVitalsExpanded(!isVitalsExpanded)}
                className="text-[10px] font-bold uppercase tracking-widest text-[#0078D4] hover:bg-[#0078D4]/5 rounded-full px-4 h-8 flex items-center gap-2"
              >
                {isVitalsExpanded ? (
                  <>See Less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>See More <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </div>
            
            {/* Watchman Inline */}
            <AnimatePresence>
              {isWatchmanExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition.entrance}
                  className="overflow-hidden"
                >
                  <div className="bg-[#FAF9F8] rounded-2xl border border-[#EDEBE9] overflow-hidden">
                    <div className="px-4 py-3 bg-white/50 flex items-center justify-between border-b border-[#EDEBE9]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D13438] flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Watchman Intelligence Engine
                      </span>
                      <Badge variant="outline" className="bg-white text-[9px] font-bold">
                        {alerts.length} Warnings
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                      {alerts.length > 0 ? alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-[#EDEBE9] shadow-sm">
                          <div className={`p-2 rounded-lg ${alert.type === 'critical' ? 'bg-[#FDE7E9]' : 'bg-[#FFF4CE]'}`}>
                            <alert.icon className={`h-4 w-4 ${alert.type === 'critical' ? 'text-[#D13438]' : 'text-[#845701]'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-[#242424]">{alert.title}</span>
                            <span className="text-[10px] text-[#616161] leading-tight">{alert.detail}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-6 text-[#107C10] flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-6 w-6" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Clinical Parameters Stable</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
      <UpdateVitalsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patientId={patientId}
        currentVitals={latestVitals}
      />
    </Card>
  );
}
