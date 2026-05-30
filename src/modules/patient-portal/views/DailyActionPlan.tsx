import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  ShieldAlert, 
  Sparkles, 
  Droplet, 
  Brain, 
  Stethoscope, 
  ClipboardList, 
  Info, 
  Check,
  Timer,
  Sparkle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DailyActionPlanProps {
  patient: any;
  latestVitalRecord: any;
  bloodGlucoseStatus: {
    val: string;
    status: string;
    color: string;
  };
}

const CONDITION_DESCRIPTIONS: Record<string, {
  friendlyName: string;
  description: string;
  status: string;
  statusColor: string;
  managedBy: string;
  targetTitle: string;
  targetValue: string;
  tip: string;
  icon: any;
}> = {
  'Type 2 Diabetes': {
    friendlyName: 'Type 2 Diabetes Mellitus',
    description: 'A chronic metabolic profile where cellular receptors resist insulin, leading to elevated bloodstream glucose levels if unmonitored.',
    status: 'In Target Balance',
    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    managedBy: 'Dr. James Wilson (Endocrinology)',
    targetTitle: 'Target Glycemic HbA1c',
    targetValue: 'Under 6.5% (Latest reading: 5.9%)',
    tip: 'Walking directly post-meal triggers contraction-mediated cell glucose uptake, shielding your bloodstream from high glucose surges.',
    icon: Droplet
  },
  'PCOS': {
    friendlyName: 'Polycystic Ovary Syndrome (PCOS)',
    description: 'A hormonal and metabolic endocrine imbalance leading to elevated androgen indicators and cycle rhythm considerations.',
    status: 'Stable / Monitored',
    statusColor: 'bg-sky-50 text-sky-700 border-sky-200',
    managedBy: 'Dr. Elena Rostova (Reproductive Medicine)',
    targetTitle: 'Core Management Focus',
    targetValue: 'Hormonal and insulin sensitivity balance',
    tip: 'Regular resistance training optimizes natural muscular receptor activity, significantly lessening androgenic symptoms over time.',
    icon: Brain
  },
  'Rheumatoid Arthritis (M05.79)': {
    friendlyName: 'Rheumatoid Arthritis with Rheumatoid Factor (M05.79)',
    description: 'A chronic, systemic autoimmune inflammatory disease targeting synovial tissue in multiple symmetric joint spaces.',
    status: 'In Controlled Remission',
    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    managedBy: 'Dr. G. Theogate (Rheumatology)',
    targetTitle: 'Core Inflammatory Goal',
    targetValue: 'CRP < 5.0 mg/L (Latest: 3.2 mg/L)',
    tip: 'Morning warmth therapy followed by finger tendon gliding exercises reduces early stiffness and preserves joint kinematics.',
    icon: Stethoscope
  },
  'Rheumatoid Arthritis': {
    friendlyName: 'Rheumatoid Arthritis Status',
    description: 'A chronic, systemic autoimmune inflammatory disease targeting synovial tissue in multiple symmetric joint spaces.',
    status: 'In Controlled Remission',
    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    managedBy: 'Dr. G. Theogate (Rheumatology)',
    targetTitle: 'Core Inflammatory Goal',
    targetValue: 'CRP < 5.0 mg/L (Latest: 3.2 mg/L)',
    tip: 'Morning warmth therapy followed by finger tendon gliding exercises reduces early stiffness and preserves joint kinematics.',
    icon: Stethoscope
  }
};

