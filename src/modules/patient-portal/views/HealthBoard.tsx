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
  const [activeSubPage, setActiveSubPage] = useState<1 | 2>(1);
  const [showFloweringMilestone, setShowFloweringMilestone] = useState(false);

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
        activeNudge: {
          message: 'Decrypted biometrics verify optimal glucose at 104 mg/dL. Your 15-minute muscle contractions have stabilized post-meal blood sugar levels. Keep walking!'
        },
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
      activeNudge: rawPatient.activeNudge || {
        message: 'Decrypted biometrics verify optimal glucose at 104 mg/dL. Your 15-minute muscle contractions have stabilized post-meal blood sugar levels. Keep walking!'
      },
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
  const [adherenceMeds, setAdherenceMeds] = useState(false);
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

  const outOfRangeVitals = useMemo(() => {
    return sortedVitals.filter(v => v.status && !['Optimal', 'Stable', 'Normal', 'Remission'].includes(v.status));
  }, [sortedVitals]);

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
      
      {/* High-Fidelity Header & Segmented Tab Navigation Controls */}
      <div className="flex flex-col gap-4 pb-4 bg-transparent border-b border-slate-200/40">
        
        {/* Row 1: Back Chevron & Two Stacked Tabs */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {/* Back Chevron */}
          <button className="p-2 -ml-2 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors" title="Go Back">
            <span className="text-2xl font-light select-none">⟨</span>
          </button>

          {/* Floating Pivot Tabs */}
          <div className="flex items-center gap-4">
            {/* At a Glance Tab */}
            <button
              onClick={() => setActiveSubPage(1)}
              className={`transition-all duration-300 px-5 py-2.5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-w-[105px] h-[58px] ${
                activeSubPage === 1
                  ? 'bg-white text-[#0078d4] font-black border border-slate-100 shadow-lg shadow-blue-900/5'
                  : 'text-slate-400 hover:text-slate-600 font-bold'
              }`}
            >
              <span className="text-[10px] uppercase font-black tracking-wider leading-tight">At a</span>
              <span className="text-[12px] uppercase font-black tracking-wider leading-tight">Glance</span>
            </button>

            {/* Vital Focus Tab */}
            <button
              onClick={() => setActiveSubPage(2)}
              className={`transition-all duration-300 px-5 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer h-[58px] ${
                activeSubPage === 2
                  ? 'bg-white text-[#0078d4] font-black border border-slate-100 shadow-lg shadow-blue-900/5'
                  : 'text-slate-400 hover:text-[#0078d4] font-bold'
              }`}
            >
              <Activity className="h-5 w-5 text-[#0078d4] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-black tracking-wider leading-tight">VITAL</span>
                <span className="text-[12px] uppercase font-black tracking-wider leading-tight">FOCUS</span>
              </div>
            </button>
          </div>

          {/* Right spacer to balance back chevron */}
          <div className="w-8" />
        </div>

        {/* Row 2: Breadcrumbs & App Title */}
        <div className="mt-2 flex flex-col items-start px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[#0078d4] font-black uppercase tracking-wider">
            <Smartphone className="h-3.5 w-3.5 text-[#0078d4] stroke-[2.5]" />
            <span>CAREPLUS PORTAL</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#0078d4]/90">{patient.name?.toUpperCase().replace(' ALAN ', ' ')}</span>
          </div>
          
          <div className="relative mt-2">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">My Health Board</h2>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-1 leading-none">
              Clinical Care Center
            </h1>
            {/* Cyan/Teal accent block line under title */}
            <div className="absolute -bottom-1.5 left-0 w-24 h-1 bg-[#B2E6E6] rounded-full opacity-60" />
          </div>
        </div>
      </div>

      {/* --- PAGE 1: AT A GLANCE DASHBOARD --- */}
      {activeSubPage === 1 && (
        <div className="space-y-6 font-sans">
          
          {/* Centered Top Health Score Dial */}
          <div className="flex flex-col items-center justify-center py-4 bg-transparent">
            <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center">
              {/* HEALTH SCORE badge above the dial */}
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0078d4] bg-white border border-slate-100 shadow-2xs px-4 py-1.5 rounded-full">
                  HEALTH SCORE
                </span>
              </div>

              {/* The Outer 3D circular dial container */}
              <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-full bg-gradient-to-b from-[#EBF5FF] to-[#D5EAFF] flex items-center justify-center shadow-[0_16px_40px_rgba(15,108,189,0.14)] border border-white p-4 transition-all duration-300 hover:scale-[1.02]">
                
                {/* Middle Blue track with subtle border */}
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#DEEFFF] to-[#F3F9FF] flex items-center justify-center p-3 relative shadow-[inset_0_2px_8px_rgba(0,120,212,0.05)]">
                  
                  {/* Tiny bright green dot at the bottom right */}
                  <div className="absolute bottom-8 right-8 md:bottom-9 md:right-9 w-3 h-3 rounded-full bg-[#107C41] border-2 border-white shadow-[0_0_8px_rgba(16,124,65,0.6)] z-20" />
                  
                  {/* Inner white solid circle */}
                  <div className="w-32 h-32 md:w-38 md:h-38 rounded-full bg-white flex flex-col items-center justify-center shadow-[0_10px_25px_rgba(0,120,212,0.1)] relative border border-slate-50/50">
                    <span className="text-5xl md:text-6xl font-black text-[#111C24] tracking-tighter select-none">
                      {calculatedHealthScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Consultation Banner */}
          {nextAppointment && (
            <div className="bg-[#EBF3FC] border border-[#C7E0F4] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
              <div className="flex items-center gap-2 text-slate-750 font-bold text-xs">
                <Calendar className="h-4.5 w-4.5 text-[#0078d4] shrink-0" />
                <span>
                  Upcoming consultation: <span className="font-extrabold text-slate-900">{nextAppointment.specialty} follow-up</span> with {nextAppointment.providerName} on {nextAppointment.formattedDate} at {nextAppointment.formattedTime}
                </span>
              </div>
              <button 
                onClick={() => onNavigateTab?.('consultations')} 
                className="text-xs font-black text-[#0078d4] hover:underline cursor-pointer shrink-0 flex items-center gap-1 self-start sm:self-center"
              >
                View details <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Concentric Index & Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Today's Telemetry Factors Checklist */}
            <Card className="md:col-span-12 border border-slate-100 shadow-xs bg-white rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0078d4] flex items-center gap-1.5">
                  <ClipboardList className="h-4.5 w-4.5 text-[#0078d4]" />
                  Telemetry Factors Checklist
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Complete your daily checkpoints to maximize index scoring.</p>
              </div>

              <div className="space-y-3">
                {/* factor 1: meds */}
                <div onClick={() => handleToggleAdherenceFactor('meds')} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/45 hover:bg-slate-50 cursor-pointer transition-all">
                  <span className="font-bold text-slate-700 flex items-center gap-2 text-xs leading-none">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${adherenceMeds ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Medications logged (+10 pts)</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    adherenceMeds ? 'bg-emerald-50 text-emerald-750 border-emerald-100' : 'bg-slate-105 text-slate-400 border-slate-200/50'
                  }`}>{adherenceMeds ? 'Logged' : 'Due'}</span>
                </div>

                {/* factor 2: steps */}
                <div onClick={() => handleToggleAdherenceFactor('steps')} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/45 hover:bg-slate-50 cursor-pointer transition-all">
                  <span className="font-bold text-slate-700 flex items-center gap-2 text-xs leading-none">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${adherenceSteps ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Daily steps goal met (+10 pts)</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    adherenceSteps ? 'bg-emerald-50 text-emerald-750 border-emerald-100' : 'bg-slate-105 text-slate-400 border-slate-200/50'
                  }`}>{adherenceSteps ? 'Met' : 'Pending'}</span>
                </div>

                {/* factor 3: glucose */}
                <div onClick={() => handleToggleAdherenceFactor('glucose')} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/45 hover:bg-slate-50 cursor-pointer transition-all">
                  <span className="font-bold text-slate-700 flex items-center gap-2 text-xs leading-none">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${adherenceGlucose ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Glycemic bounds target (+10 pts)</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    adherenceGlucose ? 'bg-emerald-50 text-emerald-750 border-emerald-100' : 'bg-slate-105 text-slate-400 border-slate-200/50'
                  }`}>{adherenceGlucose ? 'In Bounds' : 'Pending'}</span>
                </div>

                {/* factor 4: sleep */}
                <div onClick={() => handleToggleAdherenceFactor('sleep')} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/45 hover:bg-slate-50 cursor-pointer transition-all">
                  <span className="font-bold text-slate-700 flex items-center gap-2 text-xs leading-none">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${adherenceSleep ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>7.5 hrs restorative sleep (+10 pts)</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    adherenceSleep ? 'bg-emerald-50 text-emerald-750 border-emerald-100' : 'bg-slate-105 text-slate-400 border-slate-200/50'
                  }`}>{adherenceSleep ? 'Met' : 'Pending'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Daily Medication Verification Log */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Daily Medication Verification Log</h4>
                  <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Maintain therapeutic blood plasma stability ranges</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase">Compliance Score</span>
                <p className="text-lg font-extrabold text-[#107c41] leading-none">96%</p>
              </div>
            </div>

            {!adherenceMeds ? (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-amber-900 uppercase tracking-wide">⚠️ Morning Dose Reminder Required</h5>
                  <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                    Take Metformin 500mg, twice daily. Compliance window closes at 12:00 PM. Please log your intake.
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleToggleAdherenceFactor('meds')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl shrink-0 cursor-pointer"
                >
                  Log Medication Taken
                </Button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wide">🎉 Outstanding Compliance Commendation!</h5>
                  <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                    Meds Logged! Splendid job keeping your therapeutic stability high today. Your pathway results show consistent excellence.
                  </p>
                </div>
                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  ✓ Taken & Authenticated
                </span>
              </div>
            )}
          </Card>

          {/* Horizontal Ticker Reel for Clinical Telemetry Alerts at the Bottom */}
          <style>{`
            @keyframes ticker {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-33.3333%, 0, 0); }
            }
            .ticker-wrap {
              overflow: hidden;
              width: 100%;
            }
            .ticker-content {
              display: inline-flex;
              white-space: nowrap;
              animation: ticker 40s linear infinite;
            }
            .ticker-content:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="fixed bottom-[76px] md:bottom-0 left-0 md:left-20 right-0 z-40 bg-[#0F1C2A]/95 text-white py-2.5 shadow-[0_-4px_24px_rgba(0,120,212,0.15)] border-t border-slate-800 backdrop-blur-md flex items-center overflow-hidden h-[38px] select-none font-sans">
            <div className="ticker-wrap flex-1 flex items-center relative">
              <div className="absolute left-0 top-0 bottom-0 px-3 bg-amber-600 flex items-center gap-1.5 z-50 text-[10px] font-black uppercase tracking-wider shadow-[4px_0_12px_rgba(217,119,6,0.3)] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Telemetry Alerts</span>
              </div>
              
              <div className="ticker-content flex gap-16 items-center pl-36">
                {outOfRangeVitals.length > 0 ? (
                  [...Array(3)].flatMap((_, idx) => (
                    outOfRangeVitals.map((ov, itemIdx) => (
                      <span key={`${ov.name}-${idx}-${itemIdx}`} className="text-[11px] font-black tracking-wide flex items-center gap-2">
                        <span className="text-amber-400 font-extrabold">⚠️ ALERT:</span> 
                        <span className="text-slate-200">{ov.name} is <span className="text-amber-300 underline font-black">{ov.value}</span> ({ov.status})</span>
                        <span className="text-slate-400 font-medium">— Target deviation detected. Perform prescribed protocols or notify Dr. Gregory.</span>
                        <span className="text-slate-600 ml-4">•</span>
                      </span>
                    ))
                  ))
                ) : (
                  [...Array(3)].map((_, idx) => (
                    <span key={`stable-${idx}`} className="text-[11px] font-black tracking-wide flex items-center gap-2">
                      <span className="text-emerald-400 font-extrabold">💚 ALL METRICS STABLE:</span> 
                      <span className="text-slate-200">Patient therapeutic index optimal • Metformin Dose compliance active • BP optimal • Glycemic target met</span>
                      <span className="text-slate-600 ml-4">•</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- PAGE 2: VITAL FOCUS --- */}
      {activeSubPage === 2 && (
        <div className="space-y-6 font-sans">
          
          {/* Biometric Wearable Sensors Integration Hub */}
          <Card className="border border-[#EBEFEA] shadow-xs bg-white rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">Biometric Sensor Integration Hub</h4>
                  <p className="text-[11px] text-slate-555 font-semibold mt-0.5">Synchronize telemetry from wearable hardware devices</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-755 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Connected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FAFBF9] border border-[#E9ECE8] rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <Apple className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Apple HealthKit</h5>
                    <p className="text-[10px] text-slate-400 font-bold">Steps, Heart Rate, Spo2</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Synced</span>
              </div>

              <div className="bg-[#FAFBF9] border border-[#E9ECE8] rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Android Connect</h5>
                    <p className="text-[10px] text-slate-400 font-bold">Glucose, Sleep Logs</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Synced</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                alert("Synchronizing live biometric telemetry from Apple HealthKit & Android Connect databases...");
              }}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Live Wearable Sensors & Recalculate Index
            </Button>
          </Card>

          {/* Dedicated Pinned Vitals List */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">Pinned Biometric Vitals</h4>
                <p className="text-[11px] text-slate-555 font-semibold mt-0.5">Drag-order or configure active telemetric monitoring channels</p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button 
                  size="xs" 
                  variant="outline"
                  onClick={() => setShowConfigVitals(!showConfigVitals)}
                  className="h-8 text-[11px] font-bold border-slate-200 hover:bg-slate-50 px-3 rounded-lg text-slate-700"
                >
                  Configure Pins
                </Button>
                <Button 
                  size="xs" 
                  onClick={() => setShowLogModal(true)}
                  className="h-8 text-[11px] font-bold bg-[#0078d4] hover:bg-[#106ebe] text-white px-3 rounded-lg"
                >
                  + Log Vital
                </Button>
              </div>
            </div>

            {showConfigVitals && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black uppercase text-slate-700">Configure Dashboard Biometric Channels</h5>
                  <button onClick={() => setShowConfigVitals(false)} className="text-xs text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Blood Glucose', 'Blood Pressure', 'Heart Rate', 'Oxygen Saturation', 'Sleep Log', 'Daily Steps', 'Body Temperature', 'Hydration Quotient'].map((vt) => {
                    const isPinned = pinnedVitals.includes(vt);
                    return (
                      <button
                        key={vt}
                        onClick={() => {
                          if (isPinned) {
                            setPinnedVitals(pinnedVitals.filter(v => v !== vt));
                          } else {
                            setPinnedVitals([...pinnedVitals, vt]);
                          }
                        }}
                        className={`p-2 rounded-xl text-left border text-[10.5px] font-bold transition-all cursor-pointer ${
                          isPinned ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {vt} {isPinned ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedVitals
                .filter(v => pinnedVitals.includes(v.name))
                .map((v, idx) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.name} className="bg-white border border-slate-100 rounded-2xl p-4.5 hover:border-slate-200 hover:shadow-xs transition-all space-y-3 relative overflow-hidden flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-slate-50 text-slate-600 shrink-0">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h5 className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 leading-none">{v.name}</h5>
                            <p className="text-base font-extrabold text-slate-800 leading-none mt-1.5">{v.value}</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-8 w-full flex items-end">
                        <svg className="w-full h-full text-[#0078d4] opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke={v.colorHex || '#0078d4'}
                            strokeWidth="2"
                            points={v.spark.map((val: number, sidx: number) => {
                              const max = Math.max(...v.spark);
                              const min = Math.min(...v.spark);
                              const range = max - min || 1;
                              const x = (sidx / (v.spark.length - 1)) * 100;
                              const y = 18 - ((val - min) / range) * 16;
                              return `${x},${y}`;
                            }).join(' ')}
                          />
                        </svg>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-bold border-t border-slate-50 pt-2">
                        <span className={`px-2 py-0.5 rounded-full border ${v.statusColor}`}>
                          {v.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleMoveVital(v.name, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                          >
                            ▲
                          </button>
                          <button 
                            onClick={() => handleMoveVital(v.name, 'down')}
                            disabled={idx === pinnedVitals.length - 1}
                            className="p-1 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Interactive Trends & Adherence Analytics */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-3xl p-6 md:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">Interactive Trends & Adherence Analytics</h4>
                <p className="text-[11px] text-slate-555 font-semibold mt-0.5">Visualize biometric metrics and track adherence trajectories</p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {['glucose', 'steps', 'hr'].map((mt) => (
                    <button
                      key={mt}
                      onClick={() => setTrendsChartMetric(mt as any)}
                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer ${
                        trendsChartMetric === mt ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {mt}
                    </button>
                  ))}
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {['3m', '6m'].map((dr) => (
                    <button
                      key={dr}
                      onClick={() => setTrendsDuration(dr as any)}
                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer ${
                        trendsDuration === dr ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {dr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0078d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0078d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2f1" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #edebe9' }} />
                  {trendsChartMetric === 'glucose' ? (
                    <>
                      <Area type="monotone" dataKey="Fasting" stroke="#107c41" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={2} />
                      <Area type="monotone" dataKey="PostMeal" stroke="#0078d4" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={2} />
                    </>
                  ) : trendsChartMetric === 'steps' ? (
                    <Area type="monotone" dataKey="Steps" stroke="#008575" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={2} />
                  ) : (
                    <>
                      <Area type="monotone" dataKey="Resting" stroke="#a80000" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Peak" stroke="#b25900" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={2} />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

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
