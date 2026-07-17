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
  ChevronRight,
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


const OxygenBubblesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    {/* Large main bubble */}
    <circle cx="10" cy="14" r="6" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
    {/* Sheen on main bubble */}
    <path d="M7 11a3.5 3.5 0 0 1 3.5-3.5" stroke="currentColor" strokeWidth="1" opacity="0.7" />
    
    {/* Medium bubble floating up-right */}
    <circle cx="17.5" cy="7.5" r="3.5" stroke="currentColor" fill="currentColor" fillOpacity="0.05" />
    <path d="M16 6a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />

    {/* Small bubble floating far-right */}
    <circle cx="21" cy="14" r="1.5" stroke="currentColor" />

    {/* O2 Text inside the main bubble */}
    <text
      x="10"
      y="16.5"
      textAnchor="middle"
      fontSize="8px"
      fontWeight="900"
      fill="currentColor"
      fontFamily="Inter, system-ui, sans-serif"
      stroke="none"
    >
      O₂
    </text>
  </svg>
);

const nameToMetricMap: Record<string, 'glucose' | 'bp' | 'hr' | 'spo2' | 'rr' | 'sleep' | 'steps' | 'temp' | 'hydration'> = {
  'Blood Glucose': 'glucose',
  'Blood Pressure': 'bp',
  'Heart Rate': 'hr',
  'Oxygen Saturation': 'spo2',
  'Respiratory Rate': 'rr',
  'Sleep Log': 'sleep',
  'Daily Steps': 'steps',
  'Body Temperature': 'temp',
  'Hydration Quotient': 'hydration',
};

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

  // Integrated Multi-Source Vital Data Merger
  // Consolidates clinical-grade measurements from clinicians with continuous wearable telemetry
  const mergedVitals = useMemo(() => {
    // Sort all raw entries descending to scan the latest available inputs first
    const sortedRaw = [...vitals].sort((a, b) => {
      const timeA = a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
      const timeB = b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
      return timeB - timeA;
    });

    const getLatestValue = (field: string, fallbackVal: any, defaultSource: 'clinical' | 'wearable') => {
      for (const rec of sortedRaw) {
        if (rec[field] !== undefined && rec[field] !== null && rec[field] !== '') {
          // Verify positive values if it is a number
          if (typeof rec[field] === 'number' && rec[field] <= 0) continue;
          
          let friendlySource = 'Provider Intake';
          if (rec.source === 'apple_health') friendlySource = 'Apple HealthKit';
          else if (rec.source === 'android_health_connect') friendlySource = 'Android Connect';
          else if (rec.source === 'patient_portal') friendlySource = 'Patient Portal';
          else if (rec.source === 'clinical') friendlySource = 'CarePlus Clinician';
          else if (rec.device && rec.device.toLowerCase().includes('watch')) friendlySource = rec.device;
          else if (rec.authorId === 'uid-wearable-sync') friendlySource = 'Wearable Sensor';

          const isProvider = rec.source === 'clinical' || rec.source === 'clinical_intake' || (rec.authorId && rec.authorId.startsWith('user-'));

          return {
            value: rec[field],
            sourceType: isProvider ? 'provider' : 'wearable',
            friendlySource,
            device: rec.device || (isProvider ? 'Clinical Assessment' : 'Biometric Sensor'),
            timestamp: rec.timestamp || (rec.createdAt?.seconds ? rec.createdAt.seconds * 1000 : 0) || Date.now()
          };
        }
      }
      return {
        value: fallbackVal,
        sourceType: defaultSource,
        friendlySource: defaultSource === 'clinical' ? 'CarePlus Clinician' : 'Wearable Sensor',
        device: defaultSource === 'clinical' ? 'Clinical Assessment' : 'Biometric Sensor',
        timestamp: Date.now()
      };
    };

    return {
      bp: getLatestValue('bp', '118/76', 'clinical'),
      hr: getLatestValue('hr', 72, 'clinical'),
      glucose: getLatestValue('glucose', 104, 'wearable'),
      steps: getLatestValue('steps', 8420, 'wearable'),
      sleep: getLatestValue('sleep', 7.6, 'wearable'),
      spo2: getLatestValue('spo2', 98, 'clinical'),
      temp: getLatestValue('temp', 36.8, 'clinical'),
      hydration: getLatestValue('hydration', 92, 'wearable'),
      rr: getLatestValue('rr', 16, 'clinical'),
    };
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
  const [trendsChartMetric, setTrendsChartMetric] = useState<'glucose' | 'bp' | 'hr' | 'spo2' | 'rr' | 'sleep' | 'steps' | 'temp' | 'hydration'>('glucose');
  const [trendsDuration, setTrendsDuration] = useState<'3m' | '6m'>('3m');
  const [openTrendsModal, setOpenTrendsModal] = useState(false);

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
  const [showSensorHubModal, setShowSensorHubModal] = useState(false);
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

  // Resolve Vitals and Sparklines (using integrated multi-source merged data)
  const sortedVitals = useMemo(() => {
    // Current Values
    const bpVal = mergedVitals.bp.value;
    const hrVal = mergedVitals.hr.value;
    const glucoseVal = mergedVitals.glucose.value;
    const stepsVal = mergedVitals.steps.value;
    const sleepVal = mergedVitals.sleep.value;
    const spo2Val = mergedVitals.spo2.value;
    const tempVal = mergedVitals.temp.value;
    const hydVal = mergedVitals.hydration.value;
    const rrVal = mergedVitals.rr.value;

    // 1. Blood Pressure (BP)
    let bpStatus = 'Normal';
    let bpIsUrgent = false;
    let bpStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    try {
      const parts = bpVal.split('/');
      const sys = Number(parts[0]);
      const dia = Number(parts[1]);
      if (sys >= 180 || dia >= 120) {
        bpStatus = 'CRITICAL ALERT';
        bpIsUrgent = true;
        bpStatusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse font-black';
      } else if (sys >= 140 || dia >= 90) {
        bpStatus = 'Hypertension';
        bpStatusColor = 'text-rose-700 bg-rose-50 border-rose-200 font-bold';
      } else if (sys >= 130 || dia >= 80) {
        bpStatus = 'Elevated';
        bpStatusColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
      } else {
        bpStatus = 'Optimal';
        bpStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
      }
    } catch (e) {
      console.warn("BP parsing error:", e);
    }

    // 2. Heart Rate (Pulse)
    let hrStatus = 'Normal';
    let hrIsUrgent = false;
    let hrStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    if (hrVal < 40 || hrVal > 120) {
      hrStatus = 'CRITICAL ALERT';
      hrIsUrgent = true;
      hrStatusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse font-black';
    } else if (hrVal > 100) {
      hrStatus = 'Tachycardia';
      hrStatusColor = 'text-rose-700 bg-rose-50 border-rose-200 font-bold';
    } else if (hrVal < 60) {
      hrStatus = 'Bradycardia';
      hrStatusColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
    } else {
      hrStatus = 'Resting Balance';
      hrStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    }

    // 3. Respiratory Rate
    let rrStatus = 'Normal';
    let rrIsUrgent = false;
    let rrStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    if (rrVal < 10 || rrVal > 24) {
      rrStatus = 'CRITICAL ALERT';
      rrIsUrgent = true;
      rrStatusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse font-black';
    } else if (rrVal < 12 || rrVal > 20) {
      rrStatus = 'Borderline';
      rrStatusColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
    } else {
      rrStatus = 'Normal';
      rrStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    }

    // 4. Temperature
    let tempStatus = 'Normal';
    let tempIsUrgent = false;
    let tempStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    if (tempVal >= 39.5 || tempVal < 35.0) {
      tempStatus = 'CRITICAL ALERT';
      tempIsUrgent = true;
      tempStatusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse font-black';
    } else if (tempVal >= 37.6 || tempVal < 36.5) {
      tempStatus = 'Borderline';
      tempStatusColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
    } else {
      tempStatus = 'Healthy Range';
      tempStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    }

    // 5. Oxygen Saturation (SpO2)
    let spo2Status = 'Normal';
    let spo2IsUrgent = false;
    let spo2StatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    if (spo2Val <= 92) {
      spo2Status = 'CRITICAL ALERT';
      spo2IsUrgent = true;
      spo2StatusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse font-black';
    } else if (spo2Val <= 94) {
      spo2Status = 'Caution (Low)';
      spo2StatusColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
    } else {
      spo2Status = 'Normal Saturation';
      spo2StatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    }

    // 6. Blood Glucose
    let glucoseStatus = 'Normal';
    let glucoseIsUrgent = false;
    let glucoseStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    if (glucoseVal < 60 || glucoseVal > 300) {
      glucoseStatus = 'CRITICAL ALERT';
      glucoseIsUrgent = true;
      glucoseStatusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse font-black';
    } else if (glucoseVal >= 140) {
      glucoseStatus = 'Elevated';
      glucoseStatusColor = 'text-rose-700 bg-rose-50 border-rose-200 font-bold';
    } else if (glucoseVal >= 100) {
      glucoseStatus = 'Borderline';
      glucoseStatusColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
    } else {
      glucoseStatus = 'Optimal';
      glucoseStatusColor = 'text-[#107c41] bg-emerald-50 border-emerald-200';
    }

    const allVitals = [
      { name: 'Blood Glucose', value: `${glucoseVal} mg/dL`, status: glucoseStatus, isUrgent: glucoseIsUrgent, statusColor: glucoseStatusColor, spark: [92, 115, 108, 125, glucoseVal], colorHex: '#107c41', icon: Droplet, metadata: mergedVitals.glucose },
      { name: 'Blood Pressure', value: `${bpVal} mmHg`, status: bpStatus, isUrgent: bpIsUrgent, statusColor: bpStatusColor, spark: [116, 122, 118, 120, 118], colorHex: '#0078d4', icon: Gauge, metadata: mergedVitals.bp },
      { name: 'Heart Rate', value: `${hrVal} bpm`, status: hrStatus, isUrgent: hrIsUrgent, statusColor: hrStatusColor, spark: [68, 74, 82, 69, hrVal], colorHex: '#a80000', icon: Heart, metadata: mergedVitals.hr },
      { name: 'Oxygen Saturation', value: `${spo2Val}%`, status: spo2Status, isUrgent: spo2IsUrgent, statusColor: spo2StatusColor, spark: [98, 99, 98, 97, spo2Val], colorHex: '#008575', icon: OxygenBubblesIcon, metadata: mergedVitals.spo2 },
      { name: 'Respiratory Rate', value: `${rrVal} breaths/min`, status: rrStatus, isUrgent: rrIsUrgent, statusColor: rrStatusColor, spark: [14, 18, 15, 17, rrVal], colorHex: '#008575', icon: Activity, metadata: mergedVitals.rr },
      { name: 'Sleep Log', value: `${sleepVal} hrs`, status: 'Restful Window', isUrgent: false, statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [7.2, 8.1, 7.5, 6.9, sleepVal], colorHex: '#5c2d91', icon: Moon, metadata: mergedVitals.sleep },
      { name: 'Daily Steps', value: `${stepsVal.toLocaleString()} steps`, status: stepsVal >= 8000 ? 'Target Met' : 'Active Progress', isUrgent: false, statusColor: stepsVal >= 8000 ? 'text-[#107c41] bg-emerald-50 border-emerald-200' : 'text-[#b25900] bg-amber-50 border-amber-200', spark: [6500, 8900, 7200, 9300, stepsVal], colorHex: '#107c41', icon: TrendingUp, metadata: mergedVitals.steps },
      { name: 'Body Temperature', value: `${tempVal}°C`, status: tempStatus, isUrgent: tempIsUrgent, statusColor: tempStatusColor, spark: [36.6, 36.7, 36.9, 36.8, tempVal], colorHex: '#b25900', icon: Thermometer, metadata: mergedVitals.temp },
      { name: 'Hydration Quotient', value: `${hydVal}%`, status: 'Optimally Hydrated', isUrgent: false, statusColor: 'text-[#107c41] bg-emerald-50 border-emerald-200', spark: [88, 95, 90, 94, hydVal], colorHex: '#0078d4', icon: Droplet, metadata: mergedVitals.hydration }
    ];

    return allVitals;
  }, [mergedVitals]);

  const outOfRangeVitals = useMemo(() => {
    return sortedVitals.filter(v => v.isUrgent || (v.status && !['Optimal', 'Stable', 'Normal', 'Remission', 'Healthy Range', 'Restful Window', 'Resting Balance', 'Optimally Hydrated', 'Target Met', 'Normal Saturation'].includes(v.status)));
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
        value: [110, 105, 98, 115, 102, 100][idx % 6],
      }));
    } else if (trendsChartMetric === 'steps') {
      return months.map((m, idx) => ({
        name: m,
        value: [7800, 8420, 8100, 9100, 8300, 8900][idx % 6],
      }));
    } else if (trendsChartMetric === 'hr') {
      return months.map((m, idx) => ({
        name: m,
        value: [72, 70, 68, 64, 66, 62][idx % 6],
      }));
    } else if (trendsChartMetric === 'bp') {
      return months.map((m, idx) => ({
        name: m,
        systolic: [132, 128, 122, 135, 125, 118][idx % 6],
        diastolic: [84, 82, 78, 88, 80, 75][idx % 6],
      }));
    } else if (trendsChartMetric === 'spo2') {
      return months.map((m, idx) => ({
        name: m,
        value: [98, 97, 98, 99, 98, 99][idx % 6],
      }));
    } else if (trendsChartMetric === 'rr') {
      return months.map((m, idx) => ({
        name: m,
        value: [15, 16, 14, 17, 15, 16][idx % 6],
      }));
    } else if (trendsChartMetric === 'sleep') {
      return months.map((m, idx) => ({
        name: m,
        value: [7.1, 7.5, 7.8, 6.9, 7.2, 7.6][idx % 6],
      }));
    } else if (trendsChartMetric === 'temp') {
      return months.map((m, idx) => ({
        name: m,
        value: [36.6, 36.7, 36.8, 36.5, 36.7, 36.8][idx % 6],
      }));
    } else if (trendsChartMetric === 'hydration') {
      return months.map((m, idx) => ({
        name: m,
        value: [85, 90, 88, 92, 91, 94][idx % 6],
      }));
    }
    return [];
  }, [trendsChartMetric, trendsDuration]);

  const calculateTrend = (data: any[]) => {
    if (!data || data.length < 2) return { percent: 0, direction: 'neutral' };
    
    let first, last;
    if (trendsChartMetric === 'bp') {
      first = data[0].systolic;
      last = data[data.length - 1].systolic;
    } else {
      first = data[0].value;
      last = data[data.length - 1].value;
    }
    
    const percent = Math.round(((last - first) / first) * 100);
    const direction = (trendsChartMetric === 'steps' || trendsChartMetric === 'bp') 
      ? (last < first ? 'down' : 'up')
      : (last < first ? 'down' : 'up');
    
    return { percent: Math.abs(percent), direction };
  };

  const trend = calculateTrend(chartData);

  // Metric label helper
  const metricLabel = {
    glucose: 'Blood Glucose',
    bp: 'Blood Pressure',
    hr: 'Heart Rate',
    spo2: 'Oxygen Saturation',
    rr: 'Respiratory Rate',
    sleep: 'Sleep Log',
    steps: 'Daily Steps',
    temp: 'Body Temperature',
    hydration: 'Hydration Quotient'
  }[trendsChartMetric];

  const successDirection = ['glucose', 'hr', 'bp', 'rr', 'temp'].includes(trendsChartMetric) ? 'down' : 'up';
  const isTrendGood = trend.direction === successDirection;

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

  const metricColors: Record<string, { stroke: string; stopColor: string }> = {
    glucose: { stroke: '#107c41', stopColor: '#107c41' },
    bp: { stroke: '#0078d4', stopColor: '#0078d4' },
    hr: { stroke: '#a80000', stopColor: '#a80000' },
    spo2: { stroke: '#008575', stopColor: '#008575' },
    rr: { stroke: '#008575', stopColor: '#008575' },
    sleep: { stroke: '#5c2d91', stopColor: '#5c2d91' },
    steps: { stroke: '#107c41', stopColor: '#107c41' },
    temp: { stroke: '#b25900', stopColor: '#b25900' },
    hydration: { stroke: '#0078d4', stopColor: '#0078d4' },
  };
  const activeColor = metricColors[trendsChartMetric] || { stroke: '#0078d4', stopColor: '#0078d4' };

  return (
    <div className="space-y-6 font-sans">
      
      {/* High-Fidelity Header & Segmented Tab Navigation Controls */}
      <div className="flex flex-col gap-4 pb-4 bg-transparent border-b border-slate-200/40">
        
        {/* Row 1: Back Chevron & Two Stacked Tabs */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {/* Back Chevron */}
          <button 
            onClick={() => {
              if (activeSubPage === 2 || activeSubPage === 3) {
                setActiveSubPage(1);
              }
            }}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors" 
            title="Go Back"
          >
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

            {/* Medications Tab */}
            <button
              onClick={() => setActiveSubPage(3)}
              className={`transition-all duration-300 px-5 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer h-[58px] ${
                activeSubPage === 3
                  ? 'bg-white text-[#0078d4] font-black border border-slate-100 shadow-lg shadow-blue-900/5'
                  : 'text-slate-400 hover:text-[#0078d4] font-bold'
              }`}
            >
              <Pill className="h-5 w-5 text-[#0078d4] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-black tracking-wider leading-tight">MY</span>
                <span className="text-[12px] uppercase font-black tracking-wider leading-tight">MEDS</span>
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

          <div className="mt-5">
            <Button
              id="my-connected-accessories-btn"
              onClick={() => setShowSensorHubModal(true)}
              className="bg-sky-50 text-[#0078d4] hover:bg-sky-100 border border-sky-100 hover:border-sky-200 font-extrabold text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-3xs"
            >
              <Smartphone className="h-4 w-4 text-[#0078d4] shrink-0" />
              <span>My Connected Accessories</span>
            </Button>
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
              <button 
                onClick={() => setActiveSubPage(3)}
                className="flex items-center gap-2 text-left hover:opacity-80 transition-all cursor-pointer group"
              >
                <div className="bg-amber-100 p-2 rounded-xl text-amber-700 group-hover:bg-amber-200 transition-all">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1 group-hover:text-[#0078d4] transition-all">
                    Daily Medication Verification Log
                    <ChevronRight className="h-4.5 w-4.5 text-[#0078d4] stroke-[3]" />
                  </h4>
                  <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Maintain therapeutic blood plasma stability ranges</p>
                </div>
              </button>
              <button 
                onClick={() => setActiveSubPage(3)}
                className="text-right hover:opacity-80 transition-all cursor-pointer"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase">Compliance Score</span>
                <p className="text-lg font-extrabold text-[#107c41] leading-none">96%</p>
              </button>
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

            <div className="pt-2 border-t border-slate-50 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveSubPage(3)}
                className="text-xs font-black text-[#0078d4] hover:text-[#005a9e] flex items-center gap-1 cursor-pointer"
              >
                Go to Medications Page
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
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
              <div className="absolute left-0 top-0 bottom-0 px-3 bg-red-600 flex items-center gap-1.5 z-50 text-[10px] font-black uppercase tracking-wider shadow-[4px_0_12px_rgba(220,38,38,0.3)] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Telemetry Alerts</span>
              </div>
              
              <div className="ticker-content flex gap-16 items-center pl-36">
                {outOfRangeVitals.length > 0 ? (
                  [...Array(3)].flatMap((_, idx) => (
                    outOfRangeVitals.map((ov, itemIdx) => {
                      const getUrgentGuidance = (name: string) => {
                        switch (name) {
                          case 'Blood Pressure':
                            return "BP threshold breached. Seek emergency care immediately if accompanied by chest pain, shortness of breath, severe headache, or vision changes.";
                          case 'Heart Rate':
                            return "Pulse rate threshold breached (<40 or >120 bpm at rest). Seek urgent clinical evaluation.";
                          case 'Respiratory Rate':
                            return "Respiration threshold breached. Seek immediate attention if difficulty breathing, gasping, or unable to speak full sentences.";
                          case 'Body Temperature':
                            return "Temperature anomaly. Seek immediate care if temperature is ≥39.5°C (103°F) or <35°C (95°F).";
                          case 'Oxygen Saturation':
                            return "Oxygen Saturation ≤ 92% is a critical indicator. Seek emergency medical attention immediately.";
                          case 'Blood Glucose':
                            return "Glucose out of bounds (<60 or >300 mg/dL). Risk of immediate hypoglycemia or DKA. Seek urgent care.";
                          default:
                            return "Target deviation detected. Follow emergency action protocols or notify your clinician.";
                        }
                      };

                      return (
                        <span key={`${ov.name}-${idx}-${itemIdx}`} className="text-[11px] font-black tracking-wide flex items-center gap-2">
                          {ov.isUrgent ? (
                            <>
                              <span className="text-red-500 font-black animate-pulse bg-red-950/40 px-2 py-0.5 rounded border border-red-800">🚨 CRITICAL URGENT ALERT:</span> 
                              <span className="text-red-100">{ov.name} is <span className="text-red-400 underline font-black">{ov.value}</span> ({ov.status})</span>
                              <span className="text-red-300 font-medium">— {getUrgentGuidance(ov.name)}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-amber-400 font-extrabold">⚠️ ELEVATED ALERT:</span> 
                              <span className="text-slate-200">{ov.name} is <span className="text-amber-300 underline font-black">{ov.value}</span> ({ov.status})</span>
                              <span className="text-slate-400 font-medium">— Metric is outside optimal therapeutic ranges. Log trends and monitor.</span>
                            </>
                          )}
                          <span className="text-slate-600 ml-4">•</span>
                        </span>
                      );
                    })
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
          
          {/* Dedicated Pinned Vitals List */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 border-b border-slate-100 pb-3">
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
                  const metricKey = nameToMetricMap[v.name];
                  return (
                    <div 
                      key={v.name} 
                      onClick={() => {
                        if (metricKey) {
                          setTrendsChartMetric(metricKey);
                          setOpenTrendsModal(true);
                        }
                      }}
                      className="bg-white border border-slate-100 rounded-2xl p-4.5 hover:border-slate-300 hover:shadow-sm transition-all space-y-3 relative overflow-hidden flex flex-col justify-between cursor-pointer group/card"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 shrink-0 group-hover/card:bg-slate-100 transition-colors">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h5 className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 leading-none">{v.name}</h5>
                              <p className="text-base font-extrabold text-slate-800 leading-none mt-1.5">{v.value}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8.5px] text-[#0078d4] opacity-0 group-hover/card:opacity-100 transition-opacity font-bold uppercase tracking-wider flex items-center gap-0.5 mr-0.5">
                              Trends
                            </span>
                            {v.metadata && (
                              <div className="relative group self-start" onClick={(e) => e.stopPropagation()}>
                                <Info className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer" />
                                <div className="absolute right-0 top-5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold p-2.5 rounded-xl shadow-lg z-50 w-52 border border-slate-800 space-y-1">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Provenance Log</span>
                                    <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded-sm ${
                                      v.metadata.sourceType === 'provider' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/30' : 'bg-sky-950 text-sky-300 border border-sky-800/30'
                                    }`}>
                                      {v.metadata.sourceType === 'provider' ? 'Clinical' : 'Wearable'}
                                    </span>
                                  </div>
                                  <div className="text-slate-200">
                                    <span className="text-slate-400">Source:</span> {v.metadata.friendlySource}
                                  </div>
                                  <div className="text-slate-200">
                                    <span className="text-slate-400">Device:</span> {v.metadata.device}
                                  </div>
                                  <div className="text-slate-300 text-[8.5px] pt-1">
                                    {new Date(v.metadata.timestamp).toLocaleDateString(undefined, { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-8 w-full flex items-end">
                        <svg className="w-full h-full text-[#0078d4] opacity-80 group-hover/card:scale-y-110 transition-transform origin-bottom" viewBox="0 0 100 20" preserveAspectRatio="none">
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
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveVital(v.name, 'up');
                            }}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer text-slate-400 hover:text-slate-700"
                          >
                            ▲
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveVital(v.name, 'down');
                            }}
                            disabled={idx === pinnedVitals.length - 1}
                            className="p-1 rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer text-slate-400 hover:text-slate-700"
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

        </div>
      )}

      {/* --- PAGE 3: MY MEDICATIONS & COMPLIANCE --- */}
      {activeSubPage === 3 && (
        <div className="space-y-6 font-sans">
          
          {/* Medications Hub Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Active Prescriptions</span>
              <p className="text-xl font-black text-slate-800 mt-1">
                {prescriptions.filter((p: any) => p.status === 'active' || !p.status).length} Meds
              </p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Adherence Level</span>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-xl font-black text-emerald-600">96%</p>
                <span className="text-[9px] font-bold text-slate-400">Therapeutic</span>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Refill Requests Pending</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {submittingRefillId ? 1 : 0} Active
              </p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Symptom Logs</span>
              <p className="text-xl font-black text-sky-600 mt-1">
                {diaryNotes.length} Logged
              </p>
            </div>
          </div>

          {refillSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>{refillSuccessMessage}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Medications List (span-2) */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-slate-100 shadow-3xs bg-white rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Current Prescribed Meds</h3>
                    <p className="text-[10.5px] text-slate-400 font-bold">Review clinical instructions, refills remaining, and pill count counts</p>
                  </div>
                  <Badge className="bg-[#0078d4]/10 text-[#0078d4] hover:bg-[#0078d4]/15 border-none font-bold text-[10px] uppercase">
                    Pharmacotherapy Portal
                  </Badge>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium">
                      No medications are currently logged or prescribed.
                    </div>
                  ) : (
                    prescriptions.map((med: any, idx: number) => {
                      const isActive = med.status === 'active' || !med.status;
                      const needRefill = med.refills === 0;
                      const isRequesting = submittingRefillId === med.id;

                      return (
                        <div key={med.id || idx} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                                <Pill className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                  {med.medicationName}
                                  <span className="text-xs font-semibold text-slate-500">({med.dosage})</span>
                                </h4>
                                <p className="text-[11px] text-[#0078d4] font-black uppercase tracking-wide mt-0.5">
                                  {med.frequency} • {med.route}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isActive ? (
                                <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  Active Course
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                                  Completed/Inactive
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Sig instructions box */}
                          <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl text-[11px] text-slate-600 leading-relaxed font-semibold">
                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Dosing Instructions (Sig):</span>
                            {med.sig || 'Take exactly as prescribed by your medical professional.'}
                          </div>

                          {/* Countdown Refills & Last Count Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-bold">Refills Available:</span>
                              <span className={`font-black ${needRefill ? 'text-rose-600' : 'text-slate-800'}`}>
                                {med.refills} left
                              </span>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-bold">Pill Count / Days Left:</span>
                              <span className="font-black text-slate-800">
                                {isActive ? (needRefill ? '14 pills remaining (7 days left)' : '56 pills remaining (28 days left)') : '0 pills remaining'}
                              </span>
                            </div>
                          </div>

                          {/* Refill Action Bar */}
                          {isActive && (
                            <div className="flex items-center justify-between gap-3 pt-2">
                              {needRefill ? (
                                <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                  <span>Prescription depleted. Urgent refill request required.</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>Sufficient supply active. Next count scheduled.</span>
                                </div>
                              )}

                              <Button
                                size="xs"
                                disabled={isRequesting}
                                onClick={() => handleTriggerRefill(med.id || 'rx-custom', med.medicationName)}
                                className={`h-8 font-black text-[10.5px] uppercase px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                                  needRefill 
                                    ? 'bg-rose-600 hover:bg-rose-750 text-white animate-pulse' 
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                {isRequesting ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    <span>Transmitting...</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3" />
                                    <span>Request Refill</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Compliance & Symptom Logs (span-1) */}
            <div className="space-y-6">
              
              {/* Compliance checklist */}
              <Card className="border border-slate-100 shadow-3xs bg-white rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Compliance Log</h4>
                  <span className="text-[10px] font-black text-[#107c41] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">96% Status</span>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Verify today's prescribed medication intake to maintain therapeutic blood stability and logging metrics:
                  </p>

                  <div className="space-y-2">
                    <div 
                      onClick={() => handleToggleAdherenceFactor('meds')}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 cursor-pointer transition-all"
                    >
                      <span className="font-bold text-slate-700 flex items-center gap-2 text-xs leading-none">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${adherenceMeds ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Morning Dose Intake</span>
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        adherenceMeds ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>{adherenceMeds ? 'Taken' : 'Log'}</span>
                    </div>

                    <div 
                      onClick={() => {
                        alert("Intake status saved successfully. Compliance statistics re-indexed.");
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 cursor-pointer transition-all"
                    >
                      <span className="font-bold text-slate-700 flex items-center gap-2 text-xs leading-none">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-slate-300" />
                        <span>Evening Dose Intake</span>
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border bg-slate-100 text-slate-400 border-slate-200">Pending</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Persona Symptom Notes */}
              <Card className="border border-slate-100 shadow-3xs bg-white rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Persona Symptom Notes</h4>
                  <Badge className="bg-[#0078d4]/5 text-[#0078d4] border-none font-bold text-[9px] uppercase">
                    Patient Diary
                  </Badge>
                </div>

                <div className="space-y-3 font-medium">
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Log any symptoms, secondary reactions, or personal responses for your next medical consultation review:
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={newDiaryNote}
                      onChange={(e) => setNewDiaryNote(e.target.value)}
                      placeholder="e.g., Slight finger joint morning stiffness, resolved in 30 mins. Mild nausea after Metformin dose."
                      className="w-full h-20 p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0078d4] focus:border-transparent font-medium text-slate-800 leading-normal"
                    />

                    <Button
                      size="sm"
                      onClick={handleSaveDiaryEntry}
                      disabled={!newDiaryNote.trim()}
                      className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white font-black text-xs h-9 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Symptom Entry
                    </Button>
                  </div>

                  {/* Log history list */}
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Recent Logged Notes:</span>
                    <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                      {diaryNotes.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-4">No symptom notes logged yet.</p>
                      ) : (
                        diaryNotes.map((note) => (
                          <div key={note.id} className="bg-slate-50/70 border border-slate-100/70 p-3 rounded-xl space-y-1.5 relative group">
                            <button
                              onClick={() => handleDeleteDiaryEntry(note.id)}
                              className="absolute top-2.5 right-2.5 text-slate-350 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Delete log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-[9px] font-black text-slate-400 block">
                              {note.time}
                            </span>
                            <p className="text-xs text-slate-700 font-semibold leading-relaxed pr-6">
                              {note.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>

            </div>

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

      {/* --- BIOMETRIC SENSOR INTEGRATION HUB MODAL --- */}
      {showSensorHubModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full shadow-lg overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Biometric Sensor Integration Hub
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Synchronize telemetry from wearable hardware devices</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSensorHubModal(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Connection Status:</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-755 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Connected
                </span>
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
            </div>
          </motion.div>
        </div>
      )}

      {/* --- TRENDS DETAIL ANALYSIS MODAL --- */}
      {openTrendsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-100 rounded-3xl max-w-2xl w-full shadow-lg overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-sky-50 p-2.5 rounded-xl text-[#0078d4]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Biometric Trends
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setOpenTrendsModal(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Metric Buttons & Durations */}
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Select Biometric Focus Channel</span>
                  <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {[
                      { id: 'glucose', label: 'Glucose' },
                      { id: 'bp', label: 'BP' },
                      { id: 'hr', label: 'HR' },
                      { id: 'spo2', label: 'SPO₂' },
                      { id: 'rr', label: 'RR' },
                      { id: 'sleep', label: 'Sleep' },
                      { id: 'steps', label: 'Steps' },
                      { id: 'temp', label: 'Temp' },
                      { id: 'hydration', label: 'Hydration' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTrendsChartMetric(item.id as any)}
                        className={`px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                          trendsChartMetric === item.id 
                            ? 'bg-white text-slate-800 shadow-3xs border-slate-200 border' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Selected Channel</span>
                    <h5 className="text-sm font-extrabold text-slate-850 uppercase mt-0.5">{metricLabel}</h5>
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

              {/* Trajectory details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Trend Trajectory:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    isTrendGood 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {trend.direction === 'up' ? '▲' : '▼'} {trend.percent}% {trend.direction} 
                    <span className="text-[9px] font-normal font-sans opacity-75 ml-1">
                      ({isTrendGood ? 'Optimal Improvement' : 'Needs Intervention'})
                    </span>
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-500">
                  Target Direction: <span className="uppercase text-[#0078d4] font-black">{successDirection}</span>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-64 w-full bg-white border border-slate-100 p-4 rounded-2xl">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modalDynamicGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeColor.stopColor} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={activeColor.stopColor} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="modalBpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#185FA5" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#185FA5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2f1" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
                      formatter={(value, name) => {
                        if (name === 'systolic') return [`${value} mmHg`, 'Systolic'];
                        if (name === 'diastolic') return [`${value} mmHg`, 'Diastolic'];
                        if (trendsChartMetric === 'steps') return [`${value.toLocaleString()} steps`, 'Steps'];
                        if (trendsChartMetric === 'hr') return [`${value} bpm`, 'HR'];
                        if (trendsChartMetric === 'glucose') return [`${value} mg/dL`, 'Glucose'];
                        if (trendsChartMetric === 'spo2') return [`${value}%`, 'Oxygen Saturation'];
                        if (trendsChartMetric === 'rr') return [`${value} breaths/min`, 'Respiratory Rate'];
                        if (trendsChartMetric === 'sleep') return [`${value} hrs`, 'Sleep Log'];
                        if (trendsChartMetric === 'temp') return [`${value}°C`, 'Body Temperature'];
                        if (trendsChartMetric === 'hydration') return [`${value}%`, 'Hydration Quotient'];
                        return [value, name];
                      }}
                    />
                    
                    {trendsChartMetric === 'bp' ? (
                      <>
                        <Area type="monotone" dataKey="systolic" stroke="#185FA5" fill="url(#modalBpGrad)" strokeWidth={2.5} />
                        <Area type="monotone" dataKey="diastolic" stroke="#185FA5" fill="none" strokeWidth={1.2} strokeDasharray="2 2" opacity={0.5} />
                      </>
                    ) : (
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={activeColor.stroke} 
                        fill="url(#modalDynamicGradient)"
                        strokeWidth={2.5}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* BP Legend if needed */}
              {trendsChartMetric === 'bp' && (
                <div className="flex gap-2 items-center text-[11px] text-slate-500 justify-center">
                  <span className="w-3 h-0.5 bg-[#185FA5]"></span>
                  <span className="font-semibold text-slate-650">Systolic</span>
                  <span className="w-3 h-0.5 border-t border-dashed border-[#185FA5] opacity-50 ml-3"></span>
                  <span className="font-semibold text-[#185FA5]">Diastolic</span>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <Button
                onClick={() => setOpenTrendsModal(false)}
                className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-5 rounded-xl cursor-pointer"
              >
                Close Analysis
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

export default HealthBoard;
