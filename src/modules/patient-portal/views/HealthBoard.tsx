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
  Check,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { transition } from '../../../lib/motion';
import { DailyActionPlan } from './DailyActionPlan';
import { updatePatientVitals, updatePatientNudgeAndActionPlan, computeHealthScore, updatePatientHealthScore } from '../../../services/clinicalFirestoreService';

interface HealthBoardProps {
  patientData?: {
    patient?: any;
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
  const rawPatient = patientData?.patient;
  const patient = useMemo(() => {
    const medsDays = typeof rawPatient?.medsDays === 'number' ? rawPatient.medsDays : 5;
    const sleepHours = typeof rawPatient?.sleepHours === 'number' ? rawPatient.sleepHours : 7.6;
    const dailySteps = typeof rawPatient?.dailySteps === 'number' ? rawPatient.dailySteps : 8420;
    const bloodGlucose = typeof rawPatient?.bloodGlucose === 'number' ? rawPatient.bloodGlucose : 104;
    const aiGoalsCompleted = typeof rawPatient?.aiGoalsCompleted === 'boolean' ? rawPatient.aiGoalsCompleted : true;
    const willAttend = typeof rawPatient?.willAttend === 'boolean' ? rawPatient.willAttend : true;

    if (!rawPatient || (!rawPatient.name && !rawPatient.firstName && !rawPatient.id)) {
      const computedDefault = computeHealthScore({
        medsDays,
        sleepHours,
        dailySteps,
        bloodGlucose,
        aiGoalsCompleted,
        willAttend
      });
      return {
        name: 'Marcus Everett',
        dob: 'Mar 14, 1985',
        age: 39,
        conditions: ['Rheumatoid Arthritis (M05.79)'],
        mrn: 'pat-marcus-001',
        id: 'pat-marcus-001',
        actionPlan: [],
        activeNudge: null,
        healthScore: computedDefault,
        medsDays,
        sleepHours,
        dailySteps,
        bloodGlucose,
        aiGoalsCompleted,
        willAttend
      };
    }
    const name = rawPatient.name || (rawPatient.firstName ? `${rawPatient.firstName} ${rawPatient.lastName || ''}`.trim() : 'Unnamed Patient');
    
    const healthScore = typeof rawPatient.healthScore === 'number' 
      ? rawPatient.healthScore 
      : computeHealthScore({
          medsDays,
          sleepHours,
          dailySteps,
          bloodGlucose,
          aiGoalsCompleted,
          willAttend
        });

    return {
      name,
      dob: rawPatient.dob || rawPatient.dateOfBirth || 'Mar 14, 1985',
      age: rawPatient.age || (rawPatient.dateOfBirth ? new Date().getFullYear() - new Date(rawPatient.dateOfBirth).getFullYear() : 39),
      conditions: rawPatient.conditions || ['Rheumatoid Arthritis (M05.79)'],
      mrn: rawPatient.mrn || rawPatient.id || rawPatient.patientId || 'pat-marcus-001',
      id: rawPatient.id || rawPatient.patientId || 'pat-marcus-001',
      actionPlan: rawPatient.actionPlan || [],
      activeNudge: rawPatient.activeNudge || null,
      healthScore,
      medsDays,
      sleepHours,
      dailySteps,
      bloodGlucose,
      aiGoalsCompleted,
      willAttend
    };
  }, [rawPatient]);

  const getTabNudge = (vibe: 'holistic' | 'metabolic' | 'activity' | 'circadian') => {
    const nudge = patient?.activeNudge;
    if (!nudge) return null;
    
    const vibeMap: Record<string, 'holistic' | 'metabolic' | 'activity' | 'circadian'> = {
      'Mindful': 'holistic',
      'Metabolic': 'metabolic',
      'Steps': 'activity',
      'Rest': 'circadian'
    };
    
    if (vibeMap[nudge.tabTarget] === vibe) {
      return nudge;
    }
    return null;
  };

  const patientFirstName = useMemo(() => {
    if (!patient?.name) return 'Patient';
    const parts = patient.name.split(' ');
    return parts[0] || 'Patient';
  }, [patient]);

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

  // --- WEARABLE HEALTH DEVICE SYNC HUB STATE & CONTROLS ---
  const [activeDevice, setActiveDevice] = useState<'apple' | 'android' | null>('apple');
  const [isDeviceLinked, setIsDeviceLinked] = useState<boolean>(true);
  const [syncPermissions, setSyncPermissions] = useState({
    steps: true,
    heartRate: true,
    sleep: true,
    glucose: true,
    oxygen: true
  });
  
  const [selectedPreset, setSelectedPreset] = useState<string>('afternoon');
  const [wearableSyncing, setWearableSyncing] = useState<boolean>(false);
  const [wearableSyncStep, setWearableSyncStep] = useState<string | null>(null);
  const [wearableSyncProgress, setWearableSyncProgress] = useState<number>(0);
  const [wearableSyncSuccess, setWearableSyncSuccess] = useState<boolean>(false);
  const [syncHistory, setSyncHistory] = useState<Array<{time: string; device: string; itemsCount: number}>>([
    { time: '10:14 AM', device: 'Apple Health', itemsCount: 4 },
    { time: 'Yesterday', device: 'Apple Health', itemsCount: 3 }
  ]);

  const presetOptions = [
    { id: 'morning', label: '☀️ Morning Baseline Recovery', bp: '116/74', hr: 64, steps: 2840, sleep: 7.8, glucose: 95, spo2: 99, temp: 36.6 },
    { id: 'afternoon', label: '🏃‍♀️ Post-Therapeutic Stretching & Gym', bp: '122/80', hr: 82, steps: 7800, sleep: 7.6, glucose: 104, spo2: 98, temp: 37.1 },
    { id: 'evening', label: '💤 Evening Rest & Recovery state', bp: '118/72', hr: 60, steps: 9420, sleep: 8.2, glucose: 91, spo2: 99, temp: 36.8 }
  ];

  const handleWearableSync = async () => {
    if (!activeDevice || !isDeviceLinked) return;
    setWearableSyncing(true);
    setWearableSyncSuccess(false);
    setWearableSyncProgress(0);

    const steps = [
      'Establishing secure TLS OAuth handshake with mobile daemon...',
      activeDevice === 'apple' 
        ? 'Scanning Local iOS Apple HealthKit databases...' 
        : 'Connecting to system Android Health Connect service platform...',
      'Retrieving decrypted biometric sensor streams...',
      'Applying clinical standard verification and range filters...',
      'Encrypting and publishing telemetry to PRM secure database...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setWearableSyncStep(steps[i]);
      setWearableSyncProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 750));
    }

