import { useMemo, useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Pill, 
  Calendar, 
  ShieldAlert, 
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
  RefreshCw,
  Stethoscope,
  ClipboardList,
  Info,
  Check,
  Smartphone,
  AlertCircle,
  Apple,
  Award,
  BookOpen,
  Plus,
  Minus,
  Trash2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  updatePatientVitals, 
  updatePatientNudgeAndActionPlan, 
  computeHealthScore, 
  updatePatientHealthScore, 
  savePatient,
  createRefillRequest
} from '../../../services/clinicalFirestoreService';

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

// Fluent 2 Diagnostic Descriptions
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
    description: 'A chronic metabolic condition with cellular insulin resistance, managed with low-glycemic dietary planning, regular exercise, and medication.',
    status: 'Controlled',
    statusColor: 'bg-[#107c41]/10 text-[#107c41] border-[#107c41]/20',
    managedBy: 'Dr. James Wilson (Endocrinology)',
    targetTitle: 'Target HbA1c',
    targetValue: 'Under 6.5% (Latest: 5.9%)',
    tip: '15-minute walks directly following meals utilize active GLUT4 muscle pathways to naturally sponge excess glucose.',
    icon: Droplet
  },
  'PCOS': {
    friendlyName: 'Polycystic Ovary Syndrome (PCOS)',
    description: 'An endocrine and metabolic profile requiring careful hormone balance and sensitivity management.',
    status: 'Stable',
    statusColor: 'bg-[#0078d4]/10 text-[#0078d4] border-[#0078d4]/20',
    managedBy: 'Dr. Elena Rostova (Reproductive Endocrinology)',
    targetTitle: 'Hormonal Stability',
    targetValue: 'Balanced insulin response limits androgenic indicators',
    tip: 'Resistance workouts are exceptional at resetting insulin response patterns and restoring cyclical rhythm.',
    icon: Brain
  },
  'Rheumatoid Arthritis (M05.79)': {
    friendlyName: 'Rheumatoid Arthritis (M05.79)',
    description: 'Systemic autoimmune inflammatory profile targeting synovial joint tissues symmetric spaces.',
    status: 'Remission',
    statusColor: 'bg-[#107c41]/10 text-[#107c41] border-[#107c41]/20',
    managedBy: 'Dr. G. Theogate (Rheumatology)',
    targetTitle: 'Inflammatory Marker CRP',
    targetValue: 'Target < 5.0 mg/L (Latest: 3.2 mg/L)',
    tip: 'Gentle hand gliding exercises in warm water before bed significantly improves morning kinematic stiffness.',
    icon: Stethoscope
  },
  'Rheumatoid Arthritis': {
    friendlyName: 'Rheumatoid Arthritis',
    description: 'Systemic autoimmune inflammatory profile targeting synovial joint tissues symmetric spaces.',
    status: 'Remission',
    statusColor: 'bg-[#107c41]/10 text-[#107c41] border-[#107c41]/20',
    managedBy: 'Dr. G. Theogate (Rheumatology)',
    targetTitle: 'Inflammatory Marker CRP',
    targetValue: 'Target < 5.0 mg/L (Latest: 3.2 mg/L)',
    tip: 'Gentle hand gliding exercises in warm water before bed significantly improves morning kinematic stiffness.',
    icon: Stethoscope
  }
};

