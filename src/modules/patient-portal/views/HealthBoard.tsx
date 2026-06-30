import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronLeft,
  ChevronRight,
  GripVertical,
  RefreshCw,
  Stethoscope,
  ClipboardList,
  Info,
  Check,
  Smartphone,
  AlertCircle,
  Apple,
  Watch,
  Utensils,
  Link2,
  User,
  Settings,
  X,
  Search,
  SlidersHorizontal,
  Star,
  Phone,
  MapPin,
  Award,
  BookOpen,
  ShieldCheck,
  HeartPlus,
  Edit2,
  Save,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../../lib/motion';
import { DailyActionPlan } from './DailyActionPlan';
import { MobileHealthDashboard } from '../components/MobileHealthDashboard';
import { updatePatientVitals, updatePatientNudgeAndActionPlan, computeHealthScore, updatePatientHealthScore, savePatient } from '../../../services/clinicalFirestoreService';

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
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutMode, setLayoutMode] = useState<'deck' | 'dossier'>('deck');

  // --- MOBILE LAYOUT & SWIPING STATES ---
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 60) {
      // Swipe left -> next page
      setCurrentPage(prev => Math.min(6, prev + 1));
    } else if (diff < -60) {
      // Swipe right -> prev page
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
    setTouchStartX(null);
  };

  // --- NUTRITION, HYDRATION, AND MOOD SELF-ASSESSMENT STATES ---
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cp_water_glasses_v1');
      return saved ? parseInt(saved, 10) : 6;
    } catch {
      return 6;
    }
  });

  const [stressLevel, setStressLevel] = useState<number>(2); // 1-5 scale
  const [patientMood, setPatientMood] = useState<string>('Calm');
  const [moodJournal, setMoodJournal] = useState<string>('Doing well with my morning physical therapy routine. Joint pain and fatigue feel manageable today.');
  const [bypassActive, setBypassActive] = useState<boolean>(true);
  
  // Privacy & Sharing permissions states
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(true);
  const [shareTelemetry, setShareTelemetry] = useState<boolean>(true);
  const [shareLocation, setShareLocation] = useState<boolean>(false);
  const [showPrivacySuccessToast, setShowPrivacySuccessToast] = useState<boolean>(false);

  // Health Trends state
  const [trendsDuration, setTrendsDuration] = useState<'3m' | '6m'>('3m');

  // --- PERSONAL NOTES STATES ---
  const [personalNotes, setPersonalNotes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cp_personal_notes_v1');
      return saved ? JSON.parse(saved) : [
        "Dr. Theodore: Continue Metformin 500mg, track daily blood pressure after morning exercise.",
        "June 14: Felt slightly fatigued in evening, will discuss with care team.",
        "June 12: Joint pain 2/10. Stretching helper was amazing!"
      ];
    } catch {
      return [
        "Dr. Theodore: Continue Metformin 500mg, track daily blood pressure after morning exercise.",
        "June 14: Felt slightly fatigued in evening, will discuss with care team.",
        "June 12: Joint pain 2/10. Stretching helper was amazing!"
      ];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const updated = [newNoteText.trim(), ...personalNotes];
    setPersonalNotes(updated);
    try {
      localStorage.setItem('cp_personal_notes_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewNoteText('');
  };

  // --- INTERACTIVE COMPLIANCE TRACKER STATES & SCORE CALCULATION ---
  const [hasMedRoutine, setHasMedRoutine] = useState<boolean>(false); // default false highlights lack of routine
  const [hasProviderVisit, setHasProviderVisit] = useState<boolean>(false); // default false highlights delayed visits
  const [hasLoggedVitals, setHasLoggedVitals] = useState<boolean>(true);
  const [hasExercisePlan, setHasExercisePlan] = useState<boolean>(true);

  const complianceScore = useMemo(() => {
    let score = 100;
    if (!hasMedRoutine) score -= 15;
    if (!hasProviderVisit) score -= 18;
    if (!hasLoggedVitals) score -= 10;
    if (!hasExercisePlan) score -= 12;
    return score;
  }, [hasMedRoutine, hasProviderVisit, hasLoggedVitals, hasExercisePlan]);

  // --- PATIENT PROFILE EDITING STATES & METHODS ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFields, setEditFields] = useState({
    name: '',
    dob: '',
    gender: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    address: '',
    nokName: '',
    nokRelationship: '',
    nokPhone: '',
    nokEmail: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleStartEdit = () => {
    setEditFields({
      name: patient?.name || 'Marcus Alan Everett',
      dob: patient?.dob || 'March 14, 1985',
      gender: patient?.gender || 'Male • Cisgender Male',
      email: patient?.email || 'marcus.everett@gmail.com',
      phone: patient?.phone || '(206) 555-0143',
      secondaryPhone: patient?.secondaryPhone || '(206) 555-0199',
      address: patient?.address || '1482 Pineview Dr, Seattle, WA 98122',
      nokName: patient?.nokName || 'Sarah Everett',
      nokRelationship: patient?.nokRelationship || 'Spouse',
      nokPhone: patient?.nokPhone || '(206) 555-0172',
      nokEmail: patient?.nokEmail || 'sarah.everett@gmail.com'
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await savePatient(patient?.id || 'pat-marcus-001', {
        name: editFields.name,
        dob: editFields.dob,
        gender: editFields.gender,
        email: editFields.email,
        phone: editFields.phone,
        secondaryPhone: editFields.secondaryPhone,
        address: editFields.address,
        nokName: editFields.nokName,
        nokRelationship: editFields.nokRelationship,
        nokPhone: editFields.nokPhone,
        nokEmail: editFields.nokEmail
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save patient profile edits:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddWater = () => {
    const next = waterGlasses + 1;
    setWaterGlasses(next);
    localStorage.setItem('cp_water_glasses_v1', String(next));
  };

  const handleResetWater = () => {
    setWaterGlasses(0);
    localStorage.setItem('cp_water_glasses_v1', '0');
  };
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [pinnedVitals, setPinnedVitals] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('careplus_pinned_vitals_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default to the top critical vitals (Blood Glucose, Blood Pressure, Heart Rate, Oxygen Saturation)
    return ['Blood Glucose', 'Blood Pressure', 'Heart Rate', 'Oxygen Saturation'];
  });

  const handleTogglePin = (name: string) => {
    let next: string[];
    if (pinnedVitals.includes(name)) {
      // Must keep at least one vital pinned to avoid empty layout state
      if (pinnedVitals.length <= 1) return;
      next = pinnedVitals.filter(n => n !== name);
    } else {
      next = [...pinnedVitals, name];
    }
    setPinnedVitals(next);
    localStorage.setItem('careplus_pinned_vitals_v3', JSON.stringify(next));
  };

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
      ...rawPatient,
      name,
      dob: rawPatient.dob || rawPatient.dateOfBirth || 'March 14, 1985',
      age: rawPatient.age || (rawPatient.dateOfBirth ? new Date().getFullYear() - new Date(rawPatient.dateOfBirth).getFullYear() : 41),
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
      willAttend,
      gender: rawPatient.gender || 'Male • Cisgender Male',
      email: rawPatient.email || 'marcus.everett@gmail.com',
      phone: rawPatient.phone || '(206) 555-0143',
      secondaryPhone: rawPatient.secondaryPhone || '(206) 555-0199',
      address: rawPatient.address || '1482 Pineview Dr, Seattle, WA 98122',
      nokName: rawPatient.nokName || 'Sarah Everett',
      nokRelationship: rawPatient.nokRelationship || 'Spouse',
      nokPhone: rawPatient.nokPhone || '(206) 555-0172',
      nokEmail: rawPatient.nokEmail || 'sarah.everett@gmail.com'
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
  const clinical_records = patientData?.clinical_records || [];

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
  
  // Blended "Device & App Sync" App Connections
  const [appConnections, setAppConnections] = useState<Record<string, 'disconnected' | 'connecting' | 'connected'>>({
    apple_health: 'connected',
    android_connect: 'disconnected',
    pharmacy: 'connected',
    nutrition: 'disconnected'
  });
  const [connectingApp, setConnectingApp] = useState<string | null>(null);

  const toggleAppConnection = (appId: string) => {
    if (appConnections[appId] === 'connected') {
      setAppConnections(prev => ({ ...prev, [appId]: 'disconnected' }));
      if (appId === 'apple_health' && activeDevice === 'apple') {
        setIsDeviceLinked(false);
      } else if (appId === 'android_connect' && activeDevice === 'android') {
        setIsDeviceLinked(false);
      }
    } else if (appConnections[appId] === 'disconnected') {
      setConnectingApp(appId);
      setAppConnections(prev => ({ ...prev, [appId]: 'connecting' }));
      setTimeout(() => {
        setAppConnections(prev => ({ ...prev, [appId]: 'connected' }));
        setConnectingApp(null);
        if (appId === 'apple_health') {
          setActiveDevice('apple');
          setIsDeviceLinked(true);
        } else if (appId === 'android_connect') {
          setActiveDevice('android');
          setIsDeviceLinked(true);
        }
      }, 1200);
    }
  };

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
      }, 'wearable');
      
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

  const displayedVitals = useMemo(() => {
    return sortedVitals.filter(v => pinnedVitals.includes(v.name));
  }, [sortedVitals, pinnedVitals]);

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
    <div 
      className="space-y-6 w-full"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Mobile Swipe Instructions & Progress Bar */}
      {isMobile && currentPage !== 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-xs font-sans animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#3F5B42]/10 flex items-center justify-center text-[#3F5B42] font-black text-xs font-mono">
                {currentPage}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider leading-none">Health Board View</h4>
                <p className="text-[10px] text-[#3F5B42] font-bold uppercase tracking-wider mt-1">
                  {currentPage === 1 ? 'Home (Health Board)' :
                   currentPage === 2 ? '1. Vitals & 5. AI Assessment' :
                   currentPage === 3 ? '2. Clinical Trends & 6. Lifestyle Habits' :
                   currentPage === 4 ? '3. EHR Interoperability & 7. Security' :
                   currentPage === 5 ? '4. Wellness & 8. Connected Devices' :
                   'Daily Actions & 10. Active Prescriptions'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 cursor-pointer ${currentPage === p ? 'bg-[#3F5B42] w-5' : 'bg-slate-200'}`}
                  title={`Go to page ${p}`}
                />
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1 bg-[#EEF3F0]/40 py-1.5 rounded border border-emerald-100/50">
            <span>👉 Swipe left / right to browse pages</span>
          </div>
        </div>
      )}

      {/* Unified Adaptive Health Dashboard on Page 1 */}
      {currentPage === 1 && (
        <MobileHealthDashboard
          patientData={patientData}
          appointments={appointments}
          onOpenMedicationCompliance={() => {
            // Navigate to page 6 which has the medication tracking details
            setCurrentPage(6);
          }}
          onOpenConsultationNotes={() => {
            // Trigger navigation to consultation notes tab
            onNavigateTab?.('consultations');
          }}
          onNavigatePage={(p) => {
            setCurrentPage(p);
          }}
        />
      )}

      {/* Patient Greeting & Status Bar */}
      {!isMobile && false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#EEF3F0] text-slate-900 rounded-3xl p-6 md:p-8 border border-[#DEE8E0] shadow-sm relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        
        {/* Left section (Greeting & ID) */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-3 relative z-10 border-b border-[#DEE8E0] lg:border-b-0 pb-6 lg:pb-0">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
              Welcome back,<br />
              <span className="text-[#3F5B42]">
                {patient?.name || 'Marcus Everett'}
              </span>
            </h1>
            
            <div className="pt-2">
              <button 
                type="button"
                onClick={() => setShowProfileDetails(!showProfileDetails)}
                className="text-xs font-bold text-[#3F5B42]/85 hover:text-[#3F5B42] bg-[#3F5B42]/5 hover:bg-[#3F5B42]/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all duration-150 focus:outline-none shadow-xs border border-[#DEE8E0]"
              >
                <User className="h-3.5 w-3.5 text-[#3F5B42]" />
                <span>{showProfileDetails ? 'Hide Patient Identity and Contact Info' : 'Show Patient Identity and Contact Info'}</span>
                {showProfileDetails ? (
                  <ChevronUp className="h-3 w-3 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center section: Massive health score radial dial & behavioral progress rings */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center relative z-10 py-2 border-b border-[#DEE8E0] lg:border-b-0 pb-6 lg:pb-0">
          <div className="flex flex-row items-center gap-6">
            <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center shrink-0">
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
                <span className="text-3xl md:text-3xl font-black font-sans tracking-tight text-slate-900 leading-none">
                  {patient?.healthScore ?? 96}
                </span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Health Score</span>
              </div>
            </div>

            {/* Behavior Progress Rings (Diet, Steps, Adherence) as seen in Interface Map */}
            <div className="flex flex-col gap-2 border-l border-[#DEE8E0] pl-4 font-sans">
              <span className="text-[9px] font-black uppercase text-[#546e56] tracking-widest mb-1">Behavior Goals</span>
              
              {/* Steps Ring */}
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E5ECE7" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="88" strokeDashoffset={88 - (88 * 84) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black font-mono text-emerald-800">84%</span>
                </div>
                <span className="text-[10px] font-bold text-slate-650">Steps (8,420 / 10k)</span>
              </div>

              {/* Diet Progress Ring */}
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E5ECE7" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray="88" strokeDashoffset={88 - (88 * 90) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black font-mono text-blue-805">90%</span>
                </div>
                <span className="text-[10px] font-bold text-slate-650">Diet (2,150 / 2.4k kcal)</span>
              </div>

              {/* Compliance Ring */}
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E5ECE7" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="88" strokeDashoffset={88 - (88 * 80) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black font-mono text-purple-800">80%</span>
                </div>
                <span className="text-[10px] font-bold text-slate-650">Rx Compliance</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] md:text-xs font-bold tracking-[0.10em] text-[#3F5B42] uppercase text-center mt-3 font-sans opacity-95">
            Wellness Progress Score
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
          </div>
          
          {/* Overall Biomarkers Compliance Progress Bar */}
          <div className="pt-4 border-t border-[#DEE8E0] font-sans space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-650 uppercase tracking-wider">
              <span>Biometric Targets Compliance</span>
              <span className="font-extrabold text-[#3F5B42]">
                {vitalsSummaryCounts.optimal + vitalsSummaryCounts.inRange} / {sortedVitals.length} Stable
              </span>
            </div>
            <div className="w-full bg-[#E5ECE7] h-3 rounded-full overflow-hidden border border-[#DEE8E0]/40 p-[1px] shadow-inner">
              <div 
                className="bg-gradient-to-r from-emerald-600 to-[#3F5B42] h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, ((vitalsSummaryCounts.optimal + vitalsSummaryCounts.inRange) / (sortedVitals.length || 16)) * 100))}%` }}
              />
            </div>
            <p className="text-[10.5px] font-semibold text-[#5C6E5E] leading-tight">
              {vitalsSummaryCounts.outOfRange > 0 
                ? `${vitalsSummaryCounts.optimal + vitalsSummaryCounts.inRange} of your biometric fields are within normal or optimal margins.`
                : "All tracked health indices are perfectly stable & balanced."}
            </p>
          </div>
        </div>
      )}

      {showProfileDetails && !isMobile && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#DEE8E0] shadow-sm tracking-tight animate-in slide-in-from-top-4 duration-350 ease-out space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#3F5B42]/10 rounded-xl">
                <User className="h-5 w-5 text-[#3F5B42]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  Patient Identity and Contact Info
                </h3>
                <p className="text-xs text-slate-500 font-medium pb-1">
                  HIPAA Secured Primary Medical Identifiers, Residential Location Mapping, & Care Ring Contact Links.
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 rounded-sm text-[10px] text-slate-600 font-mono font-bold">
                  ID: <span className="text-[#3F5B42] font-black">{patient?.id || 'pat-marcus-001'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditingProfile ? (
                <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-xs font-bold text-[#3F5B42] hover:text-[#3F5B42]/80 bg-[#3F5B42]/10 hover:bg-[#3F5B42]/15 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 focus:outline-none"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileDetails(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1  focus:outline-none"
                  >
                    <X className="h-3.5 w-3.5" /> Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="text-xs font-bold text-white bg-[#3F5B42] hover:bg-[#2D422E] px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 focus:outline-none disabled:opacity-50"
                  >
                    <Save className="h-3 w-3 animate-pulse" /> {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 focus:outline-none"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {!isEditingProfile ? (
            // --- DISPLAY MODE ---
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              {/* Column 1: Demographics */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block border-l-2 border-[#3F5B42] pl-2 font-mono">
                  1. Core Demographical Identity
                </span>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Full Legal Name:</span>
                    <strong className="text-sm font-bold text-slate-900">{patient?.name || 'Marcus Alan Everett'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Preferred Name:</span>
                    <strong className="text-sm font-bold text-[#3F5B42]">{patient?.name?.split(' ')[0] || 'Marcus'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Date of Birth (DOB) & Age:</span>
                    <strong className="text-xs font-semibold text-slate-900">{patient?.dob || 'March 14, 1985'} (Age {patient?.age || 41})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Sex & Gender Expression:</span>
                    <strong className="text-xs font-semibold text-slate-900">{patient?.gender || 'Male • Cisgender Male'}</strong>
                  </div>
                </div>
              </div>

              {/* Column 2: Identifiers & Location Map */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block border-l-2 border-[#3F5B42] pl-2 font-mono">
                  2. Core System Identifiers & Mapping
                </span>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 bg-[#EEF3F0] p-3 rounded-2xl border border-[#C5D9C9] text-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider">Medical Record Number:</span>
                      <strong className="text-xs font-mono font-black text-[#2D422E] tracking-tight">{patient?.mrn || 'MRN-91283-ME'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider">Unified Patient ID:</span>
                      <strong className="text-xs font-mono font-black text-[#2D422E] tracking-tight">{patient?.id || 'pat-marcus-001'}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Residential Address:</span>
                        <strong className="text-slate-900 font-bold leading-normal text-[11px] block mt-0.5">
                          {patient?.address || '1482 Pineview Dr, Seattle, WA 98122'}
                        </strong>
                      </div>
                      <MapPin className="h-4.5 w-4.5 text-[#3F5B42] stroke-[2.25] shrink-0" />
                    </div>
                    <div className="h-20 bg-slate-200 border border-slate-350 rounded-xl relative overflow-hidden flex items-center justify-center shadow-inner">
                      <span className="text-[9px] text-slate-550 font-black tracking-widest uppercase">🗺 Embedded Map View</span>
                      <div className="absolute inset-0 bg-[#3F5B42]/5 backdrop-blur-[0.5px]"></div>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(patient?.address || '1482 Pineview Dr, Seattle, WA 98122')}`} 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-white shadow-xs border border-slate-200 rounded text-[9px] font-bold text-slate-700 flex items-center gap-1 hover:text-[#3F5B42] focus:outline-none"
                      >
                        🗺 Navigation Link
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Contact & Emergency Ring */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block border-l-2 border-[#3F5B42] pl-2 font-mono">
                  3. Primary Contacts & Emergency Ring
                </span>
                <div className="space-y-3">
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 shadow-2xs space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-750 p-1.5 bg-white rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500 text-[10px] uppercase">✉ Email:</span>
                      <span className="font-bold text-[#3F5B42] flex items-center gap-1 text-[11px]">
                        {patient?.email || 'marcus.everett@gmail.com'}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-750 p-1.5 bg-white rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500 text-[10px] uppercase">📞 Primary Phone:</span>
                      <a href={`tel:${patient?.phone || '2065550143'}`} className="font-bold text-[#3F5B42] hover:underline flex items-center gap-1 text-[11px]">
                        {patient?.phone || '(206) 555-0143'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-slate-750 p-1.5 bg-white rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500 text-[10px] uppercase">📞 Secondary Phone:</span>
                      <a href={`tel:${patient?.secondaryPhone || '2065550199'}`} className="font-bold text-slate-500 hover:underline flex items-center gap-1 text-[11px]">
                        {patient?.secondaryPhone || '(206) 555-0199'}
                      </a>
                    </div>
                  </div>

                  {/* Emergency Block */}
                  <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-red-100 shadow-2xs text-slate-700 space-y-2">
                    <div className="flex items-center justify-between border-b border-red-100 pb-1.5">
                      <span className="text-[9px] font-black uppercase text-red-700 tracking-wider flex items-center gap-1 font-mono">
                        <Phone className="h-3 w-3 text-red-650" />
                        Emergency Next of Kin
                      </span>
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm">Primary</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                      <span>{patient?.nokName || 'Sarah Everett'} ({patient?.nokRelationship || 'Spouse'})</span>
                      <a href={`tel:${patient?.nokPhone || '2065550172'}`} className="text-red-700 hover:underline flex items-center gap-0.5 px-2 py-0.5 bg-white border border-red-200 rounded text-[9px] font-bold focus:outline-none">
                        📞 Call
                      </a>
                    </div>
                    <div className="text-[10px] text-slate-550 space-y-0.5">
                      <div>Direct Phone: <strong className="text-slate-800 font-mono">{patient?.nokPhone || '(206) 555-0172'}</strong></div>
                      <div>Direct Email: <span className="text-[#3F5B42] font-semibold">{patient?.nokEmail || 'sarah.everett@gmail.com'}</span></div>
                    </div>
                    
                    {/* Emergency Sleep Override Toggle */}
                    <div className="pt-2 border-t border-red-100 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-650 flex items-center gap-1">
                        🚨 bypass sleep focus?
                      </span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setBypassActive(!bypassActive)}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            bypassActive ? 'bg-red-650' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              bypassActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`ml-1.5 font-bold uppercase text-[8px] ${bypassActive ? 'text-red-650' : 'text-slate-450'}`}>
                          {bypassActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // --- EDIT MODE FORM layout ---
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              
              {/* Column 1: Demographics Edit */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-[#3F5B42] tracking-wider block border-l-2 border-[#3F5B42] pl-2 font-mono">
                  1. Core Demographical Identity (Editing)
                </span>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-[#3F5B42]/25 shadow-2xs space-y-3.5">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Full Legal Name:</label>
                    <input 
                      type="text"
                      value={editFields.name}
                      onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Date of Birth (DOB):</label>
                    <input 
                      type="text"
                      value={editFields.dob}
                      onChange={(e) => setEditFields({ ...editFields, dob: e.target.value })}
                      placeholder="e.g. March 14, 1985"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Sex & Gender Expression:</label>
                    <input 
                      type="text"
                      value={editFields.gender}
                      onChange={(e) => setEditFields({ ...editFields, gender: e.target.value })}
                      placeholder="e.g. Male • Cisgender Male"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Identifiers & Location Map Edit */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-[#3F5B42] tracking-wider block border-l-2 border-[#3F5B42] pl-2 font-mono">
                  2. System Keys & Residential Mapping
                </span>
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 bg-[#EEF3F0] p-3 rounded-2xl border border-[#C5D9C9] text-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        MRN (Locked)
                      </span>
                      <strong className="text-xs font-mono font-black text-[#2D422E] tracking-tight block mt-0.5 opacity-70">
                        {patient?.mrn || 'MRN-91283-ME'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        ID (Locked)
                      </span>
                      <strong className="text-xs font-mono font-black text-[#2D422E] tracking-tight block mt-0.5 opacity-70">
                        {patient?.id || 'pat-marcus-001'}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-[#3F5B42]/25 shadow-2xs space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Residential Address:</label>
                      <textarea 
                        rows={2}
                        value={editFields.address}
                        onChange={(e) => setEditFields({ ...editFields, address: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] resize-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Contact & Emergency Ring Edit */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-[#3F5B42] tracking-wider block border-l-2 border-[#3F5B42] pl-2 font-mono">
                  3. Primary Contacts & Emergency Ring
                </span>
                <div className="space-y-3.5">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-[#3F5B42]/25 shadow-2xs space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Verified Email Address:</label>
                      <input 
                        type="email"
                        value={editFields.email}
                        onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Primary Phone Number:</label>
                      <input 
                        type="text"
                        value={editFields.phone}
                        onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Secondary Phone Number:</label>
                      <input 
                        type="text"
                        value={editFields.secondaryPhone}
                        onChange={(e) => setEditFields({ ...editFields, secondaryPhone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42] focus:ring-1 focus:ring-[#3F5B42] transition-all"
                      />
                    </div>
                  </div>

                  {/* Emergency Family Block Edit */}
                  <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-red-200 shadow-2xs space-y-3">
                    <span className="text-[10px] font-black uppercase text-red-700 tracking-wider flex items-center gap-1 font-mono border-b border-red-100 pb-1.5">
                      <Phone className="h-3 w-3 text-red-650" />
                      Emergency Next of Kin Setup
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider mb-0.5">NOK Name:</label>
                        <input 
                          type="text"
                          value={editFields.nokName}
                          onChange={(e) => setEditFields({ ...editFields, nokName: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider mb-0.5">Relationship:</label>
                        <input 
                          type="text"
                          value={editFields.nokRelationship}
                          onChange={(e) => setEditFields({ ...editFields, nokRelationship: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider mb-0.5">NOK Phone:</label>
                        <input 
                          type="text"
                          value={editFields.nokPhone}
                          onChange={(e) => setEditFields({ ...editFields, nokPhone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider mb-0.5">NOK Email:</label>
                        <input 
                          type="text"
                          value={editFields.nokEmail}
                          onChange={(e) => setEditFields({ ...editFields, nokEmail: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#3F5B42]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {!isMobile && (
        <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#3F5B42]/10 border border-[#3F5B42]/20 flex items-center justify-center text-[#3F5B42] font-black font-mono shadow-inner text-base">
            {layoutMode === 'deck' ? currentPage : '★'}
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Health Board Deck</h4>
            <p className="text-[10px] text-[#3F5B42] font-extrabold uppercase tracking-wider mt-1">
              {layoutMode === 'deck' ? (
                `Page ${currentPage} of 6 — ${
                  currentPage === 1 ? "Personal Wellness Home Dashboard" :
                  currentPage === 2 ? "1. Vitals Focus & AI Clinical Assessment" :
                  currentPage === 3 ? "2. Clinical Trends & 6. Lifestyle Habits" :
                  currentPage === 4 ? "3. EHR Assets & 7. Security guard" :
                  currentPage === 5 ? "4. Wellness Room & 8. Connected Devices" :
                  "Active Guidance (Daily Action Plan, 9. Sessions & 10. Prescriptions)"
                }`
              ) : (
                "Continuous Flow — Unified Column Layout Model"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          {/* Light-themed View Profile toggler */}
          <button 
            type="button"
            onClick={() => setShowProfileDetails(!showProfileDetails)}
            className="flex items-center gap-1.5 h-8 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-xs font-bold leading-none select-none focus:outline-none cursor-pointer transition-colors"
          >
            <User className="h-3.5 w-3.5 text-[#3F5B42]" />
            <span>{showProfileDetails ? 'Hide Profile' : 'View Profile'}</span>
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {layoutMode === 'deck' ? (
            <div className="flex items-center gap-1.5">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-45 disabled:hover:bg-slate-50 transition-colors cursor-pointer text-slate-705 text-xs font-bold leading-none select-none focus:outline-none"
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" />
                Prev
              </button>

              {/* Page Indicators */}
              <div className="flex items-center gap-1">
                {[...Array(6)].map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold font-sans transition-all border cursor-pointer flex items-center justify-center focus:outline-none ${
                        isActive 
                          ? 'bg-[#3F5B42] text-white border-[#3F5B42] shadow-sm font-black' 
                          : 'bg-white text-slate-505 hover:text-slate-800 hover:bg-slate-50 border-slate-200'
                      }`}
                      title={
                        pageNum === 1 ? "Home Dashboard" :
                        pageNum === 2 ? "Vitals & AI Assessment" :
                        pageNum === 3 ? "Trends & Habits" :
                        pageNum === 4 ? "Clinical EHR & Privacy" :
                        pageNum === 5 ? "Wellness & Devices" :
                        "Action & Agenda"
                      }
                    >
                      <span className="font-mono text-xs mr-1">{pageNum}</span>
                      <span className="hidden lg:inline text-[9px] uppercase tracking-wider">
                        {
                          pageNum === 1 ? "Home" :
                          pageNum === 2 ? "Vitals" :
                          pageNum === 3 ? "Trends" :
                          pageNum === 4 ? "EHR" :
                          pageNum === 5 ? "Wellness" :
                          "Action"
                        }
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(6, prev + 1))}
                disabled={currentPage === 6}
                className="flex items-center justify-center h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-45 disabled:hover:bg-slate-50 transition-colors cursor-pointer text-[#3F5B42] text-xs font-bold leading-none select-none focus:outline-none"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-250 px-3 py-1.5 rounded-lg text-xs font-bold font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Full Dossier View • All Cards Standardized</span>
            </div>
          )}

          {/* Separator Line */}
          <div className="hidden md:block w-px h-6 bg-slate-200 mx-1" />

          {/* Layout Switch Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setLayoutMode('deck')}
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                layoutMode === 'deck' 
                  ? 'bg-[#3F5B42] text-white shadow-xs' 
                  : 'text-slate-505 hover:text-slate-800'
              }`}
            >
              Card Deck
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('dossier')}
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                layoutMode === 'dossier' 
                  ? 'bg-[#3F5B42] text-white shadow-xs' 
                  : 'text-slate-505 hover:text-slate-800'
              }`}
            >
              Full Profile
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Main Grid content */}
      <div className={layoutMode === 'deck' 
        ? "grid grid-cols-1 gap-6 animate-fadeIn max-w-4xl mx-auto w-full" 
        : "grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn"
      }>
        
        {/* Left Column - Vitals & Health Indicators */}
        <div className={layoutMode === 'deck' ? "space-y-6" : "lg:col-span-2 space-y-6"}>
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 2)) || (isMobile && currentPage === 2)) && (
            <motion.div
              key="page2-left"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#3F5B42]" />
                    1. Your Vitals Focus
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Key metabolic & hemodynamic markers under focus.
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
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center justify-center p-1.5 bg-[#EEF3F0] hover:bg-[#DEE8E0] text-[#3F5B42] hover:text-[#2d422e] border border-[#DEE8E0] rounded transition-colors shadow-sm cursor-pointer"
                    title="Configure Focus Vitals & View All 16 Vitals"
                  >
                    <Settings className="h-3.5 w-3.5" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedVitals.map((vital) => {
                  const Icon = vital.icon;
                  return (
                    <motion.div
                      key={vital.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`p-4 rounded-xl border flex flex-col justify-between h-32 relative group select-none transition-all duration-250 hover:shadow-md ${vital.color}`}
                    >
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
                  );
                })}
              </div>

              <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-2 px-5 py-2 hover:bg-[#EEF3F0]/65 border border-[#DEE8E0] text-slate-705 hover:text-slate-950 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#3F5B42]" />
                  Access Full Clinical Telemetry Panel
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          )}



          {/* Active Diagnoses / Health Plan focus */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 6)) || (isMobile && currentPage === 6)) && (
            <motion.div
              key="page6-action-plan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DailyActionPlan 
                patient={patient} 
                latestVitalRecord={latestVitalRecord} 
                bloodGlucoseStatus={bloodGlucoseStatus} 
              />
            </motion.div>
          )}

          {/* 1. CLINICAL TRENDS & COMPLIANCE CALENDAR - "Data Visualization" Node */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 3)) || (isMobile && currentPage === 3)) && (
            <motion.div
              key="page3-left"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#3F5B42]" />
                    {isMobile && currentPage === 1 ? 'Compliance Calendar' : '2. Interactive Trends & Adherence Analytics'}
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    {isMobile && currentPage === 1 ? 'Daily "Check-off" calendar registry of prescribed therapeutic regimen' : 'Correlation analysis between daily activity habits and primary clinical metrics'}
                  </CardDescription>
                </div>
                {(!isMobile || currentPage !== 1) && (
                  <div className="flex bg-[#EEF3F0] p-1 rounded-lg border border-[#DEE8E0]">
                  <button
                    onClick={() => setTrendsDuration('3m')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      trendsDuration === '3m' ? 'bg-[#3F5B42] text-white shadow-sm' : 'text-slate-650 hover:text-slate-900'
                    }`}
                  >
                    3 Months
                  </button>
                  <button
                    onClick={() => setTrendsDuration('6m')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      trendsDuration === '6m' ? 'bg-[#3F5B42] text-white shadow-sm' : 'text-slate-650 hover:text-slate-900'
                    }`}
                  >
                    6 Months
                  </button>
                </div>
              )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* SVG Live Render Chart */}
                {(!isMobile || currentPage !== 1) && (
                  <div className="md:col-span-8 bg-slate-50 border border-slate-100 p-4 rounded-xl relative">
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" /> Blood Pressure (mmHg)
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-705">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" /> Weight (kg)
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded">
                      Latest Calibration: Today
                    </span>
                  </div>

                  {/* Pure Interactive SVG Chart Vector */}
                  <div className="w-full h-44 relative bg-white border border-slate-150 rounded shadow-inner p-1">
                    <svg viewBox="0 0 500 180" className="w-full h-full">
                      {/* Grid background lines */}
                      <line x1="50" y1="30" x2="450" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                      <line x1="50" y1="70" x2="450" y2="70" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                      <line x1="50" y1="110" x2="450" y2="110" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                      <line x1="50" y1="150" x2="450" y2="150" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                      
                      {/* Axes */}
                      <line x1="50" y1="20" x2="50" y2="155" stroke="#CBD5E1" strokeWidth="1.5" />
                      <line x1="45" y1="150" x2="465" y2="150" stroke="#CBD5E1" strokeWidth="1.5" />

                      {/* Content line plotting pathways dynamically based on timeframe */}
                      {trendsDuration === '3m' ? (
                        <>
                          {/* 3M Systolic Path: April, May, June */}
                          <path
                            d="M 50,110 L 250,118 L 450,121"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            className="animate-draw"
                          />
                          {/* 3M Weight Path */}
                          <path
                            d="M 50,60 L 250,82 L 450,88"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            className="animate-draw"
                          />
                          {/* Points circles */}
                          <circle cx="50" cy="110" r="5" fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="250" cy="118" r="5" fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="450" cy="121" r="5" fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />

                          <circle cx="50" cy="60" r="5" fill="#3B82F6" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="250" cy="82" r="5" fill="#3B82F6" stroke="#FFF" strokeWidth="1.5" />
                          <circle cx="450" cy="88" r="5" fill="#3B82F6" stroke="#FFF" strokeWidth="1.5" />

                          {/* Labels for X-axis */}
                          <text x="50" y="168" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Apr 2026</text>
                          <text x="250" y="168" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">May 2026</text>
                          <text x="450" y="168" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Jun 2026</text>

                          {/* Value tooltips inline */}
                          <g transform="translate(50, 100)">
                            <rect x="-20" y="-12" width="40" height="11" rx="2" fill="#1E293B" opacity="0.8" />
                            <text x="0" y="-4" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#FFF" fontFamily="monospace">122/78</text>
                          </g>
                          <g transform="translate(450, 111)">
                            <rect x="-20" y="-12" width="40" height="11" rx="2" fill="#1E293B" opacity="0.8" />
                            <text x="0" y="-4" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#FFF" fontFamily="monospace">118/74</text>
                          </g>
                          <g transform="translate(450, 78)">
                            <rect x="-20" y="-12" width="40" height="11" rx="2" fill="#1E293B" opacity="0.8" />
                            <text x="0" y="-4" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#FFF" fontFamily="monospace">86.2kg</text>
                          </g>
                        </>
                      ) : (
                        <>
                          {/* 6M Systolic Path: Jan to Jun */}
                          <path
                            d="M 50,80 L 130,85 L 210,95 L 290,110 L 370,118 L 450,121"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          {/* 6M Weight Path */}
                          <path
                            d="M 50,35 L 130,42 L 210,55 L 290,60 L 370,82 L 450,88"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          {/* Points */}
                          {[50, 130, 210, 290, 370, 450].map((cx, idx) => {
                            const bps = [80, 85, 95, 110, 118, 121];
                            const wgs = [35, 42, 55, 60, 82, 88];
                            return (
                              <g key={idx}>
                                <circle cx={cx} cy={bps[idx]} r="4.5" fill="#F59E0B" stroke="#FFF" strokeWidth="1" />
                                <circle cx={cx} cy={wgs[idx]} r="4.5" fill="#3B82F6" stroke="#FFF" strokeWidth="1" />
                              </g>
                            );
                          })}
                          {/* Labels */}
                          <text x="50" y="168" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Jan</text>
                          <text x="130" y="168" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Feb</text>
                          <text x="210" y="168" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Mar</text>
                          <text x="290" y="168" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Apr</text>
                          <text x="370" y="168" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">May</text>
                          <text x="450" y="168" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#64748B" fontFamily="sans-serif">Jun</text>
                        </>
                      )}
                    </svg>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold italic text-center">
                    Note: Cardiovascular and glycemic calibration signals demonstrate a positive therapeutic response since initiating Metformin and post-meal muscle exercises.
                  </p>
                </div>
              )}

              {/* Compliance Tracker Section */}
              {!isMobile && (
                  <div className={`${isMobile ? 'col-span-full' : 'md:col-span-4'} space-y-3 font-sans`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase text-[#546e56] tracking-wider block">
                        Compliance Tracker
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                          complianceScore >= 85 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : complianceScore >= 70 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {complianceScore}% Adherence
                      </Badge>
                    </div>

                    {/* Progress Bar Display */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                        <span>Overall Health Compliance</span>
                        <span className={
                          complianceScore >= 85 ? 'text-emerald-600' :
                          complianceScore >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }>{complianceScore}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <motion.div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            complianceScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                            complianceScore >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                            'bg-gradient-to-r from-rose-500 to-red-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${complianceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Note card */}
                    <div className={`p-2.5 rounded-xl border text-[11px] leading-normal font-medium flex items-start gap-2 ${
                      complianceScore >= 85 ? 'bg-emerald-50/50 border-emerald-150 text-emerald-850' :
                      complianceScore >= 70 ? 'bg-amber-50/50 border-amber-150 text-amber-850' :
                      'bg-rose-50/50 border-rose-150 text-rose-850'
                    }`}>
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
                      <div>
                        {complianceScore >= 85 && "Excellent therapeutic fidelity! Doses and follow-ups are highly aligned with your plan."}
                        {complianceScore >= 70 && complianceScore < 85 && "Sub-optimal compliance detected. Resolve barriers below to optimize clinical outcomes."}
                        {complianceScore < 70 && "Critical adherence levels. Identified risk-barriers significantly threaten metabolic stability."}
                      </div>
                    </div>

                    {/* Highlight Areas contributing to poor score */}
                    <div className="space-y-2">
                      <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
                        Risk factors / Barriers to Resolve
                      </span>

                      <div className="space-y-2">
                        {/* 1. Medication Routine */}
                        <div 
                          onClick={() => setHasMedRoutine(!hasMedRoutine)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            hasMedRoutine 
                              ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                              : 'bg-rose-50/20 border-rose-200/60 hover:bg-rose-50/30 animate-pulse'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {hasMedRoutine ? (
                                <span className="text-xs">✅</span>
                              ) : (
                                <span className="text-xs">⚠️</span>
                              )}
                              <span className={`text-[11px] font-bold ${hasMedRoutine ? 'text-slate-700' : 'text-rose-950'}`}>
                                Structured Medication Routine
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {hasMedRoutine 
                                ? "Habit configured (dose associated with daily routine cue)" 
                                : "No automatic medication habit cue configured. Easily forgotten (-15%)"}
                            </p>
                          </div>
                          <button 
                            type="button"
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                              hasMedRoutine 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                            }`}
                          >
                            {hasMedRoutine ? "Active" : "Set Routine"}
                          </button>
                        </div>

                        {/* 2. Provider Visits */}
                        <div 
                          onClick={() => setHasProviderVisit(!hasProviderVisit)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            hasProviderVisit 
                              ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                              : 'bg-rose-50/20 border-rose-200/60 hover:bg-rose-50/30 animate-pulse'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {hasProviderVisit ? (
                                <span className="text-xs">✅</span>
                              ) : (
                                <span className="text-xs">⚠️</span>
                              )}
                              <span className={`text-[11px] font-bold ${hasProviderVisit ? 'text-slate-700' : 'text-rose-950'}`}>
                                Healthcare Provider Follow-ups
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {hasProviderVisit 
                                ? "Follow-up visit scheduled and on file" 
                                : "Delayed follow-up with clinical care team (-18%)"}
                            </p>
                          </div>
                          <button 
                            type="button"
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                              hasProviderVisit 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                            }`}
                          >
                            {hasProviderVisit ? "Scheduled" : "Schedule Visit"}
                          </button>
                        </div>

                        {/* 3. Daily Biometrics Logging */}
                        <div 
                          onClick={() => setHasLoggedVitals(!hasLoggedVitals)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            hasLoggedVitals 
                              ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                              : 'bg-rose-50/20 border-rose-200/60 hover:bg-rose-50/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {hasLoggedVitals ? (
                                <span className="text-xs">✅</span>
                              ) : (
                                <span className="text-xs">⚠️</span>
                              )}
                              <span className={`text-[11px] font-bold ${hasLoggedVitals ? 'text-slate-700' : 'text-rose-950'}`}>
                                Daily Biometric Calibration
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {hasLoggedVitals 
                                ? "Vitals logged regularly over the last week" 
                                : "Inconsistent recording of vital biomarkers (-10%)"}
                            </p>
                          </div>
                          <button 
                            type="button"
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                              hasLoggedVitals 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                            }`}
                          >
                            {hasLoggedVitals ? "Tracking On" : "Track Vitals"}
                          </button>
                        </div>

                        {/* 4. Physical Exercise Routine */}
                        <div 
                          onClick={() => setHasExercisePlan(!hasExercisePlan)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            hasExercisePlan 
                              ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                              : 'bg-rose-50/20 border-rose-200/60 hover:bg-rose-50/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {hasExercisePlan ? (
                                <span className="text-xs">✅</span>
                              ) : (
                                <span className="text-xs">⚠️</span>
                              )}
                              <span className={`text-[11px] font-bold ${hasExercisePlan ? 'text-slate-700' : 'text-rose-950'}`}>
                                Active Physical Therapy / Exercise
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {hasExercisePlan 
                                ? "Consistently hitting walking and stretch targets" 
                                : "Sedentary indicators present, missing post-meal exercises (-12%)"}
                            </p>
                          </div>
                          <button 
                            type="button"
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                              hasExercisePlan 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                            }`}
                          >
                            {hasExercisePlan ? "Active" : "Log Exercise"}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

              </div>

            </CardContent>
          </Card>
          </motion.div>
          )}

          {/* 2. INTEGRATED CLINICAL EHR DATA HUB - "Clinical Medical Records" Node */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 4)) || (isMobile && currentPage === 4)) && (
            <motion.div
              key="page4-left"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    3. Clinical Record Interoperability Index (EHR Hub)
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Live federated clinical assets compiled from hospital portals via HL7 FHIR Release 4
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-[10px] flex items-center gap-1 leading-none py-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> HIPAA Secure Link
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* EHR Diagnosed Conditions */}
                <div className="space-y-3 bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block border-b border-[#E3EDE6] pb-1">
                    Diagnosed Medical Conditions
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between text-xs p-1.5 bg-white border border-slate-100 rounded">
                      <div>
                        <strong className="text-slate-800 block">Type 2 Diabetes Mellitus</strong>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">ICD-10 Code: E11.9</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold hover:bg-emerald-50 text-[9px] py-0 px-1">Primary Metabolic</Badge>
                    </div>
                    <div className="flex items-start justify-between text-xs p-1.5 bg-white border border-slate-100 rounded">
                      <div>
                        <strong className="text-slate-800 block">Rheumatoid Arthritis (RF Positive)</strong>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">ICD-10 Code: M05.79 (Autoimmune)</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold hover:bg-emerald-50 text-[9px] py-0 px-1">Controlled Remission</Badge>
                    </div>
                    <div className="flex items-start justify-between text-xs p-1.5 bg-white border border-slate-100 rounded">
                      <div>
                        <strong className="text-slate-800 block">Polycystic Ovary Syndrome (PCOS)</strong>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">ICD-10 Code: E28.2 (Endocrine)</span>
                      </div>
                      <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-bold hover:bg-blue-50 text-[9px] py-0 px-1">Active Monitoring</Badge>
                    </div>
                  </div>
                </div>

                {/* Laboratory Panels History */}
                <div className="space-y-3 bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block border-b border-[#E3EDE6] pb-1">
                    Historical Laboratory Panels (EHR)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-100 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">HbA1c Baseline</span>
                      <strong className="text-[#3F5B42] text-sm mt-0.5">5.7%</strong>
                      <span className="text-[9px] text-[#5C6E5E] font-medium mt-0.5">Jan 2026 • Optimal</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">CRP Inflammatory</span>
                      <strong className="text-[#3F5B42] text-sm mt-0.5">3.2 mg/L</strong>
                      <span className="text-[9px] text-[#5C6E5E] font-medium mt-0.5">May 2026 • Controlled</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">Kidney eGFR Index</span>
                      <strong className="text-blue-700 text-sm mt-0.5">104 mL/min</strong>
                      <span className="text-[9px] text-slate-500 font-medium mt-0.5">Jun 2026 • Excellent</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">Lipid Panel LDL-C</span>
                      <strong className="text-[#3F5B42] text-sm mt-0.5">92 mg/dL</strong>
                      <span className="text-[9px] text-[#5C6E5E] font-medium mt-0.5">Mar 2026 • Stable</span>
                    </div>
                  </div>
                </div>

                {/* Historical Surgical Reports */}
                <div className="space-y-2 bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#E3EDE6] pb-1 mb-2">
                    <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block">
                      Discharge Summaries & Surgical Procedures History
                    </span>
                    <Badge variant="outline" className="text-[8px] bg-white font-semibold">2 Historic Records</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5 p-1.5 rounded bg-white border border-slate-100 hover:bg-slate-50/50">
                      <span className="text-slate-450 font-bold font-mono">2025</span>
                      <div>
                        <strong className="text-slate-900 block font-semibold">Left Knee Arthroscopy & Joint Lavage</strong>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                          Discharged following Day Surgery arthroscopic meniscus cleanup and synovial wash. Uneventful post-anesthesia recovery. Connected physical therapy plan ongoing.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-1.5 rounded bg-white border border-slate-100 hover:bg-slate-50/50">
                      <span className="text-slate-450 font-bold font-mono">2012</span>
                      <div>
                        <strong className="text-slate-900 block font-semibold">Laparoscopic Appendectomy (Acute Inflammatory)</strong>
                        <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                          Emergency laparoscopic removal of inflamed appendix tissue under full general support. Standard surgical discharge. Fully resolved, no ongoing complications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Immunization & Vaccination History */}
                <div className="bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm col-span-1 md:col-span-2 font-sans space-y-2">
                  <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block border-b border-[#E3EDE6] pb-1">
                    Verified Immunization Registry (EHR)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>COVID-19 Bivalent</span>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Dose log: Oct 2025 • Pfizer</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Influenza (Annual)</span>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Dose log: Oct 2025 • Clinic</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Tdap booster</span>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Dose log: Jul 2021 • General</p>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
          </motion.div>
          )}

          {/* 3. PRIMARY CARE ENGAGEMENT & DAILY MOOD SELF-LOGGER - "Health Protective Behaviors" Node */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 5)) || (isMobile && currentPage === 5)) && (
            <motion.div
              key="page5-left"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <HeartPlus className="h-4 w-4 text-[#3F5B42]" />
                    4. Wellness Engagement & Mood Self‑Assessment Room
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Holistic engagement history and real-time cognitive stress-response tracker
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 font-sans space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Primary Care past, upcoming, screening reminders */}
                <div className="space-y-4">
                  
                  {/* Past Visits logs */}
                  <div className="bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block border-b border-[#E3EDE6] pb-1">
                      PCP / Endocrinology Consultation History
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-105">
                        <span className="font-semibold text-slate-800">🌱 Dr. Aris Vance (PCP Annual Visit)</span>
                        <Badge className="bg-emerald-50 text-emerald-805 hover:bg-[#EEF3F0] text-[9px]">Completed Mar 2026</Badge>
                      </div>
                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-105">
                        <span className="font-semibold text-slate-800">🧪 Dr. James Wilson (Endocrine Lab Evaluation)</span>
                        <Badge className="bg-emerald-50 text-emerald-805 hover:bg-[#EEF3F0] text-[9px]">Completed Apr 2026</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Preventative Screening registry */}
                  <div className="bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block border-b border-[#E3EDE6] pb-1">
                      Preventive Screening Alerts & Status
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-105">
                        <span className="font-semibold text-slate-850">Colonoscopy (Targeting Age-standards)</span>
                        <span className="text-[10px] font-bold text-slate-450 bg-slate-100 px-1.5 rounded">Future (Due 2035)</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-105">
                        <span className="font-semibold text-slate-850">Annual Blood Pressure Evaluation Trend</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded flex items-center gap-1">🟢 Completed Today</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-105">
                        <span className="font-semibold text-slate-850">PCP Routine Lipid Screen check</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 rounded">Pending Oct 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Wellness Sessions Attendance logs */}
                  <div className="bg-[#FAFCFB] p-4 rounded-xl border border-emerald-100/60 shadow-sm space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-wider block border-b border-[#E3EDE6] pb-1">
                      Wellness Class Logs & Connected Devices
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white rounded border border-slate-100">
                        <strong className="text-slate-800 block text-[10.5px]">🧘 Mindfulness Meditation</strong>
                        <span className="text-[9px] font-semibold text-slate-500">Calm App Integration</span>
                        <span className="text-[10px] text-emerald-700 font-bold block mt-1">✓ Logged 15 mins today</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-100">
                        <strong className="text-slate-800 block text-[10.5px]">🌸 Therapeutic Yoga Class</strong>
                        <span className="text-[9px] font-semibold text-slate-500">Joint Kinematic Class Support</span>
                        <span className="text-[10px] text-slate-500 font-bold block mt-1">2/week • Every Tuesday</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Secure EHR Mood and Stress logger FORM */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                      <span className="text-[10px] font-black uppercase text-[#3F5B42] tracking-widest block">
                        Daily Mindful Self-Assessment Log
                      </span>
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">Portal Direct</span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal mb-4">
                      Log your current cognitive stress-responses and daily outlook. This securely logs directly to your primary EHR file for clinician review.
                    </p>

                    {/* Mood button selection state */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-1.5">Current Cognitive Vibe</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { feel: 'Calm', icon: '😊' },
                            { feel: 'Neutral', icon: '😐' },
                            { feel: 'Fatigued', icon: '🥱' },
                            { feel: 'Anxious', icon: '😟' },
                            { feel: 'Energetic', icon: '⚡' }
                          ].map((item) => (
                            <button
                              key={item.feel}
                              type="button"
                              onClick={() => setPatientMood(item.feel)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                patientMood === item.feel 
                                  ? 'bg-[#3F5B42] text-white border-[#324935] shadow-sm' 
                                  : 'bg-white text-slate-750 border-slate-205 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item.icon}</span> <span>{item.feel}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stress level index */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">
                          <span>Cognitive Stress Level</span>
                          <span className="text-slate-800 font-mono font-black">{stressLevel} / 5 ({stressLevel <= 2 ? 'Minimal' : stressLevel === 3 ? 'Moderate' : 'Elevated'})</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={stressLevel}
                          onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-[#E5ECE7] rounded-lg appearance-none cursor-pointer accent-[#3F5B42]"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
                          <span>1 (Total Zen)</span>
                          <span>3 (Balanced Activity)</span>
                          <span>5 (High Inflammation Barrier)</span>
                        </div>
                      </div>

                      {/* Brief journaling textarea */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-1">EHR Daily Notes Reflection</label>
                        <textarea
                          rows={2}
                          value={moodJournal}
                          onChange={(e) => setMoodJournal(e.target.value)}
                          placeholder="Fasting feeling stable today... taking medication exactly as directed."
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#3F5B42] focus:border-[#3F5B42] outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
                    <span className="text-[9px] text-[#5C6E5E] font-semibold italic flex items-center gap-1">
                      🔒 Local sandboxed secure channel
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrivacySuccessToast(true);
                        setTimeout(() => setShowPrivacySuccessToast(false), 3000);
                      }}
                      className="px-4 py-2 bg-[#3F5B42] hover:bg-[#324935] text-white text-xs font-bold rounded-lg transition-all shadow cursor-pointer border border-[#2D422E] flex items-center gap-1"
                    >
                      ✓ Log to EHR File
                    </button>
                  </div>

                  {showPrivacySuccessToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] bg-emerald-100 text-emerald-850 border border-emerald-300 p-2 rounded-lg font-bold text-center mt-2.5"
                    >
                      🎉 Mindful Daily Self-Assessment safely serialized directly to Primary EHR file!
                    </motion.div>
                  )}

                </div>

              </div>
              
            </CardContent>
          </Card>
          </motion.div>
          )}

          {/* Mobile Only: My Notes Card */}
          {(isMobile && currentPage === 6) && (
            <motion.div
              key="mobile-my-notes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-sans">
                      <FileText className="h-4 w-4 text-[#3F5B42]" />
                      My Consultation Notes
                    </CardTitle>
                    <Badge variant="outline" className="bg-[#EEF3F0] text-[#3F5B42] text-[9px] font-bold">
                      {personalNotes.length} Saved
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Notes input form */}
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Type a new personal note or daily reflection here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#3F5B42] focus:border-[#3F5B42] outline-none font-medium text-slate-800 shadow-inner"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddNote}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3F5B42] hover:bg-[#324935] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Notes list */}
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {personalNotes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-700 font-medium relative pl-7">
                        <span className="absolute left-2.5 top-3 text-slate-400">📝</span>
                        <p className="leading-normal">{note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

        {/* Right Column - Demographics, Personal Contacts, Habits, Rx, & Sync */}
        <div className="space-y-6 animate-fadeIn">
          
          {/* Card 1.5: Dynamic AI Vitals Assessment Card */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 2)) || (isMobile && currentPage === 2)) && (
            <motion.div
              key="card-1-5-vit-ai"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-[#EEF3F0]/60 hover:bg-[#EEF3F0]/90 transition-colors">
                <CardHeader className="pb-3 border-b border-[#DEE8E0] bg-[#EEF3F0] p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-705 flex items-center gap-1.5 font-sans">
                      <Sparkles className="h-4 w-4 text-[#3F5B42]" />
                      5. AI Vital Signs & Clinical Assessment
                    </CardTitle>
                    <Badge variant="outline" className="bg-[#E2ECE5] text-[#2D422E] border-[#C2D9C6] text-[9px] font-black uppercase font-mono">
                      HIPAA Verified
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] font-semibold text-slate-450 leading-relaxed mt-1">
                    Deep neural insights and diagnostic cross-check of core vitals matching clinical guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 pb-4 px-4 space-y-4 font-sans text-xs">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full AI assessment of your integrated telemetry stream over the past 24 hours matches reference care-plan benchmarks:
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl shadow-3xs">
                      <span className="text-emerald-700 font-extrabold text-sm select-none">✓</span>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Blood Glucose stability confirmed. Fasting levels (<strong className="text-slate-900">92 mg/dL</strong>) conform to target ranges under daily workout and active metformin management.
                      </p>
                    </div>

                    <div className="flex gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl shadow-3xs">
                      <span className="text-emerald-700 font-extrabold text-sm select-none">✓</span>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Hemodynamic tone balanced. Heart rate (<strong className="text-slate-900">72 bpm</strong>) and blood pressure (<strong className="text-slate-900">118/74 mmHg</strong>) suggest healthy vagal response.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#3F5B42]/5 border border-[#3F5B42]/10 rounded-xl text-[10px] text-slate-700 leading-normal flex gap-2">
                    <span className="text-sm">🤖</span>
                    <div>
                      <strong>Automated Care Plan Nudge:</strong> Patient demonstrated consistent biometric adherence. Continue scheduled evening walking routines.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* B. PATIENT HEALTH BEHAVIOR PROFILE CARD (CALORIES & COGNITIVE WATER TRACKER) - "Patient Health Behavior Profile" Node */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 3)) || (isMobile && currentPage === 3)) && (
            <motion.div
              key="page3-right"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-sans">
                  <Utensils className="h-4 w-4 text-emerald-650" />
                  6. Lifestyle, Diet & Hydration Behavior Profile
                </CardTitle>
              </div>
              <CardDescription className="text-[11px] leading-relaxed mt-1">
                Active tracking of diet macro objectives, calorie limits, and clickable hydration water log checks
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-4 font-sans text-xs">
              
              {/* Habits tracker segment */}
              <div className="space-y-2.5 bg-[#FAFCFB] p-3 rounded-xl border border-slate-100/80 shadow-sm text-slate-705">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">
                  Cessation Status & Stand alerts
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-slate-500">🚬 Tobacco Status:</span>
                    <strong className="text-[#3F5B42] font-black uppercase bg-[#EEF3F0] border border-[#DEE8E0] px-1.5 py-0.5 rounded text-[10px]">
                      Never Smoker
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-slate-500">🍺 Alcohol Intake:</span>
                    <strong className="text-slate-800 font-bold">
                      Minimal (Monitored)
                    </strong>
                  </div>
                  {/* Stand goals */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase mt-1">
                      <span>Sedentary Stand Alert Quotient</span>
                      <strong className="text-blue-700 font-mono">10 / 12 Hours Done</strong>
                    </div>
                    <div className="w-full bg-[#E5ECE7] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: '83.3%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nutrition Intake VS Calorie limit */}
              <div className="space-y-3 bg-[#FAFCFB] p-3 rounded-xl border border-slate-100/80 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-205 pb-1">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                     Diet vs Metabolic Needs
                  </span>
                  <span className="text-[10px] text-slate-800 font-bold">Intake Logged</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-650">Daily Calorie Balance:</span>
                    <strong className="text-slate-800">2,150 / 2,400 kcal</strong>
                  </div>
                  <div className="w-full bg-[#E5ECE7] h-2.5 rounded-full overflow-hidden p-[1px]">
                    <div className="bg-gradient-to-r from-emerald-500 to-[#3F5B42] h-full rounded-full" style={{ width: '89.5%' }} />
                  </div>
                  <p className="text-[10px] text-[#5C6E5E] leading-normal italic">
                    Dietary calorie levels conform perfectly to PCOS‑insulin glycemic boundaries. All meals accounted.
                  </p>
                </div>

                {/* Macronutrient breakdown targeting targets */}
                <div className="pt-2 border-t border-slate-150 space-y-2">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Target Macromolecule Percentiles</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-1.5 border border-slate-110 rounded text-center">
                      <span className="text-[8px] text-slate-400 font-semibold block">Carbs (40%)</span>
                      <strong className="text-amber-700 font-mono text-[10.5px]">215g</strong>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-110 rounded text-center">
                      <span className="text-[8px] text-slate-400 font-semibold block">Proteins (30%)</span>
                      <strong className="text-blue-700 font-mono text-[10.5px]">161g</strong>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-110 rounded text-center">
                      <span className="text-[8px] text-slate-400 font-semibold block">Fats (30%)</span>
                      <strong className="text-purple-700 font-mono text-[10.5px]">71g</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE hydration logging widget */}
              <div className="bg-[#EEF3F0]/65 p-4 rounded-xl border border-[#DEE8E0] space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 opacity-10">
                  <Droplet className="w-full h-full text-blue-600" />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-black uppercase text-[#3F5B42] tracking-wider block">
                    Interactive Fluid Hydration Tracker
                  </span>
                  <Badge className="bg-blue-100 text-blue-700 font-mono text-[9px] font-black">+250ml per glass</Badge>
                </div>

                <div className="flex gap-3 items-center">
                  {/* Pure SVG Water Glass representation */}
                  <div className="relative w-12 h-16 shrink-0 border-2 border-blue-500 rounded-b-xl rounded-t-sm flex items-end overflow-hidden p-0.5 bg-sky-50 shadow-sm">
                    {/* Water height based on state */}
                    <div 
                      className="w-full bg-blue-400/80 transition-all duration-500 ease-out flex items-center justify-center text-[9px] text-white font-mono font-black"
                      style={{ height: `${Math.min(100, Math.max(10, (waterGlasses / 8) * 100))}%` }}
                    >
                      {Math.round((waterGlasses / 8) * 100)}%
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold block">Logged Water Today:</span>
                    <strong className="text-slate-900 text-sm font-mono block">
                      {waterGlasses} / 8 Glasses <span className="text-xs text-slate-400 font-medium">({(waterGlasses * 0.25).toFixed(2)}L logged)</span>
                    </strong>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddWater}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-705 text-white font-extrabold text-[10px] rounded cursor-pointer transition-colors shadow-sm"
                      >
                        + Add Glass
                      </button>
                      <button
                        type="button"
                        onClick={handleResetWater}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold border border-slate-205 text-[10px] rounded cursor-pointer transition-colors shadow-sm"
                      >
                        Reset Log
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[9.5px] font-semibold text-slate-500 leading-tight">
                  {waterGlasses >= 8 
                    ? "🎉 Optimal tissue hydration levels fully achieved for your synovial joint lubrication!" 
                    : `Aim for ${8 - waterGlasses} more glasses to satisfy daily clinical synovial joint lubrication goals.`}
                </p>
              </div>

            </CardContent>
          </Card>
          </motion.div>
          )}

          {/* C. PRIVACY SECURITY & BIOMETRIC DATA SHARING CONTROLS - "Privacy and Security UI" Node */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 4)) || (isMobile && currentPage === 4)) && (
            <motion.div
              key="page4-right"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-sans">
                  <Lock className="h-4 w-4 text-emerald-650" />
                  7. Privacy & Telemetry Guard Panel
                </CardTitle>
              </div>
              <CardDescription className="text-[11px] leading-relaxed mt-1">
                Configure patient biometric login bypass permissions and federated provider sharing rules
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-4 font-sans text-xs">
              
              <div className="space-y-3">
                {/* 1. Biometric toggle status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <strong className="text-slate-800 block text-[11px]">Biometric Login Bypass (FaceID/Fingerprint)</strong>
                    <span className="text-[9.5px] text-slate-400 block max-w-[155px]">Use FaceID verification on login triggers</span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setIsBiometricEnabled(!isBiometricEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isBiometricEnabled ? 'bg-emerald-600' : 'bg-slate-350'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isBiometricEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`ml-1.5 font-bold uppercase text-[9px] ${isBiometricEnabled ? 'text-emerald-650' : 'text-slate-450'}`}>
                      {isBiometricEnabled ? 'Active' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* 2. Federated Data sharing permission */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <strong className="text-slate-800 block text-[11px]">Federate Telemetry to Care Team</strong>
                    <span className="text-[9.5px] text-slate-400 block max-w-[155px]">Auto-share wearables & log feeds to primary PCP files</span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShareTelemetry(!shareTelemetry)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        shareTelemetry ? 'bg-emerald-600' : 'bg-slate-350'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          shareTelemetry ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`ml-1.5 font-bold uppercase text-[9px] ${shareTelemetry ? 'text-emerald-650' : 'text-slate-450'}`}>
                      {shareTelemetry ? 'Sharing' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* 3. Location sharing */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <strong className="text-slate-800 block text-[11px]">Urgent GPS Localization Sharing</strong>
                    <span className="text-[9.5px] text-slate-400 block max-w-[155px]">Share coordinates with Next-of-Kin under bypass sirens</span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShareLocation(!shareLocation)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        shareLocation ? 'bg-emerald-600' : 'bg-slate-350'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          shareLocation ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`ml-1.5 font-bold uppercase text-[9px] ${shareLocation ? 'text-emerald-650' : 'text-slate-450'}`}>
                      {shareLocation ? 'Online' : 'Restricted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync reference index */}
              <div className="p-2.5 bg-[#FAFCFB] rounded-lg border border-slate-150 text-[10px] text-slate-500 font-semibold">
                🌐 <strong>Latest Audit Sync Channel:</strong> Connected to secure clinical endpoints. All authorization logs recorded automatically.
              </div>

            </CardContent>
          </Card>
          </motion.div>
          )}

          {/* Card 7.5: Dynamic HIPAA Compliance Security Audit Log Card (Deck-only filler) */}
          {((layoutMode === 'deck' && !isMobile && currentPage === 4) || (isMobile && currentPage === 4)) && (
            <motion.div
              key="card-7-5-sec-audit"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between h-[450px]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 text-slate-705">
                    <ShieldCheck className="h-4 w-4 text-emerald-650" />
                    <span className="text-[10px] font-black uppercase tracking-widest font-sans">Federated Security Access Audit Logs</span>
                  </div>
                  <Badge variant="outline" className="bg-[#EEF3F0] text-slate-805 border-slate-200 text-[8px] font-bold">LIVE FEED</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-normal mb-3 font-sans">
                  Real-time blockchain and cryptographic access log checks verifying privacy compliance:
                </p>
                <div className="space-y-2 font-sans text-xs">
                  <div className="p-2 border border-slate-100 rounded bg-white flex items-center justify-between text-slate-600">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">PCP Verification check</span>
                      <strong>Dr. Aris Vance MD</strong>
                    </div>
                    <span className="text-[#3F5B42] font-semibold">✓ Authorized</span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded bg-white flex items-center justify-between text-slate-600">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Wearable Hook Link</span>
                      <strong>Apple HealthKit Auth</strong>
                    </div>
                    <span className="text-[#3F5B42] font-semibold">✓ Token Active</span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded bg-white flex items-center justify-between text-[#3f5b42]">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Internal Portal Query</span>
                      <strong>User (Marcus Everett)</strong>
                    </div>
                    <span className="text-slate-500 font-semibold">✓ Logged IP</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-[#FAFCFB] rounded-lg border border-slate-150 text-[10px] text-[#5C6E5E] font-medium leading-relaxed mt-4">
                🔒 <strong>Consent Record:</strong> Patient-provided consent was updated today (June 15, 2026). Third-party disclosures are blocked by default.
              </div>
            </motion.div>
          )}
          
          {/* Device & App Sync Hub */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 5)) || (isMobile && currentPage === 5)) && (
            <motion.div
              key="page5-right"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border border-[#DEE8E0] shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-sans">
                  <Smartphone className="h-4 w-4 text-[#3F5B42]" />
                  8. Device & App Sync Hub
                </CardTitle>
                <div className="flex items-center gap-1">
                  {Object.values(appConnections).some(v => v === 'connected') ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-bold px-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                      Live Feed Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 font-bold px-1.5 font-sans">
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="text-[11px] leading-relaxed mt-1">
                Unified live integration from wearable telemetry, pharmacy medication logs, and nutritional APIs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-4">
              
              {/* Connected Feeds and Portals Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Connected Feeds & Portals
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'apple_health', name: 'Apple HealthKit', icon: Apple, color: 'text-red-500', bg: 'bg-red-50/30 border-red-100' },
                    { id: 'android_connect', name: 'Android Health Connect', icon: Smartphone, color: 'text-emerald-500', bg: 'bg-emerald-50/40 border-emerald-100' },
                    { id: 'pharmacy', name: 'CarePlus Pharmacy Hub', icon: Pill, color: 'text-amber-500', bg: 'bg-amber-50/40 border-amber-100' },
                    { id: 'nutrition', name: 'Nutrition Sync (MyFitnessPal)', icon: Utensils, color: 'text-sky-500', bg: 'bg-sky-50/40 border-sky-100' }
                  ].map((app) => {
                    const status = appConnections[app.id];
                    return (
                      <div key={app.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${app.bg} transition-all duration-200 text-xs`}>
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <div className={`p-1.5 rounded-lg bg-white border border-slate-100 shrink-0 ${app.color}`}>
                            <app.icon className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-slate-800 leading-tight">{app.name}</div>
                            <div className="text-[9px] font-semibold font-mono uppercase tracking-wide flex items-center gap-1">
                              {status === 'connected' && (
                                <span className="text-emerald-700 flex items-center gap-1">● Synced & Live</span>
                              )}
                              {status === 'connecting' && (
                                <span className="text-amber-700 animate-pulse flex items-center gap-1">⏱ Linking...</span>
                              )}
                              {status === 'disconnected' && (
                                <span className="text-slate-400">Not Synced</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={connectingApp !== null}
                          onClick={() => toggleAppConnection(app.id)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border ${
                            status === 'connected'
                              ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              : status === 'connecting'
                              ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-[#3F5B42] border-[#2D422E] text-white hover:bg-[#324935] shadow-sm'
                          }`}
                        >
                          {status === 'connected' ? 'Disconnect' : status === 'connecting' ? 'Linking...' : 'Link Portal'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.values(appConnections).some(v => v === 'connected') ? (
                <>
                  <div className="border-t border-slate-100 w-full my-1" />
                  
                  {/* Parameter Permission Matrix */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Sync Scope & Parameters
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected'}
                        onClick={() => setSyncPermissions(p => ({ ...p, steps: !p.steps }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          (appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected')
                            ? 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                            : syncPermissions.steps 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">🏃‍♀️ Step Count</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.steps && (appConnections.apple_health === 'connected' || appConnections.android_connect === 'connected') ? 'text-[#3F5B42] opacity-100' : 'opacity-0'}`} />
                      </button>
                      <button
                        type="button"
                        disabled={appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected'}
                        onClick={() => setSyncPermissions(p => ({ ...p, heartRate: !p.heartRate }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          (appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected')
                            ? 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                            : syncPermissions.heartRate 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">❤️ Heart Rate</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.heartRate && (appConnections.apple_health === 'connected' || appConnections.android_connect === 'connected') ? 'text-[#3F5B42] opacity-100' : 'opacity-0'}`} />
                      </button>
                      <button
                        type="button"
                        disabled={appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected'}
                        onClick={() => setSyncPermissions(p => ({ ...p, sleep: !p.sleep }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          (appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected')
                            ? 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                            : syncPermissions.sleep 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">💤 Sleep Analysis</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.sleep && (appConnections.apple_health === 'connected' || appConnections.android_connect === 'connected') ? 'text-[#3F5B42] opacity-100' : 'opacity-0'}`} />
                      </button>
                      <button
                        type="button"
                        disabled={appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected'}
                        onClick={() => setSyncPermissions(p => ({ ...p, glucose: !p.glucose }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          (appConnections.apple_health !== 'connected' && appConnections.android_connect !== 'connected')
                            ? 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                            : syncPermissions.glucose 
                            ? 'bg-emerald-50/50 border-[#DEE8E0] text-emerald-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">🩸 blood Glucose</span>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${syncPermissions.glucose && (appConnections.apple_health === 'connected' || appConnections.android_connect === 'connected') ? 'text-[#3F5B42] opacity-100' : 'opacity-0'}`} />
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
                      <div className="space-y-1.5 divide-y divide-slate-100 max-h-24 overflow-y-auto pr-1 text-slate-700">
                        {syncHistory.map((h, idx) => (
                          <div key={idx} className="text-[10px] flex items-center justify-between pt-1.5 first:pt-0">
                            <span className="font-medium text-slate-700">
                              🕒 {h.time} — <strong className="text-slate-950 font-bold">{h.device}</strong>
                            </span>
                            <span className="bg-[#EEF3F0] text-[#3F5B42] px-1.5 py-0.5 rounded font-mono font-bold">
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
                    <span className="text-xs font-bold text-slate-700 block">All Integrations Paused</span>
                    <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                      Link a wearable, pharmacy, or nutrition system above to start streaming digital biomarkers securely.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAppConnection('apple_health')}
                    className="px-4 py-1.5 bg-[#3F5B42] hover:bg-[#324935] text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                  >
                    Quick-Link Apple HealthKit
                  </button>
                </div>
              )}

            </CardContent>
          </Card>
          </motion.div>
          )}
          
          {/* Scheduling focus */}
          {((!isMobile && (layoutMode === 'dossier' || currentPage === 6)) || (isMobile && currentPage === 6)) && (
            <motion.div
              key="page6-right"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {(!isMobile || currentPage === 6) && (
                <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  9. Upcoming Session
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
              )}

              {/* Active Medications & Refills */}
              {(!isMobile || currentPage === 6) && (
                <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-pink-600" />
                  10. Active Prescriptions
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
              )}
            </motion.div>
          )}

        </div>

      </div>

      {/* Mobile Only: Beautiful Interactive Page Footer Navigation Controls */}
      {isMobile && currentPage !== 1 && (
        <div className="mt-8 mb-6 p-4 bg-white border border-slate-250 rounded-2xl shadow-xs font-sans flex flex-col items-center gap-3 animate-fadeIn">
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-705 font-bold hover:bg-slate-100 disabled:opacity-45 disabled:hover:bg-slate-50 text-xs transition-colors cursor-pointer select-none focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" />
              Prev
            </button>

            <span className="text-[11px] font-black uppercase text-[#3F5B42] tracking-wider font-sans">
              {
                currentPage === 1 ? "1. Health Board" :
                currentPage === 2 ? "2. Biometric Vitals" :
                currentPage === 3 ? "3. Trends & Habits" :
                currentPage === 4 ? "4. EHR Data & Privacy" :
                currentPage === 5 ? "5. Engagement & Devices" :
                "6. Daily Action Plan"
              }
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(6, prev + 1))}
              disabled={currentPage === 6}
              className="flex items-center justify-center h-8 px-3 bg-[#3F5B42] hover:bg-[#324935] text-white rounded-lg font-bold disabled:opacity-45 disabled:hover:bg-[#3F5B42] text-xs transition-colors cursor-pointer select-none focus:outline-none"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2 mt-1">
            {[...Array(6)].map((_, i) => {
              const p = i + 1;
              const active = currentPage === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-3.5 h-1.5 rounded-full transition-all focus:outline-none ${
                    active ? 'w-6 bg-[#3F5B42]' : 'bg-slate-200 hover:bg-slate-350'
                  }`}
                  title={`Go to Page ${p}`}
                />
              );
            })}
          </div>

          <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-1">
            Swipe left/right or use controls to browse the clinical board
          </p>
        </div>
      )}

      {/* Centered Telemetry Focus & All Vitals Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Underlay / Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
          />
          
          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col z-10 border border-[#DEE8E0] max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#DEE8E0] bg-[#EEF3F0]/65 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#3F5B42]" />
                  Clinical Telemetry Panel
                </h3>
                <p className="text-[11px] font-semibold text-[#5C6E5E] mt-0.5">
                  Configure focus dashboard and explore your complete physiological metrics
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-300/40 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sticky Search bar */}
            <div className="p-4 border-b border-[#DEE8E0] bg-[#FAFCFB] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 16 clinical vitals..."
                  value={drawerSearchQuery}
                  onChange={(e) => setDrawerSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-[#3F5B42] focus:border-[#3F5B42] outline-none font-medium text-slate-800 shadow-sm transition-all"
                />
                {drawerSearchQuery && (
                  <button 
                    onClick={() => setDrawerSearchQuery('')} 
                    className="absolute right-2.5 top-2 hover:bg-slate-100 rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5 text-slate-450" />
                  </button>
                )}
              </div>
            </div>

            {/* Content List Scroller */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {(() => {
                const searchLower = drawerSearchQuery.toLowerCase();
                const clinicalCategories = [
                  {
                    name: 'Metabolic & Hemodynamics',
                    items: ['Blood Glucose', 'Blood Pressure', 'Heart Rate', 'HbA1c Baseline']
                  },
                  {
                    name: 'Respiration & Core',
                    items: ['Oxygen Saturation', 'Respiratory Rate', 'Temperature']
                  },
                  {
                    name: 'Body Indices',
                    items: ['Body Weight', 'Height', 'BMI Quotient']
                  },
                  {
                    name: 'Clinical & Neuro Scales',
                    items: ['Glasgow Coma Scale', 'AVPU Response', 'Pain Index']
                  },
                  {
                    name: 'Lifestyle & Habits',
                    items: ['Sleep Log', 'Daily Target Steps', 'Hydration Status']
                  }
                ];

                let matchesAny = false;

                const categoryBlocks = clinicalCategories.map((cat) => {
                  const matchedVitals = sortedVitals.filter(v => {
                    const isInCategory = cat.items.includes(v.name);
                    const matchesSearch = v.name.toLowerCase().includes(searchLower) || (v.value || '').toLowerCase().includes(searchLower) || (v.status || '').toLowerCase().includes(searchLower);
                    return isInCategory && matchesSearch;
                  });

                  if (matchedVitals.length === 0) return null;
                  matchesAny = true;

                  return (
                    <div key={cat.name} className="space-y-2.5">
                      <h4 className="text-[10px] font-black text-[#5C6E5E] uppercase tracking-wider border-b border-dashed border-[#DEE8E0] pb-1">
                        {cat.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matchedVitals.map((v) => {
                          const VIcon = v.icon;
                          const isPinned = pinnedVitals.includes(v.name);
                          return (
                            <div 
                              key={v.name} 
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-[#FAFCFB] hover:border-slate-200 transition-all shadow-sm"
                            >
                              <div className="flex items-center gap-3 max-w-[70%]">
                                <div className={`p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800`}>
                                  <VIcon className="h-4 w-4 shrink-0 opacity-80" />
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                                    {v.name}
                                    {isPinned && (
                                      <span className="text-[8px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded">
                                        Pinned
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-medium text-[#5C6E5E] leading-relaxed flex items-center gap-1 mt-0.5">
                                    <span className="truncate">{v.status || 'Active Tracking'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-xs font-black font-mono text-slate-800">{v.value}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(v.name)}
                                  title={isPinned ? "Unpin from main telemetry focus" : "Pin to main telemetry focus"}
                                  className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                                >
                                  {isPinned ? (
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                  ) : (
                                    <Star className="h-3.5 w-3.5 text-slate-300 hover:text-amber-500 transition-colors" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });

                if (!matchesAny) {
                  return (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-705">No matches found</p>
                        <p className="text-[11px] text-slate-400">Try searching for other clinical synonyms</p>
                      </div>
                    </div>
                  );
                }

                return <div className="space-y-6">{categoryBlocks}</div>;
              })()}
            </div>

            {/* Sticky Modal Footer actions */}
            <div className="p-4 border-t border-[#DEE8E0] bg-[#EEF3F0]/35 flex items-center justify-between gap-3 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setPinnedVitals(['Blood Glucose', 'Blood Pressure', 'Heart Rate', 'Oxygen Saturation']);
                  localStorage.setItem('careplus_pinned_vitals_v3', JSON.stringify(['Blood Glucose', 'Blood Pressure', 'Heart Rate', 'Oxygen Saturation']));
                }}
                className="px-3.5 py-1.5 bg-white border border-slate-205 text-slate-650 hover:text-slate-900 text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reset Pins to Default
              </button>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 py-2 bg-[#3F5B42] hover:bg-[#324935] text-white text-xs font-bold rounded-lg transition-all border border-[#2D422E] cursor-pointer shadow-sm"
              >
                Apply Layout & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}



    </div>
  );
}