export function DailyActionPlan({ patient, latestVitalRecord, bloodGlucoseStatus }: DailyActionPlanProps) {
  const [completedDirectives, setCompletedDirectives] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('careplus_completed_directives_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleToggleDirective = (id: string) => {
    const nextState = { ...completedDirectives, [id]: !completedDirectives[id] };
    setCompletedDirectives(nextState);
    localStorage.setItem('careplus_completed_directives_v2', JSON.stringify(nextState));
  };

  const clinicalDirectives = useMemo(() => {
    const liveSteps = latestVitalRecord?.steps !== undefined && latestVitalRecord?.steps !== null ? Number(latestVitalRecord.steps) : 7800;
    const liveSleep = latestVitalRecord?.sleep !== undefined && latestVitalRecord?.sleep !== null ? Number(latestVitalRecord.sleep) : 7.6;
    const liveGlucose = bloodGlucoseStatus.val;
    const liveHyd = latestVitalRecord?.hydration !== undefined && latestVitalRecord?.hydration !== null ? Number(latestVitalRecord.hydration) : 92;

    const isRA = (patient?.conditions || []).some((c: string) => c.toLowerCase().includes('arthritis') || c.toLowerCase().includes('rheumatoid'));

    if (isRA) {
      return [
        {
          id: 'dir-joint-exercises',
          action: 'Perform finger and wrist stretching exercises',
          instruction: 'Engage in 10 minutes of finger tendon gliding and gentle wrist physical therapy stretches.',
          trackingInfo: 'Completed daily joint physical therapy',
          category: 'Physical Therapy',
          status: 'Managed by Physiotherapy'
        },
        {
          id: 'dir-meds-ra',
          action: 'Verify weekly Immunomodulator dosage',
          instruction: 'Take Methotrexate and Folate exactly as scheduled to prevent inflammation flare-ups.',
          trackingInfo: 'Weekly Dose Logged',
          category: 'Pharmacotherapy',
          status: 'Managed by Rheumatology'
        },
        {
          id: 'dir-steps',
          action: 'Achieve low-impact step guidelines',
          instruction: 'Engage in gentle continuous walking to maintain lower extremity joint flexibility.',
          trackingInfo: `Current Progress: ${liveSteps.toLocaleString()} steps`,
          category: 'Physical Activity',
          status: liveSteps >= 7000 ? 'Target achieved today!' : 'Pending milestone'
        },
        {
          id: 'dir-sleep',
          action: 'Secure circadian restorative sleep window',
          instruction: 'Aim for 7.5+ hours of sound sleep to manage inflammation and fatigue triggers.',
          trackingInfo: `Latest sleep duration: ${liveSleep} hours`,
          category: 'Circadian Balance',
          status: liveSleep >= 7.0 ? 'Optimal recovery logged' : 'Below target'
        },
        {
          id: 'dir-hydration',
          action: 'Support fluid equilibrium & tissue hydration',
          instruction: 'Drink 2.5L filtered water daily to optimize synovial joint lubrication.',
          trackingInfo: `Tissue Hydration: ${liveHyd}%`,
          category: 'Hydration Status',
          status: liveHyd >= 85 ? 'Optimally hydrated' : 'Increase intake'
        }
      ];
    }

    return [
      {
        id: 'dir-glucose',
        action: 'Log and monitor blood glucose levels',
        instruction: 'Aim to check fasting level in the morning and post-meals.',
        trackingInfo: `Latest Logged: ${liveGlucose}`,
        category: 'Metabolic Log',
        status: 'Linked to Glucose telemetry'
      },
      {
        id: 'dir-meds',
        action: 'Take prescribed medication according to schedule',
        instruction: 'Take Metformin twice daily with breakfast and dinner.',
        trackingInfo: 'Active Prescriptions synced',
        category: 'Pharmacotherapy',
        status: 'Managed by endocrinology'
      },
      {
        id: 'dir-steps',
        action: 'Achieve cardiovascular step output metrics',
        instruction: 'Walk 30 minutes post-dinner to aid glucose absorption pathways.',
        trackingInfo: `Current Progress: ${liveSteps.toLocaleString()} steps`,
        category: 'Physical Activity',
        status: liveSteps >= 8000 ? 'Target achieved today!' : 'Pending milestone'
      },
      {
        id: 'dir-sleep',
        action: 'Secure hormonal circadian restorative cycle',
        instruction: 'Maintain consistent 7.5+ hour sleeping window with restful environment.',
        trackingInfo: `Latest sleep duration: ${liveSleep} hours`,
        category: 'Circadian Balance',
        status: liveSleep >= 7.0 ? 'Optimal recovery logged' : 'Below target'
      },
      {
        id: 'dir-hydration',
        action: 'Support fluid equilibrium & metabolic detox',
        instruction: 'Target 2.5L filtered water intake daily to support endocrine flush.',
        trackingInfo: `Hydration Quotient: ${liveHyd}%`,
        category: 'Hydration Status',
        status: liveHyd >= 85 ? 'Optimally hydrated' : 'Increase intake'
      }
    ];
  }, [latestVitalRecord, bloodGlucoseStatus, patient]);

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Periodically refresh current time to handle real-time JITAI expiration
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const combinedDirectives = useMemo(() => {
    const staticDirs = clinicalDirectives.map(item => ({
      ...item,
      id: item.id,
      type: 'clinical_directive' as const,
      action: item.action,
      instruction: item.instruction,
      category: item.category,
      trackingInfo: item.trackingInfo,
      status: item.status,
      expirationTimestamp: 0
    }));

    const dynamicGoals = (patient?.actionPlan || []).map((item: any) => ({
      id: item.id,
      type: 'ai_micro_goal' as const,
      action: item.title,
      instruction: item.description,
      category: 'AI Telemetry Nudge',
      trackingInfo: 'Smart Telemetry',
      status: 'Adherence action needed',
      expirationTimestamp: item.expirationTimestamp || (Date.now() + 3600 * 1000)
    }));

    return [...staticDirs, ...dynamicGoals];
  }, [clinicalDirectives, patient?.actionPlan]);

  const visibleDirectives = useMemo(() => {
    return combinedDirectives.filter(goal => {
      if (goal.type === 'ai_micro_goal') {
        const isCompleted = !!completedDirectives[goal.id];
        if (!isCompleted && goal.expirationTimestamp < currentTime) {
          return false; // Hide expired nudges if not completed
        }
      }
      return true;
    });
  }, [combinedDirectives, completedDirectives, currentTime]);

  const completionPercent = useMemo(() => {
    const total = visibleDirectives.length;
    const completedCount = visibleDirectives.filter(d => completedDirectives[d.id]).length;
    return total > 0 ? Math.round((completedCount / total) * 100) : 0;
  }, [visibleDirectives, completedDirectives]);

  const getRemainingTimeText = (expirationTimestamp: number) => {
    const diff = expirationTimestamp - currentTime;
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins > 0) return `Expires in ${mins}m ${secs}s`;
    return `Expires in ${secs}s`;
  };

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              Daily Action Plan & Active Conditions
            </CardTitle>
            <CardDescription className="text-xs">
              Your diagnoses-specific care protocols and interactive patient engagement directives
            </CardDescription>
          </div>
          {completionPercent > 0 && (
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-1 shrink-0 font-medium self-start sm:self-auto">
              Today's Protocol: {completionPercent}% Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Visual Conditions Cards Panel */}
          <div className="xl:col-span-7 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-sans">
              <Info className="h-3.5 w-3.5" />
              Medical Conditions Under Care
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(patient?.conditions || []).map((cond: string, idx: number) => {
                const descObj = CONDITION_DESCRIPTIONS[cond] || {
                  friendlyName: cond,
                  description: 'Diagnosed chronic condition undergoing active treatment and remote clinician supervision.',
                  status: 'Active Supervision',
                  statusColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  managedBy: 'Referral Team (Assigned)',
                  targetTitle: 'Current Action Goal',
                  targetValue: 'Adhere to default clinical baseline recommendations',
                  tip: 'Maintain regular logging of symptoms and seek immediate counsel if telemetry indicators deviate.',
                  icon: ShieldAlert
                };
                const Icon = descObj.icon;
                
                return (
                  <div key={idx} className="flex flex-col justify-between border border-slate-100 rounded-xl bg-slate-50/25 shadow-sm hover:shadow transition-shadow overflow-hidden font-sans">
                    {/* Card top banner with icon */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${descObj.statusColor}`}>
                          {descObj.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{descObj.friendlyName}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">{descObj.description}</p>
                      </div>
                    </div>
                    
                    {/* Inner details */}
                    <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 space-y-2.5 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{descObj.targetTitle}</span>
                        <span className="font-semibold text-slate-700">{descObj.targetValue}</span>
                      </div>
                      
                      <div className="pt-1.5 border-t border-slate-100/50 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Primary Specialist</span>
                        <span className="font-medium text-slate-600">{descObj.managedBy}</span>
                      </div>

                      <div className="p-2.5 bg-blue-50/30 rounded-lg border border-blue-100/30 text-[11.5px] text-blue-950 leading-normal flex gap-1.5 items-start mt-1 font-normal">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{descObj.tip}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!patient?.conditions || patient.conditions.length === 0) && (
                <p className="text-xs text-slate-500 italic p-4 text-center border rounded-xl border-dashed col-span-2 font-sans">No diagnosed health parameters loaded in current Care Plan.</p>
              )}
            </div>
          </div>
          
          {/* Interactive Patient Day Plan directives checklist */}
          <div className="xl:col-span-5 bg-slate-50/35 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between font-sans">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
                  Today's Care Actions
                </h3>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">
                  {visibleDirectives.filter(d => completedDirectives[d.id]).length} / {visibleDirectives.length} done
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4 font-normal">
                Interactive clinical checklist designed dynamically from your biometric inputs and doctor-set directives.
              </p>
              
              {/* Completion Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden mb-5">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              
              {/* Checklist elements list */}
              <div className="space-y-3">
                {visibleDirectives.map((dir) => {
                  const isDone = !!completedDirectives[dir.id];
                  const isAI = dir.type === 'ai_micro_goal';
                  return (
                    <div 
                      key={dir.id}
                      onClick={() => handleToggleDirective(dir.id)}
                      className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-3 select-none ${
                        isDone 
                          ? isAI
                            ? 'bg-emerald-50/20 border-emerald-200/50 hover:bg-emerald-50/40 shadow-sm'
                            : 'bg-emerald-50/30 border-emerald-200/50 hover:bg-emerald-50/50 shadow-sm' 
                          : isAI
                            ? 'bg-[#EEF3F0]/80 border-emerald-300 hover:border-emerald-400 hover:bg-[#EEF3F0] shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 shadow-sm'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isAI
                              ? 'border-emerald-500 bg-white'
                              : 'border-slate-300 bg-white'
                        }`}>
                          {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                      
                      <div className="space-y-1 pr-1 text-left flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wide font-mono px-1.5 py-0.25 rounded ${
                            isAI ? 'bg-emerald-100 text-[#3F5B42]' : 'text-slate-400 bg-slate-100'
                          }`}>
                            {isAI ? '🤖 ' : ''}{dir.category}
                          </span>
                          {isAI && !isDone && (
                            <span className="text-[9px] font-mono font-bold text-amber-600 flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {getRemainingTimeText(dir.expirationTimestamp)}
                            </span>
                          )}
                        </div>
                        
                        <h4 className={`text-xs font-bold leading-tight ${isDone ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                          {dir.action}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-snug font-normal">
                          {dir.instruction}
                        </p>
                        
                        <div className="flex flex-wrap gap-x-2 pt-1 font-mono text-[9px] font-bold">
                          <span className={`${
                            isAI ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-blue-600 bg-blue-50 border-blue-100/50'
                          } px-1.5 py-0.25 rounded border shrink-0`}>
                            {dir.trackingInfo}
                          </span>
                          <span className={`shrink-0 ${isDone ? 'text-emerald-500' : 'text-amber-500'}`}>
                            • {isDone ? 'Telemetry Log Verified' : dir.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer motivational guidance */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2.5 text-[10.5px] text-slate-400 italic font-normal leading-normal">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Checking off daily care actions validates telemetry logs and logs adherence status automatically.</span>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
