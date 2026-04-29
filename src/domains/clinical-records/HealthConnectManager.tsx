import { useState } from 'react';
import { useCommandDispatcher } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Apple, Smartphone, Watch, Pill, Utensils, Link2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../../components/ui/dialog';

interface ConnectionProps {
  patientId: string;
}

export function HealthConnectManager({ patientId }: ConnectionProps) {
  const dispatch = useCommandDispatcher();
  const [status, setStatus] = useState<Record<string, 'disconnected' | 'connecting' | 'connected'>>({
    health_connect: 'disconnected',
    google_fit: 'disconnected',
    apple_health: 'disconnected',
  });

  const [lastSync, setLastSync] = useState<string | null>(null);

  const connectService = (service: string) => {
    setStatus(prev => ({ ...prev, [service]: 'connecting' }));
    
    // Simulate connection delay
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [service]: 'connected' }));
      
      // Emit connection event (hypothetically)
      // For now we just trigger some data ingestion
      ingestSamples(service);
    }, 1500);
  };

  const ingestSamples = (service: string) => {
    const samples = [
      { type: 'STEPS', value: 8432, source: 'watch' },
      { type: 'MEDICATION_ADHERENCE', value: 'Lisinopril 10mg - Taken', source: 'medication_log' },
      { type: 'KCAL_INTAKE', value: 1850, source: 'diet' },
    ];

    samples.forEach((sample, index) => {
      setTimeout(() => {
        dispatch({
          type: 'HEALTH_DATA_INGESTED',
          payload: {
            id: `hr-${Date.now()}-${index}`,
            patientId,
            source: sample.source as any,
            type: sample.type,
            value: sample.value,
            timestamp: Date.now(),
          },
        });
        setLastSync(new Date().toLocaleTimeString());
      }, index * 500);
    });
  };

  const services = [
    { id: 'health_connect', name: 'Android Health Connect', icon: Smartphone, color: 'text-green-500' },
    { id: 'apple_health', name: 'Apple Health', icon: Apple, color: 'text-red-500' },
  ];

  return (
    <Dialog>
      <DialogTrigger render={
        <button type="button" className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all px-1 py-1 rounded-md border-none bg-transparent outline-none ring-0">
          <Link2 className="h-3.5 w-3.5 text-[#0078D4]" />
          <span className="text-[11px] font-bold text-[#424242] whitespace-nowrap tracking-tight">Sync Status</span>
        </button>
      } />
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-border bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Device & App Sync
          </DialogTitle>
          <DialogDescription className="text-sm">
            Unified ingestion from wearable telemetry, medication logs, and nutritional APIs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-3">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-background border border-border/50 shadow-sm ${service.color}`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{service.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider font-bold">
                      {status[service.id] === 'connected' ? 'CONNECTED' : 'NOT LINKED'}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={status[service.id] === 'connected' ? 'outline' : 'default'}
                  disabled={status[service.id] === 'connecting'}
                  onClick={() => connectService(service.id)}
                  className="rounded-xl font-bold text-xs"
                >
                  {status[service.id] === 'connecting' && <RefreshCw className="h-3 w-3 mr-2 animate-spin" />}
                  {status[service.id] === 'connected' ? 'Disconnect' : 'Link'}
                </Button>
              </div>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="h-3 w-3" /> Digital Biomarker Feeds
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Watch, label: 'Watch', color: 'text-blue-500' },
                { icon: Pill, label: 'Pharmacy', color: 'text-orange-500' },
                { icon: Utensils, label: 'Nutrition', color: 'text-emerald-500' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 border border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center bg-muted/5 group hover:bg-muted/10 transition-colors">
                  <item.icon className={`h-5 w-5 mb-2 ${item.color}`} />
                  <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
