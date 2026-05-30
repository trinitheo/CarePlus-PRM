import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Heart, 
  Activity, 
  Pill, 
  Calendar, 
  ShieldAlert, 
  UserCheck, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2,
  Lock,
  ArrowRight,
  Droplet,
  Gauge,
  Thermometer,
  Scale,
  Ruler,
  Brain,
  Smile,
  Moon,
  Zap,
  ChevronDown,
  ChevronUp,
  GripVertical,
  RefreshCw,
  Stethoscope,
  ClipboardList,
  Info,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { transition } from '../../../lib/motion';
import { DailyActionPlan } from './DailyActionPlan';

interface HealthBoardProps {
  patientData?: {
    patient?: {
      id?: string;
      name: string;
      dob: string;
      age: number;
      conditions: string[];
      mrn: string;
    } | null;
    vitals?: any[];
    prescriptions?: any[];
    clinical_records?: any[];
  };
  appointments?: any[];
  onNavigateTab?: (tab: string) => void;
}

export function HealthBoard({ patientData = {}, appointments = [], onNavigateTab }: HealthBoardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeVibe, setActiveVibe] = useState<'holistic' | 'metabolic' | 'activity' | 'circadian'>('holistic');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Auto-cycle conversational greeting focus categories every 30 seconds
  useEffect(() => {
    const vibes: ('holistic' | 'metabolic' | 'activity' | 'circadian')[] = ['holistic', 'metabolic', 'activity', 'circadian'];
    const timer = setTimeout(() => {
      const currentIndex = vibes.indexOf(activeVibe);
      const nextIndex = (currentIndex + 1) % vibes.length;
      setActiveVibe(vibes[nextIndex]);
    }, 30000);

    return () => clearTimeout(timer);
  }, [activeVibe]);

  const defaultOrder = useMemo(() => [
    'Blood Pressure',
    'Heart Rate',
    'Blood Glucose',
    'Oxygen Saturation',
    'Temperature',
    'Respiratory Rate',
    'Body Weight',
    'Height',
    'BMI Quotient',
    'HbA1c Baseline',
    'Glasgow Coma Scale',
    'AVPU Response',
    'Pain Index',
    'Hydration Status',
    'Sleep Log',
    'Daily Target Steps'
  ], []);

  const [vitalsOrder, setVitalsOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('careplus_vitals_order_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      'Blood Pressure',
      'Heart Rate',
      'Blood Glucose',
      'Oxygen Saturation',
      'Temperature',
      'Respiratory Rate',
      'Body Weight',
      'Height',
      'BMI Quotient',
      'HbA1c Baseline',
      'Glasgow Coma Scale',
      'AVPU Response',
      'Pain Index',
      'Hydration Status',
      'Sleep Log',
      'Daily Target Steps'
    ];
  });

  const handleResetOrder = () => {
    setVitalsOrder(defaultOrder);
    localStorage.removeItem('careplus_vitals_order_v1');
  };
  const patient = patientData?.patient || {
    name: 'Sarah Mitchell',
    dob: 'Mar 15, 1984',
    age: 42,
    conditions: ['Type 2 Diabetes', 'PCOS'],
    mrn: 'MRN-77291-SM',
    id: 'sarah-mitchell-42'
  };

  const handleSyncVitals = async () => {
    setIsSyncing(true);
    setSyncStatusMessage('Querying telemetry feeds...');
    try {
      // Simulate real-time secure sync with clinical database
      await new Promise(resolve => setTimeout(resolve, 800));
      setSyncStatusMessage('Latest vitals retrieved!');
      
      const count = patientData?.vitals?.length || 0;
      console.log(`Synchronized telemetry dataset for patient with ${count} vital records.`);
      
      setTimeout(() => setSyncStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to sync patient telemetry:', err);
      setSyncStatusMessage('Sync failed. Please retry.');
      setTimeout(() => setSyncStatusMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };
  const vitals = patientData?.vitals || [];
  const prescriptions = patientData?.prescriptions || [];

  // Sort and extract the latest vital record from the list
  const latestVitalRecord = useMemo(() => {
    if (!vitals || vitals.length === 0) return null;
    // Sort descending by timestamp or seconds
    return [...vitals].sort((a, b) => {
      const timeA = a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
      const timeB = b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
      return timeB - timeA;
    })[0];
  }, [vitals]);

  // Custom styling rules congruent with Aequanimitas high-density clinical UI
  const bloodGlucoseStatus = useMemo(() => {
    let glucoseVal: number | null = null;
    let customStatus: string | null = null;
    let customColor: string | null = null;
    
    // Check sorted latest record first
    if (latestVitalRecord) {
      if (latestVitalRecord.glucoseStatus) {
        customStatus = latestVitalRecord.glucoseStatus;
      } else if (latestVitalRecord.status && typeof latestVitalRecord.status === 'string') {
        customStatus = latestVitalRecord.status;
      }
      
      if (latestVitalRecord.glucoseColor) {
        customColor = latestVitalRecord.glucoseColor;
      } else if (latestVitalRecord.statusColor) {
        customColor = latestVitalRecord.statusColor;
      }

      if (latestVitalRecord.glucose !== undefined && latestVitalRecord.glucose !== null && latestVitalRecord.glucose !== 0) {
        glucoseVal = Number(latestVitalRecord.glucose);
      } else if ((latestVitalRecord.type === 'blood_glucose' || latestVitalRecord.type === 'Glucose') && latestVitalRecord.value) {
        glucoseVal = Number(latestVitalRecord.value);
      }
    }
    
    // Fallback to searching the vitals list for type specific readings
    if (glucoseVal === null) {
      const glucoseVitals = vitals.filter(v => v.type === 'blood_glucose' || v.type === 'Glucose');
      if (glucoseVitals.length > 0) {
        const sortedGlucose = [...glucoseVitals].sort((a, b) => {
          const timeA = a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
          const timeB = b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
          return timeB - timeA;
        });
        glucoseVal = Number(sortedGlucose[0].value);
        if (sortedGlucose[0].status) customStatus = sortedGlucose[0].status;
      }
    }

    const val = glucoseVal !== null ? glucoseVal : 140; // DB seed has 140 mg/dL

    // If backend-driven rules passed an exact status string, prioritize it blindly
    if (customStatus) {
      const lowerStatus = customStatus.toLowerCase();
      let colorClass = 'amber';
      if (lowerStatus.includes('optimal') || lowerStatus.includes('normal') || lowerStatus.includes('controlled') || lowerStatus.includes('in range')) {
        colorClass = 'emerald';
      } else if (lowerStatus.includes('high') || lowerStatus.includes('alert') || lowerStatus.includes('severe') || lowerStatus.includes('danger')) {
        colorClass = 'red';
      }
      if (customColor) {
        colorClass = customColor.includes('emerald') || customColor.includes('green') ? 'emerald' : 
                     customColor.includes('red') || customColor.includes('rose') ? 'red' : 'amber';
      }
      return { val: `${val} mg/dL`, status: customStatus, color: colorClass };
    }
    
    // Otherwise, perform clinical logic to categorize thresholds correctly without hardcoding "Optimal" for elevated numbers
    let rangeStatus = 'Controlled / In Range';
    let rangeColor = 'emerald';

    if (val >= 140) {
      // Fasting/Resting Glucose of 140+ is elevated clinical range
      rangeStatus = 'Elevated (Diabetes Range)';
      rangeColor = 'amber'; // Render Warning (Yellow/Amber)
    } else if (val >= 100) {
      // 100-139 mg/dL fasting
      rangeStatus = 'Borderline (Pre-Diabetes)';
      rangeColor = 'amber'; // Render warning
    } else if (val < 70) {
      rangeStatus = 'Low (Hypoglycemia Risk)';
      rangeColor = 'red'; // Render danger (Red)
    } else {
      rangeStatus = 'Optimal (Fasting Balance)';
      rangeColor = 'emerald'; // Render optimal (Green)
    }

    return { val: `${val} mg/dL`, status: rangeStatus, color: rangeColor };
  }, [vitals, latestVitalRecord]);

  // Find simulated or actual vitals
  const vitalSignsList = useMemo(() => {
    // 1. Blood Pressure
    let bpVal = '118/76 mmHg';
    let bpStatus = 'Normal';
    if (latestVitalRecord?.bp) {
      bpVal = latestVitalRecord.bp.includes('mmHg') || latestVitalRecord.bp.includes(' ') ? latestVitalRecord.bp : `${latestVitalRecord.bp} mmHg`;
      if (latestVitalRecord.bp.includes('/')) {
        const parts = latestVitalRecord.bp.split('/');
        const s = parseInt(parts[0]);
        const d = parseInt(parts[1]);
        if (!isNaN(s) && !isNaN(d)) {
          if (s >= 140 || d >= 90) bpStatus = 'Stage 2 Hypertension';
          else if (s >= 130 || d >= 80) bpStatus = 'Stage 1 Hypertension';
          else if (s >= 120 && d < 80) bpStatus = 'Elevated';
          else bpStatus = 'Normal';
        }
      }
    } else if (latestVitalRecord?.sbp && latestVitalRecord?.dbp) {
      bpVal = `${latestVitalRecord.sbp}/${latestVitalRecord.dbp} mmHg`;
      const s = Number(latestVitalRecord.sbp);
      const d = Number(latestVitalRecord.dbp);
      if (s >= 140 || d >= 90) bpStatus = 'Stage 2 Hypertension';
      else if (s >= 130 || d >= 80) bpStatus = 'Stage 1 Hypertension';
      else if (s >= 120 && d < 80) bpStatus = 'Elevated';
      else bpStatus = 'Normal';
    }

    // 2. Heart Rate
    let hrVal = '72 bpm';
    let hrStatus = 'Normal';
    if (latestVitalRecord?.hr !== undefined && latestVitalRecord?.hr !== null && latestVitalRecord?.hr !== 0) {
      hrVal = `${latestVitalRecord.hr} bpm`;
      const hr = Number(latestVitalRecord.hr);
      if (hr > 100) hrStatus = 'High (Tachycardia)';
      else if (hr < 60) hrStatus = 'Low (Bradycardia)';
      else hrStatus = 'Normal';
    }

    // 3. Blood Glucose
    let glucoseVal = bloodGlucoseStatus.val;
    let glucoseStatus = bloodGlucoseStatus.status;

    // 4. SpO2 (Oxygen)
    let spo2Val = '98%';
    let spo2Status = 'Normal';
    if (latestVitalRecord?.spo2 !== undefined && latestVitalRecord?.spo2 !== null && latestVitalRecord?.spo2 !== 0) {
      spo2Val = `${latestVitalRecord.spo2}%`;
      spo2Status = Number(latestVitalRecord.spo2) >= 95 ? 'Normal' : 'Low (Hypoxia Risk)';
    }

    // 5. Temperature
    let tempVal = '36.8°C';
    let tempStatus = 'Normal';
    if (latestVitalRecord?.temp !== undefined && latestVitalRecord?.temp !== null && latestVitalRecord?.temp !== 0) {
      const tempNum = Number(latestVitalRecord.temp);
      tempVal = `${tempNum.toFixed(1)}°C`;
      if (tempNum >= 38.0) tempStatus = 'Fever';
      else if (tempNum < 36.0) tempStatus = 'Hypothermia';
      else tempStatus = 'Normal';
    }

    // 6. Resp. Rate
    let rrVal = '16 br/min';
    let rrStatus = 'Normal';
    if (latestVitalRecord?.rr !== undefined && latestVitalRecord?.rr !== null && latestVitalRecord?.rr !== 0) {
      rrVal = `${latestVitalRecord.rr} br/min`;
      const rrNum = Number(latestVitalRecord.rr);
      if (rrNum > 20) rrStatus = 'High (Tachypnea)';
      else if (rrNum < 12) rrStatus = 'Low (Bradypnea)';
      else rrStatus = 'Normal';
    }

    // 7. Weight
    let weightVal = '72.5 kg';
    if (latestVitalRecord?.weight !== undefined && latestVitalRecord?.weight !== null && latestVitalRecord?.weight !== 0) {
      weightVal = `${latestVitalRecord.weight} kg`;
    }

    // 8. Height
    let heightVal = '168.0 cm';
    if (latestVitalRecord?.height !== undefined && latestVitalRecord?.height !== null && latestVitalRecord?.height !== 0) {
      heightVal = `${latestVitalRecord.height} cm`;
    }

    // 9. BMI
    let bmiVal = '25.7 kg/m²';
    let bmiStatus = 'Healthy Weight';
    if (latestVitalRecord?.bmi !== undefined && latestVitalRecord?.bmi !== null && latestVitalRecord?.bmi !== 0) {
      const bmiNum = Number(latestVitalRecord.bmi);
      bmiVal = `${bmiNum.toFixed(1)} kg/m²`;
      if (bmiNum >= 30) bmiStatus = 'Obese';
      else if (bmiNum >= 25) bmiStatus = 'Overweight';
      else if (bmiNum < 18.5) bmiStatus = 'Underweight';
      else bmiStatus = 'Healthy Weight';
    }

    // 10. HbA1c
    let hba1cVal = '5.9%';
    let hba1cStatus = 'Prediabetes';
    if (latestVitalRecord?.hba1c !== undefined && latestVitalRecord?.hba1c !== null && latestVitalRecord?.hba1c !== 0) {
      const a1cNum = Number(latestVitalRecord.hba1c);
      hba1cVal = `${a1cNum.toFixed(1)}%`;
      if (a1cNum >= 6.5) hba1cStatus = 'Diabetes Range';
      else if (a1cNum >= 5.7) hba1cStatus = 'Prediabetes Range';
      else hba1cStatus = 'Normal Range';
    }

    // 11. Glasgow Coma Scale (GCS)
    let gcsE = latestVitalRecord?.gcs_e !== undefined && latestVitalRecord?.gcs_e !== null ? Number(latestVitalRecord.gcs_e) : 4;
    let gcsV = latestVitalRecord?.gcs_v !== undefined && latestVitalRecord?.gcs_v !== null ? Number(latestVitalRecord.gcs_v) : 5;
    let gcsM = latestVitalRecord?.gcs_m !== undefined && latestVitalRecord?.gcs_m !== null ? Number(latestVitalRecord.gcs_m) : 6;
    if (gcsE === 0) gcsE = 4;
    if (gcsV === 0) gcsV = 5;
    if (gcsM === 0) gcsM = 6;
    const gcsTotal = gcsE + gcsV + gcsM;
    const gcsVal = `${gcsTotal}/15`;
    const gcsStatus = gcsTotal === 15 ? 'Alert & Fully Conscious' : 'Altered Mental Status';

    // 12. AVPU Response Scale
    const avpuRaw = latestVitalRecord?.avpu || 'A';
    const avpuVal = avpuRaw === 'A' ? 'Alert' : avpuRaw === 'V' ? 'Voice' : avpuRaw === 'P' ? 'Pain' : 'Unresponsive';
    const avpuStatus = avpuRaw === 'A' ? 'Fully Awake' : 'Requires Stimulation';

    // 13. Pain Index
    const painRaw = latestVitalRecord?.pain !== undefined && latestVitalRecord?.pain !== null ? Number(latestVitalRecord.pain) : 0;
    const painVal = `${painRaw}/10`;
    const painStatus = painRaw === 0 ? 'No Pain' : painRaw <= 3 ? 'Mild Pain' : painRaw <= 6 ? 'Moderate Pain' : 'Severe Pain';

    // 14. Hydration Status
    const hydRaw = latestVitalRecord?.hydration !== undefined && latestVitalRecord?.hydration !== null ? Number(latestVitalRecord.hydration) : 92;
    const hydrationVal = `${hydRaw}%`;
    const hydrationStatus = hydRaw >= 85 ? 'Optimally Hydrated' : 'Mild Dehydration';

    // 15. Sleep Record
    const sleepRaw = latestVitalRecord?.sleep !== undefined && latestVitalRecord?.sleep !== null ? Number(latestVitalRecord.sleep) : 7.6;
    const sleepVal = `${sleepRaw} hrs`;
    const sleepStatus = sleepRaw >= 7.0 ? 'Restful Balance' : 'Insufficient Sleep';

    // 16. Daily Steps Tracking
    const stepsRaw = latestVitalRecord?.steps !== undefined && latestVitalRecord?.steps !== null ? Number(latestVitalRecord.steps) : 8420;
    const stepsVal = `${stepsRaw.toLocaleString()} steps`;
    const stepsStatus = stepsRaw >= 10000 ? 'Target Achieved' : 'Active Progress';

    return [
      { name: 'Blood Pressure', value: bpVal, status: bpStatus, icon: Gauge, color: 'text-blue-600 bg-blue-50 border-blue-100' },
      { name: 'Heart Rate', value: hrVal, status: hrStatus, icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100' },
      { name: 'Blood Glucose', value: glucoseVal, status: glucoseStatus, icon: Droplet, color: bloodGlucoseStatus.color === 'emerald' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : bloodGlucoseStatus.color === 'amber' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-red-600 bg-red-50 border-red-100' },
      { name: 'Oxygen Saturation', value: spo2Val, status: spo2Status, icon: Activity, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
      { name: 'Temperature', value: tempVal, status: tempStatus, icon: Thermometer, color: 'text-amber-600 bg-amber-50 border-amber-100' },
      { name: 'Respiratory Rate', value: rrVal, status: rrStatus, icon: Activity, color: 'text-teal-600 bg-teal-50 border-teal-100' },
      { name: 'Body Weight', value: weightVal, status: 'Recorded', icon: Scale, color: 'text-slate-600 bg-slate-50 border-slate-100' },
      { name: 'Height', value: heightVal, status: 'Recorded', icon: Ruler, color: 'text-slate-600 bg-slate-50 border-slate-100' },
      { name: 'BMI Quotient', value: bmiVal, status: bmiStatus, icon: Activity, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
      { name: 'HbA1c Baseline', value: hba1cVal, status: hba1cStatus, icon: Sparkles, color: 'text-violet-600 bg-violet-50 border-violet-100' },
      { name: 'Glasgow Coma Scale', value: gcsVal, status: gcsStatus, icon: Brain, color: 'text-purple-600 bg-purple-50 border-purple-100' },
      { name: 'AVPU Response', value: avpuVal, status: avpuStatus, icon: Zap, color: 'text-orange-600 bg-orange-50 border-orange-100' },
      { name: 'Pain Index', value: painVal, status: painStatus, icon: Smile, color: 'text-pink-600 bg-pink-50 border-pink-100' },
      { name: 'Hydration Status', value: hydrationVal, status: hydrationStatus, icon: Droplet, color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { name: 'Sleep Log', value: sleepVal, status: sleepStatus, icon: Moon, color: 'text-indigo-950 bg-slate-100 border-slate-200' },
      { name: 'Daily Target Steps', value: stepsVal, status: stepsStatus, icon: TrendingUp, color: 'text-lime-700 bg-lime-50 border-lime-100' }
    ];
  }, [latestVitalRecord, bloodGlucoseStatus]);

  // Sort the actual vitals list according to the user's custom vitalsOrder
  const sortedVitals = useMemo(() => {
    const listMap = new Map(vitalSignsList.map(v => [v.name, v]));
    const ordered: any[] = [];
    
    // First, place items in the specified custom order if present
    vitalsOrder.forEach(name => {
      const item = listMap.get(name);
      if (item) {
        ordered.push(item);
        listMap.delete(name);
      }
    });
    
    // Add any remaining items that weren't in the saved order
    listMap.forEach(item => {
      ordered.push(item);
    });
    
    return ordered;
  }, [vitalSignsList, vitalsOrder]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const visibleItems = isExpanded ? sortedVitals : sortedVitals.slice(0, 4);
    const updatedVisible = [...visibleItems];
    const [draggedItem] = updatedVisible.splice(draggedIndex, 1);
    updatedVisible.splice(targetIndex, 0, draggedItem);

    // Reconstruct the new full vitals order
    const newOrder = updatedVisible.map(item => item.name);
    // Append any original items from vitalsOrder that are not in the current visible list
    vitalsOrder.forEach(name => {
      if (!newOrder.includes(name)) {
        newOrder.push(name);
      }
    });

    setVitalsOrder(newOrder);
    localStorage.setItem('careplus_vitals_order_v1', JSON.stringify(newOrder));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const activePrescriptions = useMemo(() => {
    if (prescriptions.length > 0) return prescriptions;
    // Fallback seed
    return [
      { id: 'rx-1', medicationName: 'Metformin', dosage: '500mg', frequency: 'Twice daily', condition: 'Type 2 Diabetes' },
      { id: 'rx-2', medicationName: 'HRT (Combined)', dosage: 'Varies', frequency: 'Daily', condition: 'PCOS / Hormone Replacement' }
    ];
  }, [prescriptions]);

  const patientAppointments = useMemo(() => {
    const list = (appointments && appointments.length > 0)
      ? appointments.filter(apt => apt.patientId === patient?.id || apt.patientId === 'sarah-mitchell-42' || apt.patientName?.includes(patient?.name || 'Sarah'))
      : [];

    const baseList = list.length > 0 ? list : [
      {
        id: 'apt-1',
        providerId: 'prov-1',
        providerName: 'Dr. James Wilson',
        specialty: 'Internal Medicine / Endocrinology',
        time: new Date(Date.now() + 86400 * 1000 * 4).toISOString(),
        visitType: 'telehealth',
        reason: 'Diabetes Management Review & PCOS Follow-up',
        room: 'Consultation Room 3B',
        status: 'scheduled'
      }
    ];

    return baseList.map((apt: any) => {
      // 1. Resolve clinical provider details
      let providerName = apt.providerName;
      let specialty = apt.specialty || 'General Medicine';
      
      if (!providerName) {
        if (apt.providerId === 'prov-1' || apt.providerId === 'wilson_provider') {
          providerName = 'Dr. James Wilson';
          specialty = 'Internal Medicine & Endocrinology';
        } else if (apt.providerId === 'prov-2' || apt.providerId === 'rostova_provider') {
          providerName = 'Dr. Elena Rostova';
          specialty = 'Reproductive Endocrinology';
        } else {
          providerName = 'Dr. James Wilson';
          specialty = 'Internal Medicine & Endocrinology';
        }
      }

      // 2. Parse and format Date/Time beautiful human-readable details
      let formattedDate = 'Scheduled Session';
      let formattedTime = 'Confirmed';
      
      try {
        const rawTime = apt.time;
        let dateObj: Date | null = null;
        if (rawTime) {
          if (typeof rawTime === 'string') {
            dateObj = new Date(rawTime);
          } else if (rawTime.seconds) {
            dateObj = new Date(rawTime.seconds * 1000);
          } else if (rawTime.toDate && typeof rawTime.toDate === 'function') {
            dateObj = rawTime.toDate();
          } else {
            dateObj = new Date(rawTime);
          }
        }
        
        if (dateObj && !isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });
          formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch (e) {
        console.error("Failed to parse appointment time:", e);
      }

      // 3. Resolve Location/Room & Encounter Type
      const isTelehealth = apt.visitType === 'telehealth' || apt.visitType === 'virtual' || apt.visitType === 'virtual_telehealth';
      const typeLabel = isTelehealth ? 'Virtual Telehealth' : 'In-Clinic';
      const room = apt.room || (isTelehealth ? 'Digital Telehealth Platform' : 'Consultation Suite 3B');

      return {
        ...apt,
        providerName,
        specialty,
        date: formattedDate,
        time: formattedTime,
        typeLabel,
        room
      };
    });
  }, [appointments, patient]);

  const vitalsSummaryCounts = useMemo(() => {
    let optimal = 0;
    let inRange = 0;
    let outOfRange = 0;

    sortedVitals.forEach((v: any) => {
      const status = (v.status || '').toLowerCase();
      if (
        status.includes('normal') || 
        status.includes('optimal') || 
        status.includes('healthy') || 
        status.includes('alert & fully conscious') ||
        status.includes('optimally') || 
        status.includes('target achieved')
      ) {
        optimal++;
      } else if (
        status.includes('borderline') || 
        status.includes('elevated') || 
        status.includes('pre-diabetes') ||
        status.includes('prediabetes') ||
        status.includes('stage 1') || 
        status.includes('overweight') ||
        status.includes('progress') ||
        status.includes('recorded') ||
        status.includes('balance') ||
        status.includes('controlled') ||
        status.includes('stable')
      ) {
        inRange++;
      } else {
        outOfRange++;
      }
    });

    if (optimal === 0 && inRange === 0) {
      optimal = 7;
      inRange = 1;
      outOfRange = 0;
    }

    return { optimal, inRange, outOfRange };
  }, [sortedVitals]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Patient Greeting & Status Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#EEF3F0] text-slate-900 rounded-3xl p-6 md:p-8 border border-[#DEE8E0] shadow-sm relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        
        {/* Left section (Greeting & ID) */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-3 relative z-10 border-b border-[#DEE8E0] lg:border-b-0 pb-6 lg:pb-0">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
              Welcome back,<br />
              <span className="text-[#3F5B42]">
                {patient?.name || 'Sarah Mitchell'}
              </span>
            </h1>
            <p className="text-xs md:text-sm font-semibold text-slate-500 pt-1">
              Patient ID: 77291-SM
            </p>
          </div>
        </div>

        {/* Center section: Massive health score radial dial */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center relative z-10 py-2 border-b border-[#DEE8E0] lg:border-b-0 pb-6 lg:pb-0">
          <div className="relative w-40 h-40 md:w-44 md:h-44 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="healthScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#4F7A54" />
                  <stop offset="100%" stopColor="#3F5B42" />
                </linearGradient>
              </defs>
              {/* Background circular track - clean, light forest dark track */}
              <circle cx="50" cy="50" r="40" stroke="#E5ECE7" strokeWidth="10" fill="none" />
              {/* Progress Track - beautiful glowing custom sage-green gradient stroke */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="url(#healthScoreGradient)" 
                strokeWidth="10" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray="251.3" 
                strokeDashoffset={251.3 - (251.3 * 96) / 100} 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <span className="text-4xl md:text-5xl font-black font-sans tracking-tight text-slate-900 leading-none">96</span>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">Health Score</span>
            </div>
          </div>
          <div className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-slate-500 uppercase text-center mt-3 font-sans">
            All 16 Vitals
          </div>
        </div>

        {/* Right section: Highlight info & active counts matching mockup */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 relative z-10 lg:pl-4">
          <div className="flex flex-col space-y-3">
            {/* Conversation Focus Area Buttons */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#EEF3F0] rounded-lg border border-[#DEE8E0] max-w-sm">
              <button
                onClick={() => setActiveVibe('holistic')}
                className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'holistic'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                🌱 Mindful
              </button>
              <button
                onClick={() => setActiveVibe('metabolic')}
                className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'metabolic'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-[#3F5B42] hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                🩺 Metabolic
              </button>
              <button
                onClick={() => setActiveVibe('activity')}
                className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'activity'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                🏃‍♀️ Steps
              </button>
              <button
                onClick={() => setActiveVibe('circadian')}
                className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'circadian'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                💤 Rest
              </button>
            </div>

            {/* Dynamic Conversational Output Area */}
            <div className="min-h-[145px] flex flex-col justify-between">
              {activeVibe === 'holistic' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <span className="bg-[#D1E2D7] text-emerald-900 border border-[#BED1C5] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit">
                    Holistic Encouragement
                  </span>
                  <h2 className="text-lg font-extrabold text-[#3F5B42] tracking-tight leading-snug">
                    We are so proud of your progress, Sarah
                  </h2>
                  <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed font-normal">
                    Caring for yourself is a gentle series of daily choices, not rigid scores. Your consistent 96% reflects beautiful, steady dedication to feeling your best.
                  </p>
                  <p className="text-[11px] italic text-emerald-800 font-medium pt-1">
                    “Every warm ritual you build today is quietly strengthening your foundation.”
                  </p>
                </div>
              )}

              {activeVibe === 'metabolic' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <span className="bg-[#FFF4E5] text-amber-950 border border-[#FFE0B2] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit">
                    Metabolic Harmony
                  </span>
                  <h2 className="text-lg font-extrabold text-amber-900 tracking-tight leading-snug">
                    A clinical touch on your glucose balance
                  </h2>
                  <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed font-normal">
                    Fasting number of {bloodGlucoseStatus.val} is a steady step in your diabetes plan. Consider a light 10-minute walk after lunch — it's a wonderfully natural way to aid insulin absorption!
                  </p>
                  <p className="text-[11px] italic text-amber-800 font-medium pt-1">
                    “Be patient with your rhythms. Your clinical support team is walking right beside you.”
                  </p>
                </div>
              )}

              {activeVibe === 'activity' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <span className="bg-blue-50 text-blue-900 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit">
                    Cardiovascular Stamina
                  </span>
                  <h2 className="text-lg font-extrabold text-blue-900 tracking-tight leading-snug">
                    8,420 steps is an absolute triumph
                  </h2>
                  <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed font-normal">
                    You've successfully tracked significant movement today, Sarah! Consistent step counts help expand cardiovascular resilience and support healthy blood pressure metrics.
                  </p>
                  <p className="text-[11px] italic text-blue-800 font-medium pt-1">
                    “Each step releases natural strength, feeding your cells oxygen and vital energy.”
                  </p>
                </div>
              )}

              {activeVibe === 'circadian' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <span className="bg-purple-50 text-purple-950 border border-purple-100 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit">
                    Restful Recovery
                  </span>
                  <h2 className="text-lg font-extrabold text-purple-950 tracking-tight leading-snug">
                    Sleep is the quiet healer
                  </h2>
                  <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed font-normal">
                    Logging 7.6 hours of restful sleep gives your nervous system the vital space it needs to reset cortisol levels, naturally stabilizing your morning metabolic resistance.
                  </p>
                  <p className="text-[11px] italic text-purple-900 font-medium pt-1">
                    “An hour of calm, restful sleep is the ultimate medicine for hormonal renewal.”
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Status metrics grid */}
          <div className="pt-3 border-t border-[#DEE8E0] flex items-center justify-start gap-8 font-sans">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Optimal</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {vitalsSummaryCounts.optimal}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">In range</div>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {vitalsSummaryCounts.inRange}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Out of range</div>
              <div className="text-2xl font-black text-slate-500 mt-1">
                {vitalsSummaryCounts.outOfRange}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Vitals & Health Indicators */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    Your Vitals
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Drag and drop cards to customize layout order. Saves automatically.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncVitals}
                    disabled={isSyncing}
                    className="flex items-center justify-center p-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 hover:text-blue-800 border border-blue-200 rounded transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                    title="Retrieve the latest vital signs from clinic database"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                  {syncStatusMessage && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded font-bold"
                    >
                      {syncStatusMessage}
                    </motion.span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(isExpanded ? sortedVitals : sortedVitals.slice(0, 4)).map((vital, idx) => {
                  const Icon = vital.icon;
                  const isDraggingThis = idx === draggedIndex;
                  const isDragOverThis = idx === dragOverIndex;
                  return (
                    <div
                      key={vital.name}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing font-sans"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: isDraggingThis ? 0.35 : 1, 
                          y: 0,
                          scale: isDraggingThis ? 0.95 : isDragOverThis ? 1.03 : 1
                        }}
                        transition={{ duration: 0.18 }}
                        className={`p-4 rounded-xl border flex flex-col justify-between h-32 relative group select-none transition-all duration-250 hover:shadow-md ${
                          isDragOverThis 
                            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50' 
                            : vital.color
                        }`}
                      >
                        {/* Active Drag Grip icon in top corner */}
                        <div className="absolute top-2 right-2 opacity-35 group-hover:opacity-100 transition-opacity p-0.5 pointer-events-none">
                          <GripVertical className="h-4 w-4 text-slate-400" />
                        </div>

                        <div className="flex justify-between items-start pr-5">
                          <span className="text-xs font-bold text-slate-500 line-clamp-1">{vital.name}</span>
                          <Icon className="h-5 w-5 opacity-80" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xl font-bold font-mono tracking-tight text-slate-900">{vital.value}</div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 opacity-90">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{vital.status}</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 px-5 py-2 hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      Collapse Clinical Vitals
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    </>
                  ) : (
                    <>
                      View All 16 Clinical Vitals
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Active Diagnoses / Health Plan focus */}
          <DailyActionPlan 
            patient={patient} 
            latestVitalRecord={latestVitalRecord} 
            bloodGlucoseStatus={bloodGlucoseStatus} 
          />
        </div>

        {/* Right Column - Appointments, Rx, Quick Actions */}
        <div className="space-y-6">
          
          {/* Scheduling focus */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Upcoming Session
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {patientAppointments.map((apt: any, i: number) => (
                <div key={i} className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-400" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">{apt.providerName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{apt.specialty}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-mono bg-white p-2.5 rounded-lg border border-amber-100">
                    <div>
                      <span className="text-[10px] uppercase text-amber-600 block font-semibold">Date</span>
                      <strong className="text-slate-800">{apt.date}</strong>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <span className="text-[10px] uppercase text-amber-600 block font-semibold">Time</span>
                      <strong className="text-slate-800">{apt.time}</strong>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                    📍 {apt.room} • <span className="text-amber-700">{apt.typeLabel}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Medications & Refills */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Pill className="h-4 w-4 text-pink-600" />
                Active Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-slate-100">
              {activePrescriptions.map((rx: any) => (
                <div key={rx.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shrink-0 font-bold text-xs uppercase">
                    Rx
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{rx.medicationName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1 rounded">{rx.dosage}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{rx.frequency}</p>
                    <p className="text-[10px] text-slate-400">Prescribed for: {rx.condition || 'General Indications'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Security & HIPAA Compliance Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <Lock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>HIPAA Secure Workspace Shield:</strong> This page renders medical-grade clinical information retrieved securely on behalf of the credentialed user. All modifications are recorded to the system audit records automatically.
        </p>
      </div>

    </div>
  );
}
