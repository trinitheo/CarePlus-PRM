import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { 
  Activity, Heart, Thermometer, Wind, 
  Droplets, Scale, Ruler, TrendingUp, 
  ChevronRight, ShieldAlert, AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { useWindowSizeClass } from '../../hooks/useAdaptiveWidth';
import { Vitals } from '../../store/eventStore';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
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
  const [isWatchmanExpanded, setIsWatchmanExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const latestVitals = vitals[vitals.length - 1];

  // Watchman Clinical Alerts Engine Logic
  const alerts = useMemo(() => {
    if (!latestVitals) return [];
    const found = [];
    
    // Heart Rate Alerts
    if (latestVitals.hr > 110) {
      found.push({ id: 'hr-high', type: 'critical', title: 'Severe Tachycardia', detail: 'Sustained heart rate above 110 bpm indicates significant cardiac stress.', icon: Heart });
    } else if (latestVitals.hr > 100) {
      found.push({ id: 'hr-elev', type: 'warning', title: 'Elevated HR', detail: 'Heart rate slightly elevated from baseline.', icon: Heart });
    }

    // Blood Pressure Alerts
    const bpParts = latestVitals.bp?.split('/');
    if (bpParts && bpParts.length === 2) {
      const [sys, dia] = bpParts.map(Number);
      if (sys > 160 || dia > 100) {
        found.push({ id: 'bp-critical', type: 'critical', title: 'Hypertensive Crisis', detail: 'Immediate clinical review required for hypertensive state.', icon: Activity });
      } else if (sys > 140 || dia > 90) {
        found.push({ id: 'bp-alert', type: 'warning', title: 'Hypertension Stage 2', detail: 'Blood pressure is consistently above target range.', icon: Activity });
      }
    }

    // SpO2
    const spo2 = latestVitals?.spo2 ?? 98;
    if (spo2 < 95) {
      found.push({ id: 'spo2-low', type: 'warning', title: 'Borderline Hypoxia', detail: 'Oxygen saturation falling below 95% threshold.', icon: Droplets });
    }

    return found;
  }, [latestVitals]);

  return (
    <Card className="border-[#EDEBE9] shadow-sm rounded-2xl overflow-hidden bg-white h-full flex flex-col">
      <CardHeader className="py-5 px-6 border-b border-[#F3F2F1] bg-white shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#0078D4]" />
          <CardTitle className="text-[20pt] font-bold text-[#242424] tracking-tight">Vital signs</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            size="sm" 
            className="h-9 px-5 rounded-xl bg-[#0078D4] text-[11px] font-bold text-white uppercase tracking-widest hover:bg-[#005A9E] shadow-md shadow-[#0078D4]/20 transition-all border-none"
            onClick={() => setIsModalOpen(true)}
          >
            <Activity className="h-3.5 w-3.5 mr-2 opacity-80" />
            Update Vitals
          </Button>
          <div 
            className="flex items-center gap-2 px-3 py-1.5 bg-[#FDE7E9] border border-[#FBC6CC] rounded-full cursor-pointer hover:bg-[#FBC6CC] transition-colors"
            onClick={() => setIsWatchmanExpanded(!isWatchmanExpanded)}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D13438] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D13438]" />
            </span>
            <span className="text-[9px] font-black text-[#D13438] uppercase tracking-tighter">Watchman {isWatchmanExpanded ? 'Active' : 'Muted'}</span>
          </div>

        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 p-6 gap-6 overflow-auto">
          {/* Main Grid: Vitals Visualizer */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 shrink-0">
            {[
              { label: 'Heart Rate', value: latestVitals?.hr, icon: Heart, unit: 'bpm', color: TOKENS.critical },
              { label: 'Blood Pressure', value: latestVitals?.bp, icon: Activity, unit: 'mmHg', color: TOKENS.brand },
              { label: 'Resp Rate', value: latestVitals?.rr, icon: Wind, unit: 'breaths/min', color: TOKENS.success },
              { label: 'SpO2', value: latestVitals?.spo2, icon: Droplets, unit: '%', color: TOKENS.brand },
              { label: 'Temperature', value: latestVitals?.temp?.toFixed(1), icon: Thermometer, unit: '°C', color: TOKENS.warning },
              { label: 'Glucose', value: latestVitals?.glucose, icon: Activity, unit: 'mg/dL', color: TOKENS.warning },
              { label: 'Weight', value: latestVitals?.weight, icon: Scale, unit: 'kg', color: TOKENS.neutral2 },
              { label: 'Height', value: latestVitals?.height, icon: Ruler, unit: 'cm', color: TOKENS.neutral2 },
              { label: 'BMI', value: latestVitals?.bmi, icon: Activity, unit: '', color: TOKENS.critical },
              { 
                label: 'GCS', 
                value: latestVitals?.gcs || '--', 
                subValue: latestVitals?.gcs_e ? `E${latestVitals.gcs_e}V${latestVitals.gcs_v}M${latestVitals.gcs_m}` : null,
                icon: ShieldAlert, 
                unit: '', 
                color: TOKENS.neutral1 
              },
            ].map((v, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, ease: [0.33, 1, 0.68, 1] }}
                className="p-4 rounded-2xl border border-[#EDEBE9] bg-[#FAF9F8] hover:bg-white hover:border-[#0078D4] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: v.color }} />
                <div className="text-[10px] font-bold text-[#616161] mb-2 uppercase tracking-[0.1em] flex items-center gap-2.5">
                  <v.icon className="h-3.5 w-3.5" style={{ color: v.color }} /> 
                  {v.label}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-[26px] font-segoe font-normal tabular-nums tracking-tighter text-[#242424] group-hover:text-[#0078D4] transition-colors leading-none">
                      {v.value || '--'}
                    </div>
                    <div className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-tight">{v.unit}</div>
                  </div>
                  {(v as any).subValue && (
                    <div className="text-[9px] font-bold text-[#0078D4] mt-1 tracking-[0.05em] uppercase opacity-90">
                      {(v as any).subValue}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Watchman Ticker Scroll */}
          {isWatchmanExpanded && (
            <div className="bg-[#FAF9F8] rounded-[24px] border border-[#EDEBE9] overflow-hidden shadow-inner mt-2">
              <div className="px-5 py-2.5 border-b border-[#EDEBE9] bg-white/60 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[9px] font-bold text-[#242424] uppercase tracking-[0.2em]">
                  <ShieldAlert className="h-4 w-4 text-[#D13438]" />
                  Watchman Intelligence Engine
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-[#107C10]" />
                   <span className="text-[9px] font-bold text-[#616161] uppercase">{alerts.length} Detected Anomalies</span>
                </div>
              </div>
              <div className="relative h-16 overflow-hidden flex items-center bg-gradient-to-r from-transparent via-white/30 to-transparent">
                {alerts.length > 0 ? (
                  <motion.div 
                    className="flex gap-10 whitespace-nowrap px-6"
                    animate={{ x: [0, -1200] }}
                    transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                  >
                    {[...alerts, ...alerts, ...alerts].map((alert, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-[#EDEBE9] shadow-sm hover:border-[#0078D4] transition-colors">
                        <div className={`p-1.5 rounded-lg ${alert.type === 'critical' ? 'bg-[#FDE7E9]' : 'bg-[#FFF4CE]'}`}>
                          <alert.icon className={`h-3.5 w-3.5 ${alert.type === 'critical' ? 'text-[#D13438]' : 'text-[#845701]'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#242424] leading-tight">{alert.title}</span>
                          <span className="text-[9.5px] text-[#616161] leading-tight opacity-80">{alert.detail}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center w-full gap-3 text-[#107C10] py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Normal Sinus Rhythm / No Clinical Alerts</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