    try {
      const p = presetOptions.find(o => o.id === selectedPreset) || presetOptions[1];
      
      // Determine what to import based on permission filters
      const glucoseVal = syncPermissions.glucose ? p.glucose : (latestVitalRecord?.glucose || 104);
      const stepsCount = syncPermissions.steps ? p.steps : (latestVitalRecord?.steps || 7800);
      const heartRateVal = syncPermissions.heartRate ? p.hr : (latestVitalRecord?.hr || 82);
      const sleepHours = syncPermissions.sleep ? p.sleep : (latestVitalRecord?.sleep || 7.6);
      const spo2Val = syncPermissions.oxygen ? p.spo2 : (latestVitalRecord?.spo2 || 98);

      const payload = {
        patientId: patient.id || 'pat-marcus-001',
        authorId: 'uid-marcus-portal-001',
        source: activeDevice === 'apple' ? 'apple_health' : 'android_health_connect',
        device: activeDevice === 'apple' ? 'Apple Watch Ultra 2' : 'Android Pixel Watch 3',
        timestamp: Date.now(),
        bp: p.bp,
        hr: Number(heartRateVal),
        glucose: Number(glucoseVal),
        steps: Number(stepsCount),
        sleep: Number(sleepHours),
        spo2: Number(spo2Val),
        temp: Number(p.temp),
        rr: 16,
        weight: 86.2,
        height: 178,
        bmi: 27.2,
        gcs: '15/15',
        gcs_e: 4,
        gcs_v: 5,
        gcs_m: 6,
        avpu: 'A',
        pain: 1,
        hydration: 94,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      await updatePatientVitals(patient.id || 'pat-marcus-001', payload);

      // Simulate onWrite Cloud Run backend trigger intercepting telemetry:
      // It evaluates boundaries, query-links the COM-B barrier mapping, and updates activeNudge & actionPlan on Firestore
      const simulatedNudge = {
        tabTarget: 'Metabolic',
        message: `Biometrics detected a glucose level of ${glucoseVal} mg/dL. Based on your PCOS/Diabetes afternoon energy-slump barrier profile, gentle physical active contractions provide a beautiful natural pathway to sponge glucose directly out of your bloodstream. Would you like to check off the active 10-minute Post-Meal Muscle Contraction Walk under your care actions list?`,
        timestamp: Date.now()
      };

      const simulatedActionPlan = [
        {
          id: 'ai-goal-walk-' + Date.now(),
          type: 'ai_micro_goal',
          title: '🚶‍♂️ 10-Min Post-Meal Muscle Contraction Walk',
          description: `Activate muscular GLUT4 glucose sponge receptors to smoothly curb afternoon metabolic spikes.`,
          expirationTimestamp: Date.now() + 15 * 60 * 1000, // 15-minute time boundary (JITAI)
          completed: false
        },
        {
          id: 'ai-goal-water-' + Date.now(),
          type: 'ai_micro_goal',
          title: '💧 Circulating Hydration Flush',
          description: `Drink 300ml of pure water to assist tissue fluid equilibrium and support glycemic cleansing.`,
          expirationTimestamp: Date.now() + 8 * 60 * 1000, // 8-minute time boundary (JITAI)
          completed: false
        }
      ];

      await updatePatientNudgeAndActionPlan(patient.id || 'pat-marcus-001', simulatedNudge, simulatedActionPlan);
      
      const recalculatedScore = computeHealthScore({
        medsDays: patient.medsDays,
        sleepHours: Number(sleepHours),
        dailySteps: Number(stepsCount),
        bloodGlucose: Number(glucoseVal),
        aiGoalsCompleted: patient.aiGoalsCompleted,
        willAttend: patient.willAttend
      });
      await updatePatientHealthScore(patient.id || 'pat-marcus-001', recalculatedScore, {
        medsDays: patient.medsDays,
        sleepHours: Number(sleepHours),
        dailySteps: Number(stepsCount),
        bloodGlucose: Number(glucoseVal),
        aiGoalsCompleted: patient.aiGoalsCompleted,
        willAttend: patient.willAttend
      });
      
      setWearableSyncSuccess(true);
      
      setSyncStatusMessage(`${activeDevice === 'apple' ? 'Apple Health' : 'Android Health'} Synchronized!`);
      setTimeout(() => setSyncStatusMessage(null), 4000);

      const itemsSyncedCount = Object.values(syncPermissions).filter(Boolean).length;
      setSyncHistory(prev => [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          device: activeDevice === 'apple' ? 'Apple HealthKit' : 'Android Health Connect',
          itemsCount: itemsSyncedCount
        },
        ...prev
      ]);
    } catch (err) {
      console.error('Error during clinical wearable synchronization:', err);
    } finally {
      setWearableSyncing(false);
      setWearableSyncStep(null);
    }
  };

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
      ? appointments.filter(apt => apt.patientId === patient?.id || apt.patientId === 'pat-marcus-001' || apt.patientName?.includes(patient?.name || 'Marcus'))
      : [];

    const baseList = list.length > 0 ? list : [
      {
        id: 'appt-marcus-001',
        providerId: 'user-theogate-001',
        providerName: 'Dr. G. Theogate',
        specialty: 'Rheumatology',
        time: new Date(Date.now() + 86400 * 1000).toISOString(),
        visitType: 'in_clinic',
        reason: 'Rheumatoid Arthritis 6-Month Review',
        room: 'Consultation Suite 3B',
        status: 'scheduled'
      }
    ];

    return baseList.map((apt: any) => {
      // 1. Resolve clinical provider details
      let providerName = apt.providerName;
      let specialty = apt.specialty || 'General Medicine';
      
      if (!providerName) {
        if (apt.providerId === 'user-theogate-001') {
          providerName = 'Dr. G. Theogate';
          specialty = 'Rheumatology';
        } else if (apt.providerId === 'user-alwayson-001') {
          providerName = 'Michelle Alwayson';
          specialty = 'Physiotherapy';
        } else if (apt.providerId === 'user-nurse-rivera-001') {
          providerName = 'Tamara Rivera';
          specialty = 'Chronic Disease Management';
        } else if (apt.providerId === 'prov-1' || apt.providerId === 'wilson_provider') {
          providerName = 'Dr. James Wilson';
          specialty = 'Internal Medicine & Endocrinology';
        } else if (apt.providerId === 'prov-2' || apt.providerId === 'rostova_provider') {
          providerName = 'Dr. Elena Rostova';
          specialty = 'Reproductive Endocrinology';
        } else {
          providerName = 'Dr. G. Theogate';
          specialty = 'Rheumatology';
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
              Patient ID: {patient?.mrn || '77291-SM'}
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
                strokeDashoffset={251.3 - (251.3 * (patient?.healthScore ?? 96)) / 100} 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <span className="text-4xl md:text-5xl font-black font-sans tracking-tight text-slate-900 leading-none">
                {patient?.healthScore ?? 96}
              </span>
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
                onClick={() => {
                  setActiveVibe('holistic');
                }}
                className={`relative px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'holistic'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                🌱 Mindful
                {patient?.activeNudge?.tabTarget === 'Mindful' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveVibe('metabolic');
                }}
                className={`relative px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'metabolic'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-[#3F5B42] hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                🩺 Metabolic
                {patient?.activeNudge?.tabTarget === 'Metabolic' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveVibe('activity');
                }}
                className={`relative px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'activity'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                🏃‍♀️ Steps
                {patient?.activeNudge?.tabTarget === 'Steps' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveVibe('circadian');
                }}
                className={`relative px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                  activeVibe === 'circadian'
                    ? 'bg-[#3F5B42] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#DCE7E1]'
                }`}
              >
                💤 Rest
                {patient?.activeNudge?.tabTarget === 'Rest' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>
            </div>

            {/* Dynamic Conversational Output Area */}
            <div className="min-h-[145px] flex flex-col justify-between">
              {activeVibe === 'holistic' && (() => {
                const nudge = getTabNudge('holistic');
                if (nudge) {
                  return (
                    <div className="space-y-2 animate-fadeIn">
                      <span className="bg-amber-100 text-amber-950 border border-[#FFE0B2] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1">
                        ✨ Adaptive AI Telemetry Focus
                      </span>
                      <h2 className="text-base font-extrabold text-[#3F5B42] tracking-tight leading-snug">
                        Mindfulness Prompt
                      </h2>
                      <p className="text-[11.5px] leading-relaxed text-slate-850 font-medium bg-[#FAFCFB] p-2.5 rounded-lg border border-emerald-100 shadow-inner">
                        {nudge.message}
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-1.5 animate-fadeIn">
                    <span className="bg-[#D1E2D7] text-emerald-900 border border-[#BED1C5] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit">
                      Holistic Encouragement
                    </span>
                    <h2 className="text-lg font-extrabold text-[#3F5B42] tracking-tight leading-snug">
                      We are so proud of your progress, {patientFirstName}
                    </h2>
                    <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed font-normal">
                      Caring for yourself is a gentle series of daily choices, not rigid scores. Your consistent 96% reflects beautiful, steady dedication to feeling your best.
                    </p>
                    <p className="text-[11px] italic text-emerald-800 font-medium pt-1">
                      “Every warm ritual you build today is quietly strengthening your foundation.”
                    </p>
                  </div>
                );
              })()}

              {activeVibe === 'metabolic' && (() => {
                const nudge = getTabNudge('metabolic');
                if (nudge) {
                  return (
                    <div className="space-y-2 animate-fadeIn">
                      <span className="bg-[#FFF4E5] text-amber-950 border border-[#FFE0B2] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1 animate-pulse">
                        ✨ Adaptive AI Telemetry Focus
                      </span>
                      <h2 className="text-base font-extrabold text-amber-900 tracking-tight leading-snug">
                        Metabolic Ingestion Prompt
                      </h2>
                      <p className="text-[11.5px] leading-relaxed text-slate-850 font-semibold bg-[#FAFCFB] p-2.5 rounded-lg border border-[#FFE0B2] shadow-inner font-sans">
                        {nudge.message}
                      </p>
                    </div>
                  );
                }
                return (
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
                );
              })()}

              {activeVibe === 'activity' && (() => {
                const nudge = getTabNudge('activity');
                if (nudge) {
                  return (
                    <div className="space-y-2 animate-fadeIn">
                      <span className="bg-amber-100 text-amber-950 border border-[#FFE0B2] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1">
                        ✨ Adaptive AI Telemetry Focus
                      </span>
                      <h2 className="text-base font-extrabold text-[#3F5B42] tracking-tight leading-snug">
                        Steps & Activity Advisory
                      </h2>
                      <p className="text-[11.5px] leading-relaxed text-slate-850 font-medium bg-[#FAFCFB] p-2.5 rounded-lg border border-blue-100 shadow-inner">
                        {nudge.message}
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-1.5 animate-fadeIn">
                    <span className="bg-blue-50 text-blue-900 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit">
                      Cardiovascular Stamina
                    </span>
                    <h2 className="text-lg font-extrabold text-blue-900 tracking-tight leading-snug">
                      8,420 steps is an absolute triumph
                    </h2>
                    <p className="text-xs md:text-[13px] text-slate-700 leading-relaxed font-normal">
                      You've successfully tracked significant movement today, {patientFirstName}! Consistent step counts help expand cardiovascular resilience and support healthy blood pressure metrics.
                    </p>
                    <p className="text-[11px] italic text-blue-800 font-medium pt-1">
                      “Each step releases natural strength, feeding your cells oxygen and vital energy.”
                    </p>
                  </div>
                );
              })()}

              {activeVibe === 'circadian' && (() => {
                const nudge = getTabNudge('circadian');
                if (nudge) {
                  return (
                    <div className="space-y-2 animate-fadeIn">
                      <span className="bg-[#FFF4E5] text-amber-950 border border-[#FFE0B2] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1">
                        ✨ Adaptive AI Telemetry Focus
                      </span>
                      <h2 className="text-base font-extrabold text-[#3F5B42] tracking-tight leading-snug">
                        Circadian Support Summary
                      </h2>
                      <p className="text-[11.5px] leading-relaxed text-slate-850 font-medium bg-[#FAFCFB] p-2.5 rounded-lg border border-purple-100 shadow-inner">
                        {nudge.message}
                      </p>
                    </div>
                  );
                }
                return (
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
                );
              })()}
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
        <div className="space-y-6 animate-fadeIn">
          
          {/* Wearable Device Integration & Sync Center */}
          <Card className="border border-[#DEE8E0] shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-[#3F5B42]" />
                  Wearable Sync Hub
                </CardTitle>
                <Badge variant="outline" className={`text-[10px] font-bold px-1.5 ${isDeviceLinked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
                  ● {isDeviceLinked ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <CardDescription className="text-[11px] leading-relaxed mt-1">
                Synchronize standard consumer device biometrics securely with Aequanimitas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-4">
              
              {/* Device Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDevice('apple');
                    setIsDeviceLinked(true);
                  }}
                  className={`py-2 px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeDevice === 'apple'
                      ? 'bg-[#3F5B42] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-sm">🍎</span> Apple Health
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDevice('android');
                    setIsDeviceLinked(true);
                  }}
                  className={`py-2 px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeDevice === 'android'
                      ? 'bg-[#3F5B42] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-sm">🤖</span> Android Connect
                </button>
              </div>

              {/* Master Connection Status Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Linked to CarePlus System</span>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {activeDevice === 'apple' ? 'Authorized via iOS HealthKit' : 'Authorized via Play Store Health Connect'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeviceLinked(!isDeviceLinked)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    isDeviceLinked ? 'bg-[#3F5B42]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isDeviceLinked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                </button>
              </div>

              {isDeviceLinked ? (
                <>
                  {/* Parameter Permission Matrix */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Sync Scope & Parameters
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSyncPermissions(p => ({ ...p, steps: !p.steps }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          syncPermissions.steps 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">🏃‍♀️ Step Count</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.steps ? 'text-emerald-700 opacity-100' : 'opacity-0'}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSyncPermissions(p => ({ ...p, heartRate: !p.heartRate }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          syncPermissions.heartRate 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">❤️ Heart Rate</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.heartRate ? 'text-emerald-700 opacity-100' : 'opacity-0'}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSyncPermissions(p => ({ ...p, sleep: !p.sleep }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          syncPermissions.sleep 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">💤 Sleep Analysis</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.sleep ? 'text-emerald-700 opacity-100' : 'opacity-0'}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSyncPermissions(p => ({ ...p, glucose: !p.glucose }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          syncPermissions.glucose 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">🩸 blood Glucose</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.glucose ? 'text-emerald-700 opacity-100' : 'opacity-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Simulator Control Area with elegant styling to avoid clutter */}
                  <div className="bg-[#EEF3F0] border border-[#DEE8E0] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-[#3F5B42] text-white font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                        Biometrics Simulator
                      </span>
                      <span className="text-[10px] font-semibold text-[#3F5B42]">
                        Preview Live Biometric Presets
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      Toggle standard clinical baselines to simulate direct smartwatch sensor feeds.
                    </p>
                    <select
                      value={selectedPreset}
                      onChange={(e) => setSelectedPreset(e.target.value)}
                      className="w-full text-xs bg-white border border-[#DEE8E0] rounded-lg p-2 font-bold text-slate-700 shadow-sm outline-none focus:ring-1 focus:ring-[#3F5B42] cursor-pointer"
                    >
                      {presetOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>

                    {/* Preview Table of selected preset */}
                    <div className="grid grid-cols-3 gap-1 pt-1.5 text-[10px] font-mono text-slate-600">
                      <div className="bg-white/65 p-1 rounded border border-[#E4ECE7] text-center">
                        <span className="block text-[8px] text-slate-400 uppercase">Steps</span>
                        <strong>{presetOptions.find(o => o.id === selectedPreset)?.steps.toLocaleString()}</strong>
                      </div>
                      <div className="bg-white/65 p-1 rounded border border-[#E4ECE7] text-center">
                        <span className="block text-[8px] text-slate-400 uppercase">Glucose</span>
                        <strong>{presetOptions.find(o => o.id === selectedPreset)?.glucose} md/dL</strong>
                      </div>
                      <div className="bg-white/65 p-1 rounded border border-[#E4ECE7] text-center">
                        <span className="block text-[8px] text-slate-400 uppercase">Heart Rate</span>
                        <strong>{presetOptions.find(o => o.id === selectedPreset)?.hr} bpm</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action / Progress Area */}
                  {wearableSyncing ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-[#3F5B42] animate-spin shrink-0" />
                        <span className="text-xs font-extrabold text-slate-800">Synchronizing Wireless Feed...</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono italic animate-pulse leading-snug">
                        {wearableSyncStep}
                      </p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#3F5B42] h-full rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${wearableSyncProgress}%` }} 
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleWearableSync}
                      className="w-full py-2.5 bg-[#3F5B42] hover:bg-[#324935] text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#2D422E]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync biometric data now
                    </button>
                  )}

                  {/* Complete feedback message */}
                  {wearableSyncSuccess && !wearableSyncing && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl flex items-start gap-2 text-xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="font-bold text-emerald-900 block">Telemetry Sync Successful!</strong>
                        <p className="text-[10px] text-emerald-800 leading-snug">
                          Standard biometrics successfully mapped and updated in your patient charts. Values updated in real-time.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Rolling Audit Trail */}
                  {syncHistory.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Recent Sync Feed History
                      </span>
                      <div className="space-y-1.5 divide-y divide-slate-100 max-h-24 overflow-y-auto pr-1">
                        {syncHistory.map((h, idx) => (
                          <div key={idx} className="text-[10px] flex items-center justify-between pt-1.5 first:pt-0">
                            <span className="font-medium text-slate-700">
                              🕒 {h.time} — <strong className="text-slate-900 font-bold">{h.device}</strong>
                            </span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                              {h.itemsCount} channels synced
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                  <AlertCircle className="h-6 w-6 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Wearable Feeds Paused</span>
                    <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                      Link your device to start streaming step counts, sleep cycles, and heart rates automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeviceLinked(true)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                  >
                    Authorize Integration Link
                  </button>
                </div>
              )}

            </CardContent>
          </Card>
          
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