export function HealthBoard({ patientData = {}, appointments = [], onNavigateTab }: HealthBoardProps) {
  // Page Navigation State
  const [activeSubPage, setActiveSubPage] = useState<1 | 2 | 3>(1);

  const rawPatient = patientData?.patient;
  const patient = useMemo(() => {
    const medsDays = typeof rawPatient?.medsDays === 'number' ? rawPatient.medsDays : 5;
    const sleepHours = typeof rawPatient?.sleepHours === 'number' ? rawPatient.sleepHours : 7.6;
    const dailySteps = typeof rawPatient?.dailySteps === 'number' ? rawPatient.dailySteps : 8420;
    const bloodGlucose = typeof rawPatient?.bloodGlucose === 'number' ? rawPatient.bloodGlucose : 104;
    const aiGoalsCompleted = typeof rawPatient?.aiGoalsCompleted === 'boolean' ? rawPatient.aiGoalsCompleted : true;
    const willAttend = typeof rawPatient?.willAttend === 'boolean' ? rawPatient.willAttend : true;

    if (!rawPatient || (!rawPatient.name && !rawPatient.firstName && !rawPatient.id)) {
      const computedDefault = computeHealthScore({ medsDays, sleepHours, dailySteps, bloodGlucose, aiGoalsCompleted, willAttend });
      return {
        name: 'Marcus Alan Everett',
        dob: 'March 14, 1985',
        age: 39,
        conditions: ['Rheumatoid Arthritis (M05.79)', 'Type 2 Diabetes'],
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
        willAttend,
        gender: 'Male • Cisgender Male',
        email: 'marcus.everett@gmail.com',
        phone: '(206) 555-0143'
      };
    }

    const name = rawPatient.name || (rawPatient.firstName ? `${rawPatient.firstName} ${rawPatient.lastName || ''}`.trim() : 'Marcus Alan Everett');
    const healthScore = typeof rawPatient.healthScore === 'number' 
      ? rawPatient.healthScore 
      : computeHealthScore({ medsDays, sleepHours, dailySteps, bloodGlucose, aiGoalsCompleted, willAttend });

    return {
      ...rawPatient,
      name,
      dob: rawPatient.dob || rawPatient.dateOfBirth || 'March 14, 1985',
      age: rawPatient.age || 39,
      conditions: rawPatient.conditions || ['Rheumatoid Arthritis (M05.79)', 'Type 2 Diabetes'],
      mrn: rawPatient.mrn || rawPatient.id || 'pat-marcus-001',
      id: rawPatient.id || 'pat-marcus-001',
      actionPlan: rawPatient.actionPlan || [],
      activeNudge: rawPatient.activeNudge || null,
      healthScore,
      medsDays,
      sleepHours,
      dailySteps,
      bloodGlucose,
      aiGoalsCompleted,
      willAttend,
      gender: rawPatient.gender || 'Male • Cisgender Male',
      email: rawPatient.email || 'marcus.everett@gmail.com',
      phone: rawPatient.phone || '(206) 555-0143'
    };
  }, [rawPatient]);

  const vitals = patientData?.vitals || [];
  const prescriptions = patientData?.prescriptions || [];
  const clinical_records = patientData?.clinical_records || [];

  // Latest single vital entry
  const latestVitalRecord = useMemo(() => {
    if (!vitals || vitals.length === 0) return null;
    return [...vitals].sort((a, b) => {
      const timeA = a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
      const timeB = b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
      return timeB - timeA;
    })[0];
  }, [vitals]);

  // Vitals configuration & pinning
  const [pinnedVitals, setPinnedVitals] = useState<string[]>(['Blood Glucose', 'Blood Pressure', 'Heart Rate', 'Oxygen Saturation']);
  const [showConfigVitals, setShowConfigVitals] = useState(false);

  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fluent_water_glasses');
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const [stressLevel, setStressLevel] = useState<number>(2);
  const [selectedMood, setSelectedMood] = useState<string>('Calm');
  const [newDiaryNote, setNewDiaryNote] = useState('');
  const [diaryNotes, setDiaryNotes] = useState<Array<{id: string; time: string; text: string}>>(() => {
    try {
      const saved = localStorage.getItem('fluent_diary_notes');
      return saved ? JSON.parse(saved) : [
        { id: '1', time: 'June 29, 2026, 8:15 AM', text: 'Stretched for 10 mins this morning. Joint stiffness in fingers was much improved.' },
        { id: '2', time: 'June 28, 2026, 9:30 PM', text: 'Checked blood glucose after dinner. Walked for 15 minutes, level settled at 104 mg/dL.' }
      ];
    } catch {
      return [];
    }
  });

  // Track Refill Requests
  const [submittingRefillId, setSubmittingRefillId] = useState<string | null>(null);
  const [refillSuccessMessage, setRefillSuccessMessage] = useState<string | null>(null);

  // Dynamic Charting states (Page 2)
  const [trendsChartMetric, setTrendsChartMetric] = useState<'glucose' | 'steps' | 'hr'>('glucose');
  const [trendsDuration, setTrendsDuration] = useState<'3m' | '6m'>('3m');

  // Interactive Health Score compliance factors
  const [adherenceMeds, setAdherenceMeds] = useState(true);
  const [adherenceSteps, setAdherenceSteps] = useState(true);
  const [adherenceGlucose, setAdherenceGlucose] = useState(true);
  const [adherenceSleep, setAdherenceSleep] = useState(true);

  // Recalculated health score based on active checklist selections
  const calculatedHealthScore = useMemo(() => {
    let base = 60;
    if (adherenceMeds) base += 10;
    if (adherenceSteps) base += 10;
    if (adherenceGlucose) base += 10;
    if (adherenceSleep) base += 10;
    return base;
  }, [adherenceMeds, adherenceSteps, adherenceGlucose, adherenceSleep]);

  // Update Firestore when patient adjusts score indicators
  const handleToggleAdherenceFactor = async (factor: 'meds' | 'steps' | 'glucose' | 'sleep') => {
    let nextMeds = adherenceMeds;
    let nextSteps = adherenceSteps;
    let nextGlucose = adherenceGlucose;
    let nextSleep = adherenceSleep;

    if (factor === 'meds') { nextMeds = !adherenceMeds; setAdherenceMeds(nextMeds); }
    if (factor === 'steps') { nextSteps = !adherenceSteps; setAdherenceSteps(nextSteps); }
    if (factor === 'glucose') { nextGlucose = !adherenceGlucose; setAdherenceGlucose(nextGlucose); }
    if (factor === 'sleep') { nextSleep = !adherenceSleep; setAdherenceSleep(nextSleep); }

    const nextMedsDays = nextMeds ? 6 : 4;
    const nextStepsCount = nextSteps ? 9000 : 5000;
    const nextGlucoseVal = nextGlucose ? 95 : 135;
    const nextSleepVal = nextSleep ? 7.8 : 6.1;

    const newRecalculatedScore = computeHealthScore({
      medsDays: nextMedsDays,
      sleepHours: nextSleepVal,
      dailySteps: nextStepsCount,
      bloodGlucose: nextGlucoseVal,
      aiGoalsCompleted: patient.aiGoalsCompleted,
      willAttend: patient.willAttend
    });

    try {
      await updatePatientHealthScore(patient.id || 'pat-marcus-001', newRecalculatedScore, {
        medsDays: nextMedsDays,
        sleepHours: nextSleepVal,
        dailySteps: nextStepsCount,
        bloodGlucose: nextGlucoseVal,
        aiGoalsCompleted: patient.aiGoalsCompleted,
        willAttend: patient.willAttend
      }, 'manual');
    } catch (e) {
      console.warn("Failed to update health score on Firestore:", e);
    }
  };

  // RSVP Trigger
  const handleToggleRSVP = async () => {
    const nextWillAttend = !patient.willAttend;
    try {
      await savePatient(patient.id, {
        ...rawPatient,
        willAttend: nextWillAttend
      });
      // trigger score rebuild
      const newScore = computeHealthScore({
        medsDays: patient.medsDays,
        sleepHours: patient.sleepHours,
        dailySteps: patient.dailySteps,
        bloodGlucose: patient.bloodGlucose,
        aiGoalsCompleted: patient.aiGoalsCompleted,
        willAttend: nextWillAttend
      });
      await updatePatientHealthScore(patient.id, newScore, {
        medsDays: patient.medsDays,
        sleepHours: patient.sleepHours,
        dailySteps: patient.dailySteps,
        bloodGlucose: patient.bloodGlucose,
        aiGoalsCompleted: patient.aiGoalsCompleted,
        willAttend: nextWillAttend
      }, 'manual');
    } catch (err) {
      console.error(err);
    }
  };

  // Water tracking persistence
  const handleUpdateWater = (amount: number) => {
    const next = Math.max(0, waterGlasses + amount);
    setWaterGlasses(next);
    localStorage.setItem('fluent_water_glasses', String(next));
  };

  // Diary entries persistence
  const handleSaveDiaryEntry = () => {
    if (!newDiaryNote.trim()) return;
    const entry = {
      id: String(Date.now()),
      time: new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      text: newDiaryNote.trim()
    };
    const next = [entry, ...diaryNotes];
    setDiaryNotes(next);
    localStorage.setItem('fluent_diary_notes', JSON.stringify(next));
    setNewDiaryNote('');
  };

  const handleDeleteDiaryEntry = (id: string) => {
    const next = diaryNotes.filter(n => n.id !== id);
    setDiaryNotes(next);
    localStorage.setItem('fluent_diary_notes', JSON.stringify(next));
  };

  // Interactive Wearable sync hub
  const [activeDevice, setActiveDevice] = useState<'apple' | 'android'>('apple');
  const [syncProgress, setSyncProgress] = useState<number>(-1);
  const [syncStageText, setSyncStageText] = useState('');

  const triggerWearableSync = async () => {
    setSyncProgress(0);
    const stages = [
      'Establishing secure TLS OAuth handshake...',
      `Scanning local ${activeDevice === 'apple' ? 'iOS HealthKit' : 'Android Health Connect'} container...`,
      'Decrypting real-time biometric metrics...',
      'Applying range validation checks...',
      'Writing secure metrics payload to CarePlus PRM Cloud...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setSyncStageText(stages[i]);
      setSyncProgress(Math.round(((i + 1) / stages.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Prepare vital payload
    const finalGlucose = 104;
    const finalSteps = 8420;
    const finalSleep = 7.8;
    const finalSpO2 = 99;
    const finalHR = 72;

    const payload = {
      patientId: patient.id,
      authorId: 'uid-wearable-sync',
      source: activeDevice === 'apple' ? 'apple_health' : 'android_health_connect',
      device: activeDevice === 'apple' ? 'Apple Watch Ultra 2' : 'Pixel Watch 3 Pro',
      timestamp: Date.now(),
      bp: '118/76',
      hr: finalHR,
      glucose: finalGlucose,
      steps: finalSteps,
      sleep: finalSleep,
      spo2: finalSpO2,
      temp: 36.8,
      rr: 16,
      weight: 72.5,
      height: 168.0,
      bmi: 25.7,
      pain: 0,
      hydration: 94,
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };

    try {
      await updatePatientVitals(patient.id, payload);
      const simulatedNudge = {
        tabTarget: 'Metabolic',
        message: 'Decrypted biometrics verify optimal glucose at 104 mg/dL. Your 15-minute muscle contractions have stabilized post-meal blood sugar levels. Keep walking!',
        timestamp: Date.now()
      };
      const simulatedActionPlan = [
        {
          id: 'goal-1',
          type: 'ai_micro_goal',
          title: '🚶‍♂️ 15-Min Post-Meal Muscle Activation',
          description: 'Activate lower-limb GLUT4 transporters to safely remove circulatory glucose without insulin.',
          expirationTimestamp: Date.now() + 15 * 60 * 1000,
          completed: false
        },
        {
          id: 'goal-2',
          type: 'ai_micro_goal',
          title: '💧 Hydration Flush (300ml)',
          description: 'Dilute blood concentration to support renal filtration of uric acid and glucose.',
          expirationTimestamp: Date.now() + 20 * 60 * 1000,
          completed: false
        }
      ];

      await updatePatientNudgeAndActionPlan(patient.id, simulatedNudge, simulatedActionPlan);
      
      const recalculatedScore = computeHealthScore({
        medsDays: patient.medsDays,
        sleepHours: finalSleep,
        dailySteps: finalSteps,
        bloodGlucose: finalGlucose,
        aiGoalsCompleted: true,
        willAttend: patient.willAttend
      });

      await updatePatientHealthScore(patient.id, recalculatedScore, {
        medsDays: patient.medsDays,
        sleepHours: finalSleep,
        dailySteps: finalSteps,
        bloodGlucose: finalGlucose,
        aiGoalsCompleted: true,
        willAttend: patient.willAttend
      }, 'wearable');

    } catch (e) {
      console.error("Failed to perform wearable sync:", e);
    } finally {
      setTimeout(() => {
        setSyncProgress(-1);
      }, 1500);
    }
  };

  // Modal vital submission states
  const [showLogModal, setShowLogModal] = useState(false);
  const [newGlucoseInput, setNewGlucoseInput] = useState('104');
  const [newBPInput, setNewBPInput] = useState('118/76');
  const [newHRInput, setNewHRInput] = useState('72');
  const [newStepsInput, setNewStepsInput] = useState('8420');
  const [newSleepInput, setNewSleepInput] = useState('7.6');

  const handleManualVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      patientId: patient.id,
      authorId: 'uid-patient-manual',
      source: 'patient_portal',
      device: 'Manual Patient Entry',
      timestamp: Date.now(),
      bp: newBPInput,
      hr: Number(newHRInput),
      glucose: Number(newGlucoseInput),
      steps: Number(newStepsInput),
      sleep: Number(newSleepInput),
      spo2: 98,
      temp: 36.8,
      rr: 16,
      weight: 72.5,
      height: 168.0,
      bmi: 25.7,
      pain: 0,
      hydration: 92,
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };

    try {
      await updatePatientVitals(patient.id, payload);
      const recalculatedScore = computeHealthScore({
        medsDays: patient.medsDays,
        sleepHours: Number(newSleepInput),
        dailySteps: Number(newStepsInput),
        bloodGlucose: Number(newGlucoseInput),
        aiGoalsCompleted: true,
        willAttend: patient.willAttend
      });
      await updatePatientHealthScore(patient.id, recalculatedScore, {
        medsDays: patient.medsDays,
        sleepHours: Number(newSleepInput),
        dailySteps: Number(newStepsInput),
        bloodGlucose: Number(newGlucoseInput),
        aiGoalsCompleted: true,
        willAttend: patient.willAttend
      }, 'manual');
      setShowLogModal(false);
    } catch (err) {
      console.warn(err);
    }
  };

  // Toggle Pinned status
  const handleTogglePin = (name: string) => {
    let next: string[];
    if (pinnedVitals.includes(name)) {
      if (pinnedVitals.length <= 1) return; // Keep at least one vital
      next = pinnedVitals.filter(v => v !== name);
    } else {
      next = [...pinnedVitals, name];
    }
    setPinnedVitals(next);
  };

  // Reorder commands: Up/Down
  const handleMoveVital = (name: string, direction: 'up' | 'down') => {
    const idx = pinnedVitals.indexOf(name);
    if (idx === -1) return;
    const next = [...pinnedVitals];
    if (direction === 'up' && idx > 0) {
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
    } else if (direction === 'down' && idx < next.length - 1) {
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
    }
    setPinnedVitals(next);
  };

  // Resolve Vitals and Sparklines (using simple mock visual arrays)
  const sortedVitals = useMemo(() => {
    // Current Values
    const bpVal = latestVitalRecord?.bp || '118/76';
    const hrVal = latestVitalRecord?.hr || 72;
    const glucoseVal = latestVitalRecord?.glucose || 104;
    const stepsVal = latestVitalRecord?.steps || 8420;
    const sleepVal = latestVitalRecord?.sleep || 7.6;
    const spo2Val = latestVitalRecord?.spo2 || 98;
    const tempVal = latestVitalRecord?.temp || 36.8;
    const hydVal = latestVitalRecord?.hydration || 92;

    const allVitals = [
      { name: 'Blood Glucose', value: `${glucoseVal} mg/dL`, status: glucoseVal >= 140 ? 'Elevated' : glucoseVal >= 100 ? 'Borderline' : 'Optimal', statusColor: glucoseVal >= 140 ? 'text-[#a80000] bg-red-50 border-red-200' : glucoseVal >= 100 ? 'text-[#b25900] bg-amber-50 border-amber-200' : 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [92, 115, 108, 125, 104], colorHex: '#107c41', icon: Droplet },
      { name: 'Blood Pressure', value: `${bpVal} mmHg`, status: 'Optimal', statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [116, 122, 118, 120, 118], colorHex: '#0078d4', icon: Gauge },
      { name: 'Heart Rate', value: `${hrVal} bpm`, status: 'Resting Balance', statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [68, 74, 82, 69, 72], colorHex: '#a80000', icon: Heart },
      { name: 'Oxygen Saturation', value: `${spo2Val}%`, status: 'Normal Saturation', statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [98, 99, 98, 97, 98], colorHex: '#008575', icon: Activity },
      { name: 'Sleep Log', value: `${sleepVal} hrs`, status: 'Restful Window', statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [7.2, 8.1, 7.5, 6.9, 7.6], colorHex: '#5c2d91', icon: Moon },
      { name: 'Daily Steps', value: `${stepsVal.toLocaleString()} steps`, status: stepsVal >= 8000 ? 'Target Met' : 'Active Progress', statusColor: stepsVal >= 8000 ? 'text-[#107c41] bg-emerald-50 border-emerald-200' : 'text-[#b25900] bg-amber-50 border-amber-200', spark: [6500, 8900, 7200, 9300, 8420], colorHex: '#107c41', icon: TrendingUp },
      { name: 'Body Temperature', value: `${tempVal}°C`, status: 'Healthy Range', statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [36.6, 36.7, 36.9, 36.8, 36.8], colorHex: '#b25900', icon: Thermometer },
      { name: 'Hydration Quotient', value: `${hydVal}%`, status: 'Optimally Hydrated', statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [88, 95, 90, 94, 92], colorHex: '#0078d4', icon: Droplet }
    ];

    return allVitals;
  }, [latestVitalRecord]);

  // Appointments mapping helper
  const nextAppointment = useMemo(() => {
    const list = appointments.filter(apt => apt.patientId === patient.id || apt.patientId === 'pat-marcus-001');
    const base = list[0] || {
      providerName: 'Dr. G. Theogate',
      specialty: 'Rheumatology',
      time: new Date(Date.now() + 86400 * 1000).toISOString(),
      visitType: 'in_clinic',
      reason: 'Rheumatoid Arthritis 6-Month Review',
      room: 'Consultation Suite 3B',
      status: 'scheduled'
    };

    let formattedDate = 'Tomorrow';
    let formattedTime = '10:30 AM';
    try {
      const dObj = new Date(base.time);
      formattedDate = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      formattedTime = dObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {}

    return {
      ...base,
      formattedDate,
      formattedTime
    };
  }, [appointments, patient]);

  // Rx Refill trigger
  const handleTriggerRefill = async (rxId: string, medName: string) => {
    setSubmittingRefillId(rxId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await createRefillRequest(patient.id, {
        prescriptionId: rxId,
        medicationName: medName,
        requestedAt: Date.now(),
        status: 'pending_review'
      });
      setRefillSuccessMessage(`Refill request successfully sent to pharmacy for ${medName}.`);
      setTimeout(() => setRefillSuccessMessage(null), 4000);
    } catch (err) {
      console.warn(err);
    } finally {
      setSubmittingRefillId(null);
    }
  };

  // Recharts Data Source mapping
  const chartData = useMemo<any[]>(() => {
    const months = trendsDuration === '3m' ? ['April', 'May', 'June'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    if (trendsChartMetric === 'glucose') {
      return months.map((m, idx) => ({
        name: m,
        Fasting: [95, 110, 104, 118, 99, 104][idx % 6],
        PostMeal: [135, 148, 142, 155, 138, 140][idx % 6],
        Target: 140
      }));
    } else if (trendsChartMetric === 'steps') {
      return months.map((m, idx) => ({
        name: m,
        Steps: [6400, 7800, 8420, 9100, 8300, 8420][idx % 6],
        Goal: 8000
      }));
    } else {
      return months.map((m, idx) => ({
        name: m,
        Resting: [64, 68, 72, 70, 66, 72][idx % 6],
        Peak: [120, 135, 142, 130, 125, 132][idx % 6]
      }));
    }
  }, [trendsChartMetric, trendsDuration]);

  // Conditions checklist state
  const [completedDirectives, setCompletedDirectives] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('fluent_completed_directives');
      return saved ? JSON.parse(saved) : {
        'dir-stretch': true,
        'dir-med-am': true
      };
    } catch {
      return {};
    }
  });

  const handleToggleDirective = (id: string) => {
    const next = { ...completedDirectives, [id]: !completedDirectives[id] };
    setCompletedDirectives(next);
    localStorage.setItem('fluent_completed_directives', JSON.stringify(next));
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Fluent 2 Breadcrumb & Segmented Page Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white/75 backdrop-blur-md sticky top-0 z-40">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-[#0078d4] font-bold uppercase tracking-wider font-mono">
            <Smartphone className="h-3.5 w-3.5" />
            <span>CarePlus Portal</span>
            <span className="text-slate-300">/</span>
            <span>{patient.name}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">Clinical Care Center</h1>
        </div>

        {/* Fluent 2 Pivot Segments Control */}
        <div className="flex bg-[#f3f2f1] p-1 rounded-lg border border-[#edebe9] shrink-0 font-sans">
          <button
            onClick={() => setActiveSubPage(1)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeSubPage === 1 
                ? 'bg-white text-[#0078d4] shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#edebe9]'
            }`}
          >
            At a Glance
          </button>
          <button
            onClick={() => setActiveSubPage(2)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeSubPage === 2 
                ? 'bg-white text-[#0078d4] shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#edebe9]'
            }`}
          >
            Clinical Depth
          </button>
          <button
            onClick={() => setActiveSubPage(3)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeSubPage === 3 
                ? 'bg-white text-[#0078d4] shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#edebe9]'
            }`}
          >
            Wellness Assessment
          </button>
        </div>
      </div>

      {/* --- PAGE 1: AT A GLANCE DASHBOARD --- */}
      {activeSubPage === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
          
          {/* TOP LEFT: VITAL FOCUS */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-[#0078d4]" />
                    Vital Focus
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure, pin, and drag-order your live healthcare telemetry variables
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setShowConfigVitals(!showConfigVitals)}
                    className="h-7 text-[10.5px] font-bold border-slate-200 hover:bg-slate-50 px-2 cursor-pointer"
                  >
                    Configure Pins
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => setShowLogModal(true)}
                    className="h-7 text-[10.5px] font-bold bg-[#0078d4] hover:bg-[#106ebe] text-white px-2.5 cursor-pointer"
                  >
                    + Log Vital
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                {/* Pins configuration dropdown */}
                {showConfigVitals && (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-slate-700">Select Pinned Vitals to Display on Dashboard:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {sortedVitals.map(v => (
                        <label key={v.name} className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                          <input
                            type="checkbox"
                            checked={pinnedVitals.includes(v.name)}
                            onChange={() => handleTogglePin(v.name)}
                            className="rounded border-slate-300 text-[#0078d4] focus:ring-[#0078d4]"
                          />
                          <span>{v.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Pinned Vitals grid list */}
                <div className="space-y-2.5">
                  {sortedVitals
                    .filter(v => pinnedVitals.includes(v.name))
                    .map((vital, index, arr) => {
                      const Icon = vital.icon;
                      return (
                        <div 
                          key={vital.name}
                          className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:shadow-xs transition-shadow bg-white font-sans group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-100 shrink-0">
                              <Icon className="h-4.5 w-4.5 text-[#0078d4]" />
                            </div>
                            
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-500 leading-none">{vital.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-base font-bold font-mono text-slate-900 tracking-tight">{vital.value}</span>
                                <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.25 rounded-md border ${vital.statusColor}`}>
                                  {vital.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Sparklines representation & Reordering controls */}
                          <div className="flex items-center gap-4">
                            {/* Simple inline Sparkline SVG */}
                            <svg className="h-6 w-24 hidden sm:block overflow-visible" stroke={vital.colorHex} strokeWidth="2" fill="none">
                              <path d={`M 0,${30 - vital.spark[0]/Math.max(...vital.spark)*20} L 24,${30 - vital.spark[1]/Math.max(...vital.spark)*20} L 48,${30 - vital.spark[2]/Math.max(...vital.spark)*20} L 72,${30 - vital.spark[3]/Math.max(...vital.spark)*20} L 96,${30 - vital.spark[4]/Math.max(...vital.spark)*20}`} />
                              <circle cx="96" cy={30 - vital.spark[4]/Math.max(...vital.spark)*20} r="2.5" fill={vital.colorHex} />
                            </svg>

                            {/* Move Up/Down Controls */}
                            <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <button 
                                disabled={index === 0}
                                onClick={() => handleMoveVital(vital.name, 'up')}
                                className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                disabled={index === arr.length - 1}
                                onClick={() => handleMoveVital(vital.name, 'down')}
                                className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* WEARABLE HEALTH DEVICE SYNCHRONIZATION HUB */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-[#0078d4]" />
                      Wearable & App Sync Hub
                    </h3>
                    
                    {/* Device selector */}
                    <div className="flex border border-[#edebe9] bg-[#f3f2f1] p-0.5 rounded-md text-[10.5px]">
                      <button
                        onClick={() => setActiveDevice('apple')}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          activeDevice === 'apple' ? 'bg-white text-[#0078d4]' : 'text-slate-500'
                        }`}
                      >
                        Apple HealthKit
                      </button>
                      <button
                        onClick={() => setActiveDevice('android')}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          activeDevice === 'android' ? 'bg-white text-[#0078d4]' : 'text-slate-500'
                        }`}
                      >
                        Android Connect
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Synchronize your physical telemetry database. Synchronizing imports real-time biometric loops directly from your smart sensors and dynamically updates your care indicators.
                  </p>

                  {syncProgress >= 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#0078d4] animate-pulse flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          {syncStageText}
                        </span>
                        <span className="font-mono text-[#0078d4]">{syncProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#0078d4] h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={triggerWearableSync}
                      className="w-full h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {activeDevice === 'apple' ? <Apple className="h-4 w-4 text-slate-900" /> : <Smartphone className="h-4 w-4 text-slate-900" />}
                      Sync Biometric Sensors Now
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* TOP RIGHT: HEALTH SCORE */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#107c41]" />
                  Health Score
                </CardTitle>
                <CardDescription className="text-xs">
                  A dynamic, telemetry-calculated index indicating current compliance and recovery
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6 flex flex-col items-center justify-center">
                
                {/* Semi-circular circular progress indicator */}
                <div className="relative flex items-center justify-center h-40 w-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Arc */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#f3f2f1" 
                      strokeWidth="8" 
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset="62.8" /* represents a 3/4 circle arc */
                      strokeLinecap="round"
                    />
                    {/* Foreground Arc */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke={calculatedHealthScore >= 80 ? '#107c41' : calculatedHealthScore >= 60 ? '#b25900' : '#a80000'}
                      strokeWidth="8" 
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (calculatedHealthScore / 100) * 188.4} /* maps to 3/4 circle arc */
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-4xl font-extrabold font-mono text-slate-900 leading-none tracking-tight">
                      {calculatedHealthScore}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Score Index</div>
                  </div>
                </div>

                {/* Live Interactive Checklist to manipulate factors and save */}
                <div className="w-full space-y-3 border-t border-slate-100 pt-4 font-sans text-xs">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2">Today's Telemetry Factors Checklist:</h4>
                  
                  <div 
                    onClick={() => handleToggleAdherenceFactor('meds')}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <span className="font-medium text-slate-600 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${adherenceMeds ? 'bg-[#107c41]' : 'bg-slate-300'}`} />
                      Medications logged (+10 pts)
                    </span>
                    <Badge className={adherenceMeds ? 'bg-emerald-50 text-[#107c41]' : 'bg-slate-100 text-slate-500'}>
                      {adherenceMeds ? 'Active' : 'Unchecked'}
                    </Badge>
                  </div>

                  <div 
                    onClick={() => handleToggleAdherenceFactor('steps')}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <span className="font-medium text-slate-600 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${adherenceSteps ? 'bg-[#107c41]' : 'bg-slate-300'}`} />
                      Daily steps goal met (+10 pts)
                    </span>
                    <Badge className={adherenceSteps ? 'bg-emerald-50 text-[#107c41]' : 'bg-slate-100 text-slate-500'}>
                      {adherenceSteps ? 'Active' : 'Unchecked'}
                    </Badge>
                  </div>

                  <div 
                    onClick={() => handleToggleAdherenceFactor('glucose')}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <span className="font-medium text-slate-600 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${adherenceGlucose ? 'bg-[#107c41]' : 'bg-slate-300'}`} />
                      Glycemic bounds target (+10 pts)
                    </span>
                    <Badge className={adherenceGlucose ? 'bg-emerald-50 text-[#107c41]' : 'bg-slate-100 text-slate-500'}>
                      {adherenceGlucose ? 'Active' : 'Unchecked'}
                    </Badge>
                  </div>

                  <div 
                    onClick={() => handleToggleAdherenceFactor('sleep')}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <span className="font-medium text-slate-600 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${adherenceSleep ? 'bg-[#107c41]' : 'bg-slate-300'}`} />
                      7.5 hrs restorative sleep (+10 pts)
                    </span>
                    <Badge className={adherenceSleep ? 'bg-emerald-50 text-[#107c41]' : 'bg-slate-100 text-slate-500'}>
                      {adherenceSleep ? 'Active' : 'Unchecked'}
                    </Badge>
                  </div>
                </div>

                {/* JITAI SMART NUDGE BOX */}
                {patient.activeNudge && (
                  <div className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-xl mt-4 space-y-1.5 text-xs font-sans">
                    <div className="font-bold text-[#0078d4] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      Smart Nudge Active
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      "{patient.activeNudge.message}"
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* BOTTOM LEFT: UPCOMING CONSULTATION */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#0078d4]" />
                  Upcoming Consultation
                </CardTitle>
                <CardDescription className="text-xs">
                  Your scheduled specialist visit guidelines, telehealth links, and RSVPs
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{nextAppointment.providerName}</h4>
                      <p className="text-[#0078d4] font-bold text-[11px]">{nextAppointment.specialty}</p>
                    </div>
                    <Badge className={nextAppointment.visitType?.includes('virtual') ? 'bg-indigo-50 text-[#5c2d91] border-indigo-100' : 'bg-emerald-50 text-[#107c41] border-emerald-100'}>
                      {nextAppointment.visitType?.includes('virtual') ? 'Virtual Video' : 'In-Clinic Clinic'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-2.5 border-t border-slate-200/50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</span>
                      <p className="font-bold text-slate-800 font-mono text-[11.5px]">{nextAppointment.formattedDate} @ {nextAppointment.formattedTime}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Suite Location</span>
                      <p className="font-semibold text-slate-600 text-[11.5px]">{nextAppointment.room}</p>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">Encounter Reason: </span>
                    {nextAppointment.reason || 'General routine follow-up care'}
                  </div>
                </div>

                {/* Live Attendance RSVP switch */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl text-xs">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-800">Confirm Attendance RSVP</h5>
                    <p className="text-[10.5px] text-slate-400">Informs clinic of intent to attend, supporting care coordinator</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10.5px] font-bold ${patient.willAttend ? 'text-[#107c41]' : 'text-slate-400'}`}>
                      {patient.willAttend ? 'Attending' : 'Declined'}
                    </span>
                    <button
                      onClick={handleToggleRSVP}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                        patient.willAttend ? 'bg-[#107c41]' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        patient.willAttend ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* BOTTOM RIGHT: DAILY ACTION PLAN & ACTIVE CONDITION */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-[#0078d4]" />
                  Care Guidelines Summary
                </CardTitle>
                <CardDescription className="text-xs">
                  Diagnoses active under supervision and high-priority action directives
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Diagnoses items */}
                <div className="space-y-3">
                  {patient.conditions.map((cond: string) => {
                    const desc = CONDITION_DESCRIPTIONS[cond] || {
                      friendlyName: cond,
                      description: 'Chronic clinical condition undergoing active supervision and lifestyle remote monitoring.',
                      icon: ShieldAlert
                    };
                    const Icon = desc.icon;
                    return (
                      <div key={cond} className="flex items-start gap-3 p-3 border border-slate-50 rounded-xl bg-slate-50/20">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 text-[#0078d4] shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{desc.friendlyName}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{desc.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick directives list summary */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1.5">High-Priority Protocols:</div>
                  
                  <div 
                    onClick={() => handleToggleDirective('dir-stretch')}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      completedDirectives['dir-stretch'] ? 'bg-[#107c41] border-[#107c41] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {completedDirectives['dir-stretch'] && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`font-bold leading-none ${completedDirectives['dir-stretch'] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        Perform finger tendon and joint mobility drills
                      </p>
                      <p className="text-[10.5px] text-slate-400 leading-none">10 mins early morning warming Preserves joint kinemetrics</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleToggleDirective('dir-med-am')}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      completedDirectives['dir-med-am'] ? 'bg-[#107c41] border-[#107c41] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {completedDirectives['dir-med-am'] && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`font-bold leading-none ${completedDirectives['dir-med-am'] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        Verify weekly Immunomodulator dose log
                      </p>
                      <p className="text-[10.5px] text-slate-400 leading-none">Methotrexate and Folate exactly as scheduled</p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* --- PAGE 2: CLINICAL DEPTH & DIAGNOSTICS --- */}
      {activeSubPage === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
          
          {/* DAILY ACTION PLAN & DIAGNOSES OVERVIEW */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-[#0078d4]" />
                  Active Chronic Care Protocols
                </CardTitle>
                <CardDescription className="text-xs">
                  Specialist assignments, target diagnostic bounds, and clinically set daily actions
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-5">
                {patient.conditions.map((cond: string) => {
                  const desc = CONDITION_DESCRIPTIONS[cond] || {
                    friendlyName: cond,
                    description: 'Diagnosed chronic condition undergoing active supervised treatment.',
                    status: 'Monitored',
                    statusColor: 'bg-slate-50 text-slate-600 border-slate-100',
                    managedBy: 'Referral specialist',
                    targetTitle: 'Supervision Goal',
                    targetValue: 'Log daily biometrics',
                    tip: 'Consistency optimizes clinical outcomes.',
                    icon: ShieldAlert
                  };
                  const Icon = desc.icon;
                  return (
                    <div key={cond} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                      <div className="p-4 space-y-2 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${desc.statusColor}`}>
                            {desc.status}
                          </span>
                          <span className="text-[10.5px] font-bold text-[#0078d4] flex items-center gap-1 font-mono">
                            <Icon className="h-3.5 w-3.5" />
                            {desc.friendlyName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {desc.description}
                        </p>
                      </div>

                      <div className="p-4 border-t border-slate-100 space-y-3 bg-white text-xs">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">{desc.targetTitle}</span>
                            <span className="font-bold text-slate-700">{desc.targetValue}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Specialist</span>
                            <span className="font-semibold text-slate-600">{desc.managedBy}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50/40 border border-blue-100/50 rounded-lg text-slate-700 leading-relaxed flex gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                          <span className="font-medium text-[11px]"><strong>Clinical Tip: </strong>{desc.tip}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Full detailed action directives checklist */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Clinical Directives & Checklist:</h4>
                  
                  <div 
                    onClick={() => handleToggleDirective('dir-stretch')}
                    className="p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors cursor-pointer flex items-start gap-3.5"
                  >
                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                      completedDirectives['dir-stretch'] ? 'bg-[#107c41] border-[#107c41] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {completedDirectives['dir-stretch'] && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="space-y-1">
                      <h5 className={`text-xs font-bold leading-tight ${completedDirectives['dir-stretch'] ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                        Perform finger tendon and joint mobility drills
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Engage in 10 minutes of finger tendon gliding and gentle wrist stretches to prevent joint stiffness.
                      </p>
                      <Badge className="bg-[#5c2d91]/5 text-[#5c2d91] font-mono text-[9px] py-0.5">Physical Therapy</Badge>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleToggleDirective('dir-med-am')}
                    className="p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors cursor-pointer flex items-start gap-3.5"
                  >
                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                      completedDirectives['dir-med-am'] ? 'bg-[#107c41] border-[#107c41] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {completedDirectives['dir-med-am'] && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="space-y-1">
                      <h5 className={`text-xs font-bold leading-tight ${completedDirectives['dir-med-am'] ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                        Take weekly Immunomodulator dose log
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Log weekly dose of Methotrexate and daily Folate strictly to manage autoimmune inflammatory thresholds.
                      </p>
                      <Badge className="bg-[#0078d4]/5 text-[#0078d4] font-mono text-[9px] py-0.5">Pharmacotherapy</Badge>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleToggleDirective('dir-steps')}
                    className="p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors cursor-pointer flex items-start gap-3.5"
                  >
                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                      completedDirectives['dir-steps'] ? 'bg-[#107c41] border-[#107c41] text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {completedDirectives['dir-steps'] && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="space-y-1">
                      <h5 className={`text-xs font-bold leading-tight ${completedDirectives['dir-steps'] ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}>
                        Low-impact continuous walking guidelines
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Target 8,000+ continuous gentle steps to sustain cardiovascular metabolic cellular GLUT4 activation.
                      </p>
                      <Badge className="bg-[#107c41]/5 text-[#107c41] font-mono text-[9px] py-0.5">Physical Activity</Badge>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* ACTIVE PRESCRIPTIONS & REFILL REQUESTS */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-[#0078d4]" />
                  Active Prescriptions
                </CardTitle>
                <CardDescription className="text-xs">
                  Your authorized therapeutic medications, scheduling parameters, and pharmacies
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                
                {/* Refill successes banner */}
                {refillSuccessMessage && (
                  <div className="p-3 bg-emerald-50 text-[#107c41] border border-emerald-200 text-xs font-bold rounded-lg animate-fadeIn flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{refillSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {prescriptions.length === 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-white">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-800 leading-none">Metformin Hydrochloride</h4>
                          <p className="text-[11px] text-slate-500 font-medium">500mg • Twice daily with meals</p>
                          <span className="text-[10px] text-[#0078d4] bg-[#0078d4]/5 border border-[#0078d4]/10 px-1.5 py-0.25 rounded-md font-bold block w-fit">Type 2 Diabetes</span>
                        </div>
                        <Button
                          size="xs"
                          disabled={submittingRefillId === 'demo-rx-1'}
                          onClick={() => handleTriggerRefill('demo-rx-1', 'Metformin 500mg')}
                          className="h-7 text-[10px] uppercase font-black tracking-wider bg-white hover:bg-slate-50 border border-[#0078d4] text-[#0078d4] cursor-pointer"
                        >
                          {submittingRefillId === 'demo-rx-1' ? 'Sending...' : 'Request Refill'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-white">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-800 leading-none">Methotrexate Sodium</h4>
                          <p className="text-[11px] text-slate-500 font-medium">15mg • Once weekly on Saturdays</p>
                          <span className="text-[10px] text-[#5c2d91] bg-[#5c2d91]/5 border border-[#5c2d91]/10 px-1.5 py-0.25 rounded-md font-bold block w-fit">Rheumatoid Arthritis</span>
                        </div>
                        <Button
                          size="xs"
                          disabled={submittingRefillId === 'demo-rx-2'}
                          onClick={() => handleTriggerRefill('demo-rx-2', 'Methotrexate 15mg')}
                          className="h-7 text-[10px] uppercase font-black tracking-wider bg-white hover:bg-slate-50 border border-[#0078d4] text-[#0078d4] cursor-pointer"
                        >
                          {submittingRefillId === 'demo-rx-2' ? 'Sending...' : 'Request Refill'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    prescriptions.map((rx: any) => (
                      <div key={rx.id} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-white font-sans">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-800 leading-none">{rx.medicationName}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">{rx.dosage} • {rx.frequency}</p>
                          {rx.condition && (
                            <span className="text-[9.5px] text-[#0078d4] bg-blue-50 px-1.5 py-0.25 rounded block w-fit font-bold font-mono uppercase mt-1">
                              {rx.condition}
                            </span>
                          )}
                        </div>
                        <Button
                          size="xs"
                          disabled={submittingRefillId === rx.id}
                          onClick={() => handleTriggerRefill(rx.id, rx.medicationName)}
                          className="h-7 text-[10px] uppercase font-black tracking-wider bg-white hover:bg-slate-50 border border-[#0078d4] text-[#0078d4] cursor-pointer"
                        >
                          {submittingRefillId === rx.id ? 'Sending...' : 'Request Refill'}
                        </Button>
                      </div>
                    ))
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* INTERACTIVE TRENDS & ADHERENCE ANALYTICS */}
          <div className="lg:col-span-12 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#0078d4]" />
                    Interactive Trends & Adherence Analytics
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Plot biometric datasets and assess physical behavioral adherence ranges
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {/* Variable selector */}
                  <div className="flex bg-[#f3f2f1] p-0.5 rounded-lg border border-[#edebe9]">
                    <button
                      onClick={() => setTrendsChartMetric('glucose')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        trendsChartMetric === 'glucose' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Glucose Level
                    </button>
                    <button
                      onClick={() => setTrendsChartMetric('steps')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        trendsChartMetric === 'steps' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Steps Target
                    </button>
                    <button
                      onClick={() => setTrendsChartMetric('hr')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        trendsChartMetric === 'hr' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Heart Rate
                    </button>
                  </div>

                  {/* Duration selector */}
                  <div className="flex bg-[#f3f2f1] p-0.5 rounded-lg border border-[#edebe9]">
                    <button
                      onClick={() => setTrendsDuration('3m')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        trendsDuration === '3m' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      3 Months
                    </button>
                    <button
                      onClick={() => setTrendsDuration('6m')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        trendsDuration === '6m' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      6 Months
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                
                {/* Recharts Render Canvas */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFasting" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0078d4" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0078d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPostMeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#107c41" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#107c41" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2f1" />
                      <XAxis dataKey="name" stroke="#a19f9d" fontSize={11} fontStyle="normal" />
                      <YAxis stroke="#a19f9d" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #edebe9', fontSize: '12px' }} />
                      
                      {trendsChartMetric === 'glucose' && (
                        <>
                          <Area type="monotone" dataKey="Fasting" stroke="#0078d4" strokeWidth={2} fillOpacity={1} fill="url(#colorFasting)" name="Fasting Glucose" />
                          <Area type="monotone" dataKey="PostMeal" stroke="#107c41" strokeWidth={2} fillOpacity={1} fill="url(#colorPostMeal)" name="Post-Meal Glucose" />
                          <Line type="monotone" dataKey="Target" stroke="#a80000" strokeWidth={1} dot={false} strokeDasharray="5 5" name="Clinical Target Upper Bound (140 mg/dL)" />
                        </>
                      )}

                      {trendsChartMetric === 'steps' && (
                        <>
                          <Area type="monotone" dataKey="Steps" stroke="#0078d4" strokeWidth={2} fillOpacity={1} fill="url(#colorFasting)" name="Daily Step Count" />
                          <Line type="monotone" dataKey="Goal" stroke="#107c41" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Target Steps Milestone" />
                        </>
                      )}

                      {trendsChartMetric === 'hr' && (
                        <>
                          <Area type="monotone" dataKey="Resting" stroke="#0078d4" strokeWidth={2} fillOpacity={1} fill="url(#colorFasting)" name="Resting HR" />
                          <Area type="monotone" dataKey="Peak" stroke="#a80000" strokeWidth={2} fillOpacity={1} fill="url(#colorPostMeal)" name="Peak Physical HR" />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0078d4]" />
                    <span>Average Compliance: <strong>92.4% Optimal</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#107c41]" />
                    <span>Post-exercise Recovery speed: <strong>Normal range (T-1m CRP baseline)</strong></span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* HISTORICAL LABORATORY PANELS */}
          <div className="lg:col-span-12 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#0078d4]" />
                  Historical Laboratory Panels
                </CardTitle>
                <CardDescription className="text-xs">
                  Your certified diagnostics record vaults, verified by clinical reference labs
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 px-0">
                
                {/* Dense Fluent Table layout */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 font-bold text-slate-500 text-[10.5px] uppercase tracking-wider">
                        <th className="p-4 pl-6">Biomarker / Test Code</th>
                        <th className="p-4">Latest Result</th>
                        <th className="p-4">Standard Range Reference</th>
                        <th className="p-4">Verification Date</th>
                        <th className="p-4 pr-6">Primary Review Clinician Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900">Glycated Hemoglobin (HbA1c)</div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">LOINC: 4548-4</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold font-mono text-slate-900 bg-emerald-50 text-[#107c41] px-2 py-0.5 rounded border border-emerald-200">5.9%</span>
                        </td>
                        <td className="p-4 font-mono">Under 6.5% (Optimal glycemic controls)</td>
                        <td className="p-4 text-slate-500 font-mono">June 14, 2026</td>
                        <td className="p-4 text-slate-500 leading-normal max-w-sm">Dr. James Wilson: Excellent stability achieved. Glycemic indexes demonstrate successful behavioral metformin compliance.</td>
                      </tr>

                      <tr>
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900">C-Reactive Protein (CRP)</div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">LOINC: 1988-5</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold font-mono text-slate-900 bg-emerald-50 text-[#107c41] px-2 py-0.5 rounded border border-emerald-200">3.2 mg/L</span>
                        </td>
                        <td className="p-4 font-mono">&lt; 5.0 mg/L (Active Remission)</td>
                        <td className="p-4 text-slate-500 font-mono">June 14, 2026</td>
                        <td className="p-4 text-slate-500 leading-normal max-w-sm">Dr. G. Theogate: Synovial joint autoimmune inflammation markers are thoroughly controlled. Continue methotrexate schedules.</td>
                      </tr>

                      <tr>
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900">eGFR (Kidney Filtration)</div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">LOINC: 62238-1</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold font-mono text-slate-900 bg-emerald-50 text-[#107c41] px-2 py-0.5 rounded border border-emerald-200">94 mL/min/1.73m²</span>
                        </td>
                        <td className="p-4 font-mono">&gt; 90 mL/min (Optimal filtration)</td>
                        <td className="p-4 text-slate-500 font-mono">June 14, 2026</td>
                        <td className="p-4 text-slate-500 leading-normal max-w-sm">Lab System: Renal tissue clearance indicators show flawless baseline stability. No metabolic constraints found.</td>
                      </tr>

                      <tr>
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900">Rheumatoid Factor (RF)</div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">LOINC: 11572-5</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold font-mono text-slate-900 bg-amber-50 text-[#b25900] px-2 py-0.5 rounded border border-amber-200">28 IU/mL</span>
                        </td>
                        <td className="p-4 font-mono">&lt; 14 IU/mL (Elevated Baseline)</td>
                        <td className="p-4 text-slate-500 font-mono">June 14, 2026</td>
                        <td className="p-4 text-slate-500 leading-normal max-w-sm">Dr. G. Theogate: Seropositive remains stable. Hand joints are kinematic, no clinical evidence of radiographic erosive progression.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* --- PAGE 3: WELLNESS ENGAGEMENT & MOOD SELF-ASSESSMENT ROOM --- */}
      {activeSubPage === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
          
          {/* WELLNESS CLASSES & ENGAGEMENTS */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-[#0078d4]" />
                  Wellness Engagement
                </CardTitle>
                <CardDescription className="text-xs">
                  Active therapeutic coaching programs, dietary webinars, and movement classes
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                
                <div className="p-3.5 border border-slate-100 rounded-xl bg-white flex items-center justify-between gap-3 font-sans">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-800 leading-none">Rheumatology Joint Kinematics Drill</h4>
                    <p className="text-[11px] text-[#107c41] font-bold">Daily • 15 minutes of low-impact stretching</p>
                    <span className="text-[9.5px] text-slate-400 font-mono font-bold uppercase block">Specialist Approved: Dr. G. Theogate</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#0078d4] hover:bg-[#106ebe] text-white text-[11px] font-bold h-8 cursor-pointer"
                  >
                    Start Session
                  </Button>
                </div>

                <div className="p-3.5 border border-slate-100 rounded-xl bg-white flex items-center justify-between gap-3 font-sans">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-800 leading-none">Anti-Inflammatory Dietary Workshop</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Virtual • 45 minutes on demand webinar</p>
                    <span className="text-[9.5px] text-[#0078d4] bg-blue-50 px-1.5 py-0.25 rounded block w-fit font-bold font-mono">Enrolled</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold h-8 cursor-pointer"
                  >
                    Join Webinar
                  </Button>
                </div>

                <div className="p-3.5 border border-slate-100 rounded-xl bg-white flex items-center justify-between gap-3 font-sans">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-800 leading-none">Yoga Breathing for Adrenal Calming</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Virtual • 20 minutes meditation flow</p>
                    <span className="text-[9.5px] text-[#0078d4] bg-blue-50 px-1.5 py-0.25 rounded block w-fit font-bold font-mono">Enrolled</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold h-8 cursor-pointer"
                  >
                    Watch Flow
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* WATER HYDRATION COUNTER */}
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Droplet className="h-4 w-4 text-[#0078d4]" />
                  Hydration Sync Tracker
                </CardTitle>
                <CardDescription className="text-xs">
                  Maintain tissue and synovial fluid hydration equilibrium targets (2.5 Liters / 8 glasses target)
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
                
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handleUpdateWater(-1)}
                    className="h-10 w-10 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    -
                  </Button>
                  
                  <div className="text-center min-w-28 font-sans">
                    <div className="text-4xl font-extrabold font-mono text-slate-900 leading-none">
                      {waterGlasses}
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">Glasses of Water</div>
                  </div>

                  <Button
                    onClick={() => handleUpdateWater(1)}
                    className="h-10 w-10 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-full flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    +
                  </Button>
                </div>

                {/* Liters calculated indicator */}
                <p className="text-[11px] text-slate-500 font-medium">
                  Estimated Fluid Volume: <strong>{(waterGlasses * 0.3).toFixed(1)} Liters</strong> of 2.4L target.
                </p>

                {/* Glasses icons rendering dynamically */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Droplet 
                      key={i} 
                      className={`h-5 w-5 ${
                        i < waterGlasses ? 'text-[#0078d4] fill-[#0078d4]' : 'text-slate-200'
                      } transition-colors`} 
                    />
                  ))}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* MOOD SELF-ASSESSMENT & DIARY entries */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Smile className="h-4 w-4 text-[#0078d4]" />
                  Mood & Stress Self-Assessment
                </CardTitle>
                <CardDescription className="text-xs">
                  Self-report variables to assist remote care coordinators in tracking wellness triggers
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-5">
                
                {/* Mood buttons selector */}
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-600 block uppercase text-[10px] tracking-wider">How do you feel today?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Calm', 'Fatigued', 'Anxious', 'Joyful', 'Sore', 'Pain-free'].map(m => (
                      <button
                        key={m}
                        onClick={() => setSelectedMood(m)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          selectedMood === m
                            ? 'bg-[#0078d4]/10 border-[#0078d4] text-[#0078d4]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m === 'Calm' ? '🧘‍♂️ ' : m === 'Fatigued' ? '😴 ' : m === 'Anxious' ? '⚡ ' : m === 'Joyful' ? '✨ ' : m === 'Sore' ? '🩹 ' : '🛡️ '}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stress Range Slider */}
                <div className="space-y-2 text-xs pt-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-600 block uppercase text-[10px] tracking-wider">Stress Level Index</label>
                    <span className="font-mono font-bold text-[#0078d4]">{stressLevel} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0078d4]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>1 - Peaceful Calm</span>
                    <span>5 - High Stress</span>
                  </div>

                  {/* Smart Advice based on stress selection */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-[11px] leading-relaxed mt-2 font-medium">
                    {stressLevel >= 4 ? (
                      <p className="text-red-900">⚡ Highly elevated. Try engaging in the <strong>Yoga Breathing meditating flow</strong> on your program to restore parasympathetic heart variability.</p>
                    ) : stressLevel >= 2 ? (
                      <p className="text-[#b25900]">✨ Standard stress. Keep hydrated and step continuously to metabolize stress hormones.</p>
                    ) : (
                      <p className="text-[#107c41]">🛡️ Excellent peaceful balance. Your nervous system is restorative.</p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* CLINICAL SELF-MONITORING DIARY */}
            <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden font-sans">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-[#0078d4]" />
                  Self-Monitoring Diary
                </CardTitle>
                <CardDescription className="text-xs">
                  Maintain personal symptoms journals, medication side effects, or recovery notes
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                
                {/* Diary Input form */}
                <div className="space-y-2 text-xs">
                  <textarea
                    rows={3}
                    placeholder="Type your symptoms journal, pain metrics, or general comments here..."
                    value={newDiaryNote}
                    onChange={(e) => setNewDiaryNote(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-[#0078d4] focus:border-[#0078d4] text-xs font-medium placeholder-slate-400"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveDiaryEntry}
                      className="bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold uppercase tracking-wider px-4 cursor-pointer"
                    >
                      Save Journal Entry
                    </Button>
                  </div>
                </div>

                {/* Historic Entries */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-600 uppercase text-[10px] tracking-wider mb-2">Recent Journal Entries:</h4>
                  
                  {diaryNotes.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-4">No entries recorded yet. Write your first journal above!</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {diaryNotes.map(n => (
                        <div key={n.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 relative group">
                          <button
                            onClick={() => handleDeleteDiaryEntry(n.id)}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <span className="text-[10px] text-slate-400 font-bold font-mono block mb-1">{n.time}</span>
                          <p className="text-slate-700 leading-relaxed font-semibold pr-6 whitespace-pre-wrap">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* --- REUSABLE LOG VITAL MODAL DIALOG --- */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-100 rounded-2xl max-w-md w-full shadow-lg overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Stethoscope className="h-4.5 w-4.5 text-[#0078d4]" />
                Log Daily Biometrics Telemetry
              </h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualVitalSubmit} className="p-5 space-y-4 font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-500 font-bold uppercase block">Fasting Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={newGlucoseInput}
                    onChange={(e) => setNewGlucoseInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-[#0078d4]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-500 font-bold uppercase block">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={newBPInput}
                    onChange={(e) => setNewBPInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-[#0078d4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-500 font-bold uppercase block">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={newHRInput}
                    onChange={(e) => setNewHRInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-[#0078d4]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-500 font-bold uppercase block">Daily Steps</label>
                  <input
                    type="number"
                    value={newStepsInput}
                    onChange={(e) => setNewStepsInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-[#0078d4]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-500 font-bold uppercase block">Sleep (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSleepInput}
                    onChange={(e) => setNewSleepInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-[#0078d4]"
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-[10.5px] text-slate-500 leading-normal flex gap-1.5 items-start mt-2">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Publishing metrics uploads telemetry directly to Firebase Cloud databases. All values undergo safety range boundary filters.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLogModal(false)}
                  className="h-8 text-xs font-bold px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold px-4 cursor-pointer"
                >
                  Publish Telemetry
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

export default HealthBoard;
