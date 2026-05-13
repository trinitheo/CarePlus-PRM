
import React, { useMemo, useState } from 'react';
import { 
  Heart, Pill, Link2, Smartphone, Apple, Activity, Wind, Droplets, Scale, Thermometer, Zap 
} from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import { DashCard, SectionHeader, Empty } from '../components/DashboardUI';
import { HealthConnectManager } from '../../clinical-records/HealthConnectManager';

// --- My Vitals Widget ---
export function MyVitalsWidget({ metrics, hasCritical, onNavigate }: { 
  metrics: any[], 
  hasCritical: boolean,
  onNavigate?: () => void 
}) {
  return (
    <DashCard>
      <SectionHeader 
        icon={Heart} 
        label="My Vitals" 
        color="bg-red-50 text-red-600" 
        action={
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[9px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9]"
            onClick={onNavigate}
          >
            Full Record
          </Button>
        }
      />
      <ScrollArea className="flex-1">
        {metrics.length === 0 ? (
          <Empty message="No vitals recorded yet" />
        ) : (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(m => (
                <div 
                  key={m.label} 
                  className={`rounded-2xl p-3.5 flex flex-col gap-1 border transition-all hover:shadow-md ${m.ok ? 'bg-[#FAFAFA] border-[#EDEBE9]' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-center gap-2">
                    <m.icon className={`h-3 w-3 ${m.ok ? 'text-[#757370]' : 'text-red-600'}`} style={m.ok ? { color: m.color } : {}} />
                    <p className="text-[9px] font-black text-[#757370] uppercase tracking-wider">{m.label}</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <p className={`text-[18px] font-black leading-none ${m.ok ? 'text-[#242424]' : 'text-red-800'}`}>{m.value}</p>
                    <p className="text-[9px] font-bold text-[#A19F9D] lowercase italic">{m.unit}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {hasCritical && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-2xl flex items-center gap-3">
                <Zap className="h-4 w-4 text-red-700" />
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight">Watchman: Immediate Review Advised</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </DashCard>
  );
}

// --- My Medications Widget ---
export function MyMedicationsWidget({ meds, onNavigate }: { meds: any[], onNavigate?: () => void }) {
  return (
    <DashCard>
      <SectionHeader 
        icon={Pill} 
        label="My Medications" 
        count={meds.length} 
        color="bg-[#DFF6DD] text-[#107C10]" 
        action={
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[9px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9]"
            onClick={onNavigate}
          >
            Manage
          </Button>
        }
      />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {meds.length === 0 && <Empty message="No active prescriptions" />}
          {meds.map(med => (
            <div key={med.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold text-[#242424] truncate">{med.medicationName}</p>
                  <p className="text-[11px] text-[#757370] mt-0.5">{med.dosage} · {med.frequency}</p>
                  {med.sig && <p className="text-[10.5px] text-[#A19F9D] mt-1 italic line-clamp-2">"{med.sig}"</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- Health Sync Widget ---
export function HealthSyncWidget({ patientId }: { patientId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DashCard>
      <SectionHeader icon={Link2} label="Device Sync" color="bg-emerald-100 text-emerald-700" />
      <div className="p-4 flex flex-col items-center justify-center gap-3 text-center flex-1">
        <div className="flex -space-x-2">
          <div className="h-10 w-10 rounded-full bg-white border-2 border-emerald-50 flex items-center justify-center shadow-sm">
            <Smartphone className="h-5 w-5 text-green-500" />
          </div>
          <div className="h-10 w-10 rounded-full bg-white border-2 border-emerald-50 flex items-center justify-center shadow-sm">
            <Apple className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <div>
          <p className="text-[12px] font-bold text-[#242424]">Health Connect & Apple Health</p>
          <p className="text-[10px] text-[#757370] font-medium leading-tight mt-1">Sync your clinical records with real-time wearable telemetry.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-xl border-[#EDEBE9] hover:bg-[#FAFAFA] font-bold text-xs mt-2"
          onClick={() => setIsOpen(true)}
        >
          Manage Connection
        </Button>
      </div>

      <HealthConnectManager 
        patientId={patientId} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </DashCard>
  );
}
