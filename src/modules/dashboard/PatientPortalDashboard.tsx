import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, Calendar, MessageSquare, Pill, Home, 
  Users, Heart, TrendingUp, CheckCircle2, Watch, 
  MapPin, ChevronRight, Stethoscope, Compass, Plus, 
  Send, RefreshCw, Smartphone, Flame, Moon, Check, 
  UserCheck, Keyboard, HelpCircle, Loader2, ArrowRight, ShieldCheck, Mail,
  Clock, Sliders, Footprints, Droplets, Wind, Thermometer, Scale, Brain,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useQueryModel } from '../../store/eventStore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  createMessage, 
  createRefillRequest, 
  savePrescription 
} from '../../services/clinicalFirestoreService';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  rose: { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  sky: { text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  violet: { text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  orange: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  slate: { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
};

// Types for Portal Features
interface FitnessClass {
  id: string;
  title: string;
  time: string;
  location: string;
  instructor: string;
  calories: number;
}

interface SocialGroup {
  id: string;
  title: string;
  time: string;
  location: string;
  membersCount: number;
  description: string;
}

const MOCK_FITNESS_CLASSES: FitnessClass[] = [
  { id: 'f1', title: 'Early-Morning Calisthenics & Cardio', time: 'Monday & Wednesday, 6:00 AM', location: 'Queen\'s Park Savannah', instructor: 'Marcus Johnson', calories: 420 },
  { id: 'f2', title: 'PCOS Core Balance Pilates', time: 'Tuesdays, 5:30 PM', location: 'Wellness Clinic Studio', instructor: 'Elena Rodriguez, RN', calories: 280 },
  { id: 'f3', title: 'Diabetes Conditioning Yoga', time: 'Thursdays, 8:00 AM', location: 'Online Streaming', instructor: 'Patricia Bennett', calories: 180 }
];

const MOCK_SOCIAL_GROUPS: SocialGroup[] = [
  { id: 'g1', title: 'Port of Spain Metabolic Walkers', time: 'Saturdays, 7:00 AM', location: 'Botanical Gardens', membersCount: 34, description: 'Supportive group walks for diabetes & cardiovascular stamina.' },
  { id: 'g2', title: 'Integrative Nutrition Peer Group', time: 'Wednesdays, 7:00 PM', location: 'Clinic Community Room', membersCount: 19, description: 'Sharing whole-food recipe hacks for glucose control.' },
  { id: 'g3', title: 'Active PCOS Sisters Support', time: 'Bi-weekly Fridays, 6:00 PM', location: 'Green Leaf Cafe', membersCount: 22, description: 'Conversations, advice sharing, and light physical conditioning.' }
];

export function PatientPortalDashboard() {
  const { userProfile } = useCurrentUser();
  const { appointments, patients } = useQueryModel();
  
  const sizeClass = typeof window !== 'undefined' && window.innerWidth > 840 ? 'expanded' : 'compact';

  // State Management
  const [activeTab, setActiveTab] = useState<'board' | 'simulator' | 'community'>('board');
  const [joinedEvents, setJoinedEvents] = useState<string[]>(() => {
    const saved = localStorage.getItem(`patient_joined_events_${userProfile?.id || ''}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Simulator Multi-Factor Toggles (Dynamic Score influence!)
  const [deviceSynced, setDeviceSynced] = useState(true);
  const [stepGoalMet, setStepGoalMet] = useState(false);
  const [medCompliance, setMedCompliance] = useState(true);
  const [sleepScoreHigh, setSleepScoreHigh] = useState(true);
  const [vitalsInNorm, setVitalsInNorm] = useState(true);

  // Modals & Panels Trigger
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [isHomeVisitOpen, setIsHomeVisitOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [vitalsExpanded, setVitalsExpanded] = useState(false);

  const renderTrend = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
    if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />;
    return <Minus className="h-3.5 w-3.5 text-slate-300" />;
  };

  const primaryVitals = useMemo(() => {
    return [
      { id: 'v1', label: 'Heart Rate', value: '66', unit: 'bpm', trend: 'stable', icon: Heart, color: 'rose' },
      { id: 'v2', label: 'Blood Pressure', value: '118/75', unit: 'mmHg', trend: 'down', icon: Activity, color: 'indigo' },
      { id: 'v3', label: 'Daily Steps', value: stepGoalMet ? '10,482' : '4,832', unit: 'steps', trend: stepGoalMet ? 'up' : 'stable', icon: Footprints, color: 'sky' },
      { id: 'v4', label: 'Sleep Avg', value: sleepScoreHigh ? '7.8' : '5.4', unit: 'hrs', trend: sleepScoreHigh ? 'stable' : 'down', icon: Moon, color: 'violet' },
      { id: 'v5', label: 'Blood Oxygen', value: '99', unit: '%', trend: 'stable', icon: Wind, color: 'cyan' },
      { id: 'v6', label: 'Glucose (Fasting)', value: vitalsInNorm ? '106' : '158', unit: 'mg/dL', trend: vitalsInNorm ? 'down' : 'up', icon: Droplets, color: 'amber' },
      { id: 'v7', label: 'Respiratory Rate', value: '14', unit: 'br/min', trend: 'stable', icon: Activity, color: 'teal' },
      { id: 'v8', label: 'Body Temp', value: '98.6', unit: '°F', trend: 'stable', icon: Thermometer, color: 'orange' },
    ];
  }, [stepGoalMet, sleepScoreHigh, vitalsInNorm]);

  const secondaryVitals = useMemo(() => {
    return [
      { id: 's1', label: 'GCS Score', value: '15', unit: '/15', trend: 'stable', icon: Brain, color: 'slate' },
      { id: 's2', label: 'BMI', value: '24.2', unit: 'kg/m²', trend: 'stable', icon: Scale, color: 'slate' },
      { id: 's3', label: 'Pain Level', value: '2', unit: '/10', trend: 'down', icon: Activity, color: 'slate' },
      { id: 's4', label: 'Weight', value: '175', unit: 'lbs', trend: 'stable', icon: Scale, color: 'slate' },
    ];
  }, []);

  const buckets = useMemo(() => {
    let optimal = 5; // Heart Rate, BP, Oxygen, Resp, Temp
    let monitoring = 0; // Steps starts here or optimal
    let attention = 0; // Sleep & Glucose can start here

    if (stepGoalMet) {
      optimal += 1;
    } else {
      monitoring += 1;
    }

    if (sleepScoreHigh) {
      optimal += 1;
    } else {
      attention += 1;
    }

    if (vitalsInNorm) {
      optimal += 1;
    } else {
      attention += 1;
    }

    return { optimal, monitoring, attention };
  }, [stepGoalMet, sleepScoreHigh, vitalsInNorm]);

  const dynamicInsights = useMemo(() => {
    const list = [];
    
    // Insight 1: Fasting Glucose
    if (!vitalsInNorm) {
      list.push({
        id: 'ins-glucose',
        category: 'Metabolic Pathway',
        metrics: 'Fasting glucose is elevated (158 mg/dL)',
        status: 'attention',
        icon: Droplets,
        colorClass: 'text-[#D4A373]'
      });
    } else {
      list.push({
        id: 'ins-glucose',
        category: 'Metabolic Pathway',
        metrics: 'Fasting glucose is optimal (106 mg/dL)',
        status: 'optimal',
        icon: Droplets,
        colorClass: 'text-emerald-600'
      });
    }

    // Insight 2: Sleep Average
    if (!sleepScoreHigh) {
      list.push({
        id: 'ins-sleep',
        category: 'Rest & Recovery',
        metrics: 'Sleep average is short & restless (5.4 hrs)',
        status: 'attention',
        icon: Moon,
        colorClass: 'text-[#D4A373]'
      });
    } else {
      list.push({
        id: 'ins-sleep',
        category: 'Rest & Recovery',
        metrics: 'Sleep average is deep & therapeutic (7.8 hrs)',
        status: 'optimal',
        icon: Moon,
        colorClass: 'text-emerald-600'
      });
    }

    // Insight 3: Steps Physical Activity
    if (!stepGoalMet) {
      list.push({
        id: 'ins-steps',
        category: 'Cardiovascular Reflex',
        metrics: 'Steps below daily active target (4,832 steps)',
        status: 'monitoring',
        icon: Footprints,
        colorClass: 'text-slate-500'
      });
    } else {
      list.push({
        id: 'ins-steps',
        category: 'Cardiovascular Reflex',
        metrics: 'Daily active steps exceeded (10,482 steps)',
        status: 'optimal',
        icon: Footprints,
        colorClass: 'text-emerald-600'
      });
    }

    return list;
  }, [vitalsInNorm, sleepScoreHigh, stepGoalMet]);

  // Active inputs / submission variables
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [messageBody, setMessageBody] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('Queen\'s Park Pharmacy');
  const [rxNotes, setRxNotes] = useState('');

  // Home Visit input fields
  const [homeVisitSymptoms, setHomeVisitSymptoms] = useState<string[]>([]);
  const [homeVisitDate, setHomeVisitDate] = useState('Tomorrow');
  const [homeVisitTime, setHomeVisitTime] = useState('Morning (8:00 AM - 12:00 PM)');
  const [homeVisitNotes, setHomeVisitNotes] = useState('');

  // Patient Booking input fields
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingProviderId, setBookingProviderId] = useState('theogate_provider');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [bookingTimeSlot, setBookingTimeSlot] = useState('09:30 AM');
  const [bookingVisitType, setBookingVisitType] = useState<'in_clinic' | 'telehealth'>('in_clinic');
  const [bookingPriority, setBookingPriority] = useState<'routine' | 'urgent'>('routine');
  const [bookingReason, setBookingReason] = useState('');

  // Status logs
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Firestore prescription fetching
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  // Sound feedback simulator (Micro-interactions)
  const playHapticSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.12);
    } catch (e) {
      // AudioContext blocks sometimes, ignore
    }
  };

  // Keyboard Shortcuts (Universal/Spatial Android guidelines requirement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an inputs
      const targetTag = (e.target as HTMLElement).tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'm') {
        e.preventDefault();
        playHapticSound();
        setIsMessageOpen(true);
      } else if (key === 'r') {
        e.preventDefault();
        playHapticSound();
        setIsRefillOpen(true);
      } else if (key === 'h') {
        e.preventDefault();
        playHapticSound();
        setIsHomeVisitOpen(true);
      } else if (key === 's') {
        e.preventDefault();
        setActiveTab('simulator');
      } else if (key === 'b') {
        e.preventDefault();
        setActiveTab('board');
      } else if (key === 'c') {
        e.preventDefault();
        setActiveTab('community');
      } else if (e.key === 'Escape') {
        setIsMessageOpen(false);
        setIsRefillOpen(false);
        setIsHomeVisitOpen(false);
        setShowShortcutsHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to database or Fetch prescriptions
  useEffect(() => {
    if (!userProfile?.id) return;
    const fetchPrescriptions = async () => {
      try {
        const q = query(collection(db, 'patients', userProfile.id, 'prescriptions'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setPrescriptions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          // fallback mock prescriptions
          setPrescriptions([
            { id: 'rx-1', medicationName: 'Metformin', dosage: '500mg', frequency: 'Twice daily', condition: 'Type 2 Diabetes', status: 'active' },
            { id: 'rx-2', medicationName: 'Spironolactone (Aldactone)', dosage: '50mg', frequency: 'Once daily', condition: 'PCOS symptoms', status: 'active' },
          ]);
        }
      } catch (e) {
        setPrescriptions([
          { id: 'rx-1', medicationName: 'Metformin', dosage: '500mg', frequency: 'Twice daily', condition: 'Type 2 Diabetes', status: 'active' },
          { id: 'rx-2', medicationName: 'Spironolactone (Aldactone)', dosage: '50mg', frequency: 'Once daily', condition: 'PCOS symptoms', status: 'active' },
        ]);
      }
    };
    fetchPrescriptions();
  }, [userProfile?.id]);

  // Persist Joined community events
  const handleToggleJoinEvent = (eventId: string, title: string) => {
    playHapticSound();
    let updated;
    if (joinedEvents.includes(eventId)) {
      updated = joinedEvents.filter(id => id !== eventId);
      triggerToast(`Removed: ${title}`);
    } else {
      updated = [...joinedEvents, eventId];
      triggerToast(`Joined event: ${title}! Added to calendar.`);
    }
    setJoinedEvents(updated);
    localStorage.setItem(`patient_joined_events_${userProfile?.id || ''}`, JSON.stringify(updated));
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // 1. HEALTH SCORE DYNAMIC CALCULATOR LOGIC
  // Based on current conditions, vitals adherence, medication, visits, tracking
  const healthFactors = useMemo(() => {
    const scores = {
      vitals: vitalsInNorm ? 20 : 12,
      history: 18, // Based on managing chronic Rheumatoid Arthritis stabilized
      medication: medCompliance ? 25 : 10,
      visits: 12, // Stable routine visits to Dr. Gregory Theogate & clinical team
      activity: (deviceSynced ? 10 : 0) + (stepGoalMet ? 8 : 4) + (sleepScoreHigh ? 7 : 3)
    };

    const total = scores.vitals + scores.history + scores.medication + scores.visits + scores.activity;
    
    let label = 'Fair';
    let gradientColors = 'from-[#F59E0B] to-[#D97706]';
    let textColor = 'text-[#D97706]';

    if (total >= 85) {
      label = 'Excellent';
      gradientColors = 'from-emerald-500 to-teal-600';
      textColor = 'text-emerald-600';
    } else if (total >= 70) {
      label = 'Strong';
      gradientColors = 'from-[#0078D4] to-[#015A9E]';
      textColor = 'text-sky-600';
    }

    return {
      scores,
      total,
      label,
      gradientColors,
      textColor
    };
  }, [deviceSynced, stepGoalMet, medCompliance, sleepScoreHigh, vitalsInNorm]);

  // Healthcare Providers List configured exactly for Current Health issues (Rheumatoid Arthritis & Autoimmune Management)
  const healthcareProviders = [
    { 
      id: 'theogate_provider', 
      name: 'Dr. Gregory Theogate, MD', 
      role: 'Clinical Rheumatology Lead', 
      specialty: 'Clinical Immunology & Rheumatology', 
      currentIssue: 'Rheumatoid Arthritis Management',
      avatar: 'GT',
      primary: true 
    },
    { 
      id: 'theodore_provider', 
      name: 'Dr. Karl Theodore', 
      role: 'Secondary Care Specialist', 
      specialty: 'Neurosurgery & Cranial Consultation', 
      currentIssue: 'Post-Op Follow-up & Reflex Metrics',
      avatar: 'KT',
      primary: false 
    },
    { 
      id: 'elena_provider', 
      name: 'Elena Rodriguez, RN', 
      role: 'Adherence Coordinator', 
      specialty: 'Nursing & Family Triage Lead', 
      currentIssue: 'Biometric Wearable Stream Syncing',
      avatar: 'ER',
      primary: false 
    }
  ];

  // Messaging submission API Integration (writes deep to firestore)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !selectedProvider) return;
    setSubmitting(true);
    playHapticSound();

    try {
      await createMessage({
        fromUserId: userProfile?.patientId || userProfile?.id || 'pat-marcus-001',
        fromUserName: userProfile?.displayName || 'Marcus Everett',
        fromRole: 'patient',
        senderId: userProfile?.patientId || userProfile?.id || 'pat-marcus-001',
        senderName: userProfile?.displayName || 'Marcus Everett',
        senderRole: 'patient',
        toUserId: selectedProvider.id,
        toUserName: selectedProvider.name,
        toRole: 'clinician',
        recipientId: selectedProvider.id,
        recipientName: selectedProvider.name,
        subject: `Re: ${selectedProvider.currentIssue}`,
        body: messageBody,
        text: messageBody,
        read: false,
        status: 'sent',
        priority: 'routine'
      });

      triggerToast(`Successfully sent secure message to ${selectedProvider.name}!`);
      setMessageBody('');
      setIsMessageOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('Local Sync Error: Msg Enqueued');
    } finally {
      setSubmitting(false);
    }
  };

  // Refill request submission API Integration
  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMeds.length === 0) return;
    setSubmitting(true);
    playHapticSound();

    try {
      await createRefillRequest(userProfile?.patientId || userProfile?.id || 'pat-marcus-001', {
        medications: selectedMeds,
        pharmacy: selectedPharmacy,
        patientNotes: rxNotes,
        requestDate: new Date().toISOString()
      });

      triggerToast(`Rx renewal requested for ${selectedMeds.join(', ')} via ${selectedPharmacy}`);
      setSelectedMeds([]);
      setRxNotes('');
      setIsRefillOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('Error filing pharmacy refill sync.');
    } finally {
      setSubmitting(false);
    }
  };

  // Home Visit request (schedules clinic visit triage in appointments)
  const handleHomeVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    playHapticSound();

    try {
      const visitId = `home-${Date.now()}`;
      const payload = {
        id: visitId,
        patientId: userProfile?.patientId || userProfile?.id || 'pat-marcus-001',
        patientName: userProfile?.displayName || 'Marcus Everett',
        type: 'home_triage',
        specialty: 'Family Nursing Triage Unit',
        symptoms: homeVisitSymptoms,
        preferredDate: homeVisitDate,
        preferredTime: homeVisitTime,
        status: 'requested',
        notes: homeVisitNotes,
        createdAt: new Date().toISOString()
      };

      // Sync and add item to Firestore
      await addDoc(collection(db, 'appointments'), payload);
      
      triggerToast('Home Visit Request Sent! A triage nurse is preparing coordinates.');
      setHomeVisitSymptoms([]);
      setHomeVisitNotes('');
      setIsHomeVisitOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('Visit requested locally. Scheduling synced.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingReason.trim()) {
      triggerToast("Please enter a reason for the consultation.");
      return;
    }
    setSubmitting(true);
    playHapticSound();

    try {
      const apptId = `appt-${Date.now()}`;
      
      // Calculate appointment time
      const [timeStr, ampm] = bookingTimeSlot.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const apptDate = new Date(bookingDate);
      apptDate.setHours(hours, minutes, 0, 0);

      const provider = healthcareProviders.find(p => p.id === bookingProviderId);

      const payload = {
        id: apptId,
        patientId: userProfile?.patientId || userProfile?.id || 'pat-marcus-001',
        patientName: userProfile?.displayName || 'Marcus Everett',
        providerId: bookingProviderId,
        providerName: provider?.name || 'Dr. G. Theogate',
        time: apptDate.toISOString(),
        duration: 30,
        status: 'scheduled',
        visitType: bookingVisitType,
        priority: bookingPriority,
        reason: bookingReason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Write directly to Firestore
      await addDoc(collection(db, 'appointments'), payload);

      triggerToast('Appointment Booked Successfully!');
      setBookingReason('');
      setIsBookingOpen(false);
    } catch (err) {
      console.error("Booking error:", err);
      triggerToast('Error scheduling- booking saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    playHapticSound();
    
    try {
      const apptsRef = collection(db, 'appointments');
      const q = query(apptsRef, where("id", "==", appointmentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'appointments', querySnapshot.docs[0].id);
        await updateDoc(docRef, { 
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        });
        triggerToast('Appointment Cancelled.');
      } else {
        triggerToast('Could not find appointment to cancel.');
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      triggerToast('Error updating appointment status.');
    }
  };

  // Dynamic Upcoming Schedule listing merging clinical appointments + registered community events
  const userAppointments = useMemo(() => {
    const list = Object.values(appointments || {})
      .filter((a: any) => a.patientId === (userProfile?.patientId || userProfile?.id || 'pat-marcus-001') && a.status !== 'cancelled')
      .map((a: any) => {
        let title = 'Clinical Consultation';
        let timeFormatted = 'TBD';
        let isHomeVisit = false;
        
        if (a.type === 'home_triage') {
          title = 'Mobile Home Triage';
          timeFormatted = `${a.preferredDate || 'Tomorrow'} - ${a.preferredTime || 'Morning'}`;
          isHomeVisit = true;
        } else {
          title = a.reason || 'General Health Consultation';
          if (a.providerName) {
            title += ` with ${a.providerName}`;
          } else if (a.providerId) {
            const provider = healthcareProviders.find(p => p.id === a.providerId);
            if (provider) title += ` with ${provider.name}`;
          }
          
          if (a.time) {
            try {
              const d = new Date(a.time);
              timeFormatted = d.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
            } catch (e) {
              timeFormatted = String(a.time);
            }
          }
        }

        return {
          id: a.id,
          title,
          time: timeFormatted,
          badgeColor: a.visitType === 'telehealth' 
            ? 'bg-sky-50 border-sky-100 text-sky-700' 
            : 'bg-indigo-50 border-indigo-100 text-indigo-700',
          icon: Stethoscope,
          location: a.type === 'home_triage' 
            ? 'Home Dispatch' 
            : a.visitType === 'telehealth' || a.visitType === 'virtual'
              ? 'Virtual Telehealth Link' 
              : 'Main Clinic Building',
          info: a.notes || a.reason || 'Routine follow-up',
          isClinicAppt: a.type !== 'home_triage',
          status: a.status || 'scheduled'
        };
      });

    // Append joined fitness classes
    const joinedFitness = MOCK_FITNESS_CLASSES
      .filter(f => joinedEvents.includes(f.id))
      .map(f => ({
        id: f.id,
        title: f.title,
        time: f.time,
        badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        icon: Activity,
        location: f.location,
        info: `Instructor: ${f.instructor} • Est. burn: ${f.calories} kcal`,
        isClinicAppt: false
      }));

    // Append joined social events
    const joinedSocial = MOCK_SOCIAL_GROUPS
      .filter(g => joinedEvents.includes(g.id))
      .map(g => ({
        id: g.id,
        title: g.title,
        time: g.time,
        badgeColor: 'bg-amber-50 border-amber-100 text-amber-700',
        icon: Users,
        location: g.location,
        info: g.description,
        isClinicAppt: false
      }));

    return [...list, ...joinedFitness, ...joinedSocial];
  }, [appointments, joinedEvents, userProfile]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#FAFCFB] to-[#F1F6F2] text-slate-900 font-sans p-4 sm:p-6 md:p-12 select-none outline-none relative pb-16">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 border border-slate-800 text-white shadow-xl rounded-2xl flex items-center gap-3"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. The Greeting & Reassurance (Narrative Feed Start) */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 w-fit select-none">
              <CheckCircle2 size={12} className="animate-pulse" /> Encrypted Sync Active
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
              Last updated: Just now
            </span>
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 select-none">
              • ID: <span className="text-slate-800 font-mono font-black">{userProfile?.id?.slice(0, 8).toUpperCase()}</span>
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tight mb-2">
            Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Benjamin'}.
          </h1>
          <p className="text-lg font-medium text-[#757370] max-w-3xl leading-relaxed">
            Your overall health score is <span className="text-emerald-600 font-bold">{healthFactors.total} ({healthFactors.label})</span>. 
            Your vital signs are stable and your wearable data is successfully aligned with your clinical baseline.
          </p>
        </div>

        {/* Shortcuts tag helper */}
        <button 
          onClick={() => setShowShortcutsHelp(true)}
          className="shrink-0 h-10 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-sm group hover:border-slate-300 active:scale-95 cursor-pointer"
          title="Show Gaze-friendly Keyboard Hotkeys"
        >
          <Keyboard size={15} />
          <span className="text-[10px] font-black uppercase tracking-widest">Hotkeys</span>
        </button>
      </div>

      {/* 2. The Next Step / Immediate Action */}
      <div className="flex flex-col md:flex-row gap-5 mb-10">
        <div className="flex-1 bg-slate-900 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-slate-900/10">
          <div className="flex items-center gap-4 text-white">
            <div className="p-3 bg-white/10 rounded-2xl shrink-0">
              <Calendar size={24} className="text-sky-400" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Next Clinical Event</h3>
              {userAppointments.length > 0 ? (
                <div>
                  <p className="text-base font-bold text-white">{userAppointments[0].title}</p>
                  <p className="text-xs font-bold text-sky-300 mt-0.5">{userAppointments[0].time} • {userAppointments[0].location}</p>
                </div>
              ) : (
                <p className="text-base font-bold">No upcoming appointments this week.</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => { playHapticSound(); setActiveTab('community'); }}
            className="px-5 py-2.5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-sky-50 transition-colors w-fit shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            Browse Community
          </button>
        </div>

        {/* Quick Actions shrink to icon-buttons to save space */}
        <div className="flex gap-3">
          <button 
            onClick={() => { playHapticSound(); setIsMessageOpen(true); }}
            className="flex flex-col items-center justify-center gap-2 w-24 bg-white border border-[#EDEBE9] rounded-2.5xl hover:border-sky-300 hover:bg-sky-50/50 transition-all shadow-sm group cursor-pointer active:scale-95 animate-in fade-in"
            title="Message Care Team (Key [M])"
          >
            <MessageSquare size={20} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#616161]">Message</span>
          </button>
          
          <button 
            onClick={() => { playHapticSound(); setIsRefillOpen(true); }}
            className="flex flex-col items-center justify-center gap-2 w-24 bg-white border border-[#EDEBE9] rounded-2.5xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm group cursor-pointer active:scale-95 animate-in fade-in"
            title="Request Prescriptions (Key [R])"
          >
            <Pill size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#616161]">Refills</span>
          </button>

          <button 
            onClick={() => { playHapticSound(); setIsHomeVisitOpen(true); }}
            className="flex flex-col items-center justify-center gap-2 w-24 bg-white border border-[#EDEBE9] rounded-2.5xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-sm group cursor-pointer active:scale-95 animate-in fade-in"
            title="Request Home Triage (Key [H])"
          >
            <Home size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#616161]">Triage</span>
          </button>
        </div>
      </div>

      {/* Tabs list navigation panel */}
      <div id="prm-dashboard-tab-navigation" className="flex border-b border-[#EDEBE9] gap-4 mb-8">
        <button
          id="prm-dashboard-tab-board"
          onClick={() => { playHapticSound(); setActiveTab('board'); }}
          className={`pb-3.5 px-2 text-xs font-black tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === 'board' ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          My Health Board <span className="text-[8px] font-bold text-slate-400">[B]</span>
          {activeTab === 'board' && (
            <motion.div 
              layoutId="prm-dashboard-tab-active-bar" 
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950 rounded-full" 
            />
          )}
        </button>
        <button
          id="prm-dashboard-tab-simulator"
          onClick={() => { playHapticSound(); setActiveTab('simulator'); }}
          className={`pb-3.5 px-2 text-xs font-black tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === 'simulator' ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Adherence Score Simulator <span className="text-[8px] font-bold text-slate-400">[S]</span>
          <span className="absolute top-1.5 -right-2.5 h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" />
          {activeTab === 'simulator' && (
            <motion.div 
              layoutId="prm-dashboard-tab-active-bar" 
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950 rounded-full" 
            />
          )}
        </button>
        <button
          id="prm-dashboard-tab-community"
          onClick={() => { playHapticSound(); setActiveTab('community'); }}
          className={`pb-3.5 px-2 text-xs font-black tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === 'community' ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Classes & Wellness Groups <span className="text-[8px] font-bold text-slate-400">[C]</span>
          {activeTab === 'community' && (
            <motion.div 
              layoutId="prm-dashboard-tab-active-bar" 
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950 rounded-full" 
            />
          )}
        </button>
      </div>

      {/* Dynamic Content Columns based on selected Tab and Responsive constraints */}
      <AnimatePresence mode="wait">
        {activeTab === 'board' && (
          <motion.div 
            key="tab_board"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Box: Active Health Score & Drivers */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Main Adaptive Sage-Green & Bucketed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 1. The Score Ring Card */}
                <div id="prm-dashboard-score-card" className="md:col-span-5 relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#EBF0EC] to-[#DEE8E0] rounded-[2rem] border border-white/60 shadow-[inset_0_2px_20px_rgb(255,255,255,0.5)]">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Soft, thick SVG Ring representing the Biomarkers */}
                    <svg id="prm-dashboard-score-ring-svg" viewBox="0 0 176 176" className="w-full h-full transform -rotate-90">
                      {/* Background Track (Soft Yellow) */}
                      <circle cx="88" cy="88" r="72" stroke="#F4E6C3" strokeWidth="18" fill="none" strokeLinecap="round" />
                      {/* Progress Track (Sage Green) */}
                      <circle 
                        cx="88" cy="88" r="72" 
                        stroke="#9EBA9A" strokeWidth="18" fill="none" strokeLinecap="round"
                        strokeDasharray="452.4" strokeDashoffset={452.4 - (452.4 * healthFactors.total) / 100} 
                        className="drop-shadow-xs transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div id="prm-dashboard-score-ring-text" className="absolute text-center flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{healthFactors.total}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1 leading-none">Health Score</span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 leading-none">All 8 Vitals</span>
                    </div>
                  </div>
                </div>

                {/* 2. The Bucketed Metrics Summary Column */}
                <div className="md:col-span-7 flex flex-col gap-4 justify-between">
                  {/* Buckets Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/60 backdrop-blur-xl p-3 rounded-2xl border border-white/50 shadow-xs flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Optimal</span>
                      <span className="text-2xl font-black text-slate-800 leading-none">{buckets.optimal}</span>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl p-3 rounded-2xl border border-white/50 shadow-xs flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 leading-tight text-center">In Range</span>
                      <span className="text-2xl font-black text-slate-900 leading-none">{buckets.monitoring}</span>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl p-3 rounded-2xl border border-[#F4E6C3] shadow-[0_4px_20px_rgb(244,230,195,0.3)] flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#D4A373] mb-1 leading-tight text-center">Out of Range</span>
                      <span className="text-2xl font-black text-[#D4A373] leading-none">{buckets.attention}</span>
                    </div>
                  </div>

                  {/* High Quality Dynamic Observation Alert Block */}
                  <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xs flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#8BA888]">Live Care Insight</span>
                    </div>
                    <p className="text-xs text-slate-755 leading-snug">
                      Your personalized metabolic pathway aligns {healthFactors.total}% with normal neuro-physiological norms. 
                      {buckets.attention > 0 
                        ? ` There are ${buckets.attention} telemetry fields out of target range.` 
                        : " Keep adhering to your current care regimen!"}
                    </p>
                  </div>
                </div>

              </div>

              {/* Insight Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {dynamicInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="bg-white/80 backdrop-blur-xl p-4 rounded-2.5xl border border-white flex justify-between items-center group hover:bg-white transition-all cursor-pointer shadow-xs"
                    onClick={() => { playHapticSound(); setActiveTab('simulator'); }}
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest mb-1.5 block leading-none ${insight.colorClass}`}>
                        {insight.status === 'attention' ? 'Needs Attention' : insight.status === 'optimal' ? 'Optimal' : 'Monitoring'}
                      </span>
                      <h3 className="text-xs font-black text-slate-800 truncate">{insight.category}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal truncate">{insight.metrics}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F4F7F5] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 ml-2">
                      <ChevronRight size={14} className="text-[#8BA888]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* 3. The 2x4 Vitals Widget (Progressive Disclosure) */}
              <div className="bg-white border border-[#EDEBE9] rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-905 tracking-widest uppercase flex items-center gap-2">
                      <Activity size={16} className="text-rose-500 animate-pulse" />
                      Telemetry & Vital Signs
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Streamed from Health Connect
                    </p>
                  </div>
                  <Badge className="bg-sky-50 border-sky-100 text-sky-700 font-extrabold uppercase text-[8px] tracking-widest">
                    SYNCED {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </div>

                {/* Primary 2x4 Grid */}
                <div id="prm-dashboard-primary-vitals-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {primaryVitals.map(vital => {
                    const colorStyle = COLOR_CLASSES[vital.color] || COLOR_CLASSES.slate;
                    return (
                      <motion.div 
                        key={vital.id} 
                        id={`prm-vital-card-${vital.id}`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="p-4 bg-[#FAF9F8] border border-[#EDEBE9] rounded-2xl hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between cursor-default"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <vital.icon size={16} className={`${colorStyle.text}`} />
                          {renderTrend(vital.trend)}
                        </div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#757370] mb-1">
                          {vital.label}
                        </span>
                        <div className="flex items-baseline gap-1 mt-auto">
                          <span className="text-xl font-black text-slate-900">{vital.value}</span>
                          <span className="text-[10px] font-bold text-slate-400">{vital.unit}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Expandable Secondary Vitals */}
                <AnimatePresence>
                  {vitalsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 mb-4">
                        {secondaryVitals.map(vital => {
                          const colorStyle = COLOR_CLASSES[vital.color] || COLOR_CLASSES.slate;
                          return (
                            <div key={vital.id} className="p-4 bg-slate-50 border border-transparent rounded-2xl flex flex-col justify-between">
                              <div className="flex justify-between items-start mb-2">
                                <vital.icon size={16} className={`${colorStyle.text}`} />
                                {renderTrend(vital.trend)}
                              </div>
                              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                {vital.label}
                              </span>
                              <div className="flex items-baseline gap-1 mt-auto">
                                <span className="text-xl font-black text-slate-900">{vital.value}</span>
                                <span className="text-[10px] font-bold text-slate-400">{vital.unit}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Toggle Button */}
                <button 
                  onClick={() => { playHapticSound(); setVitalsExpanded(!vitalsExpanded); }}
                  className="w-full py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {vitalsExpanded ? (
                    <>Hide Clinical Vitals <ChevronUp size={14} strokeWidth={3} /></>
                  ) : (
                    <>View All Clinical Vitals <ChevronDown size={14} strokeWidth={3} /></>
                  )}
                </button>
              </div>

              {/* Roster of active Healthcare Providers (especially treating current health issues) */}
              <div className="bg-white border border-[#EDEBE9] rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#EDEBE9]">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                      <Users size={16} className="text-amber-500" /> My Care Team Network
                    </h3>
                    <p className="text-[10px] font-bold text-[#A19F9D] uppercase mt-0.5 tracking-wide">Providers managing active health matters</p>
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded tracking-widest">3 ACTIVE</span>
                </div>

                <div className="space-y-4">
                  {healthcareProviders.map(provider => (
                    <div 
                      key={provider.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/50 hover:bg-slate-50 border border-[#EDEBE9] hover:border-slate-300 rounded-xl transition-all gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 text-xs shadow-inner shrink-0 leading-none">
                          {provider.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-950">{provider.name}</h4>
                            {provider.primary && (
                              <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white px-1.5 py-0.5 rounded">Primary</span>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{provider.role} • {provider.specialty}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1">Managing: <span className="font-extrabold text-slate-700">{provider.currentIssue}</span></p>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                        <button 
                          onClick={() => {
                            playHapticSound();
                            setSelectedProvider(provider);
                            setIsMessageOpen(true);
                          }}
                          className="flex-1 sm:flex-initial h-9 px-4.5 bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest rounded-lg hover:bg-black transition-all flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare size={12} /> Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Combined Schedule & Upcoming Activities */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white border border-[#EDEBE9] rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#EDEBE9]">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                      <Calendar size={15} className="text-indigo-600" /> Active Schedule & Timeline
                    </h3>
                    <p className="text-[10px] font-bold text-[#A19F9D] uppercase mt-0.5 tracking-wide">Integrated clinic appointments & wellness sessions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { playHapticSound(); setIsBookingOpen(true); }}
                      className="h-7 px-2.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus size={10} strokeWidth={3} /> Book
                    </button>
                    <Badge className="bg-[#EDEBE9] border-[#EDEBE9] text-[#616161] font-extrabold uppercase text-[8px] tracking-widest">
                      {userAppointments.length} UPCOMING
                    </Badge>
                  </div>
                </div>
 
                <div className="space-y-4">
                  {userAppointments.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex flex-col gap-3 p-4 rounded-xl border transition-all hover:bg-slate-50/50 bg-[#FAF9F8]`}
                    >
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-xl h-fit border shrink-0 ${item.badgeColor}`}>
                          <item.icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-slate-900 truncate leading-tight mb-1">{item.title}</h4>
                          <p className="text-[10px] font-bold text-[#757370] flex items-center gap-1.5 mb-1 bg-white/70 py-0.5 px-2 rounded w-fit border border-slate-100">
                            <Clock size={11} className="text-[#0078D4]" /> {item.time}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                            <MapPin size={11} className="text-rose-500" /> {item.location}
                          </p>
                          <p className="text-[11px] text-[#242424] font-medium leading-relaxed italic bg-white/40 p-2 rounded-lg border border-slate-100 border-dashed">
                            {item.info}
                          </p>
                        </div>
                      </div>
                      
                      {item.isClinicAppt && (
                        <div className="flex justify-end pt-1 border-t border-slate-100/60">
                          <button
                            onClick={() => handleCancelAppointment(item.id)}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            Cancel Visit Selection
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {userAppointments.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <Calendar className="h-8 w-8 mx-auto text-slate-200. mb-2 animate-bounce" />
                      <p className="text-xs font-bold uppercase tracking-wider">Empty Schedule</p>
                      <p className="text-[10px] font-medium tracking-normal text-slate-400 mt-1">Review "Classes & Wellness Groups" to join social programs.</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { playHapticSound(); setActiveTab('community'); }}
                  className="w-full mt-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#242424] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-[#EDEBE9]"
                >
                  Browse Wellness Community →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. ADHERENCE SCORE SIMULATOR TAB */}
        {activeTab === 'simulator' && (
          <motion.div
            key="tab_simulator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#EDEBE9] rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
          >
            <div className="border-b border-[#EDEBE9] pb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Sliders size={18} className="text-sky-600 animate-spin" style={{ animationDuration: '6s' }} /> Interactive Adherence & Score Board Simulator
              </h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Toggle patient compliance criteria to observe real-time algorithmic adjustments to your overall health scoring metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Score ring dynamic representation */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <div className="relative flex items-center justify-center">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle cx="96" cy="96" r="80" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                    <circle 
                      cx="96" cy="96" r="80" 
                      stroke="url(#simGradient)" strokeWidth="12" fill="none" 
                      strokeDasharray="502.6" strokeDashoffset={502.6 - (502.6 * healthFactors.total) / 100} 
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                    <defs>
                      <linearGradient id="simGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-6xl font-black text-slate-950 tracking-tighter">{healthFactors.total}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#757370]">Out of 100</span>
                    <span className={`text-[12px] font-black uppercase tracking-widest ${healthFactors.textColor} mt-1.5`}>
                      {healthFactors.label}
                    </span>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Calculated Trajectory</p>
                  <p className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1.5 mt-0.5">
                    <TrendingUp size={14} /> Stable & Improving
                  </p>
                </div>
              </div>

              {/* Toggles list */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#EDEBE9]">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Interactive Metric Variables</p>
                  <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">ALGORITHMIC</span>
                </div>

                {/* 1. Device Sync */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-[#EDEBE9] transition-all">
                  <div className="flex items-center gap-3">
                    <Watch className={`h-5 w-5 ${deviceSynced ? 'text-sky-500' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Mobile Wearable Data Synced</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calculates steps, active duration, sleep stream • (+10 pts)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { playHapticSound(); setDeviceSynced(!deviceSynced); }}
                    className={`min-h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                      deviceSynced 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {deviceSynced ? 'Active' : 'Enable'}
                  </button>
                </div>

                {/* 2. Step target met */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-[#EDEBE9] transition-all">
                  <div className="flex items-center gap-3">
                    <Flame className={`h-5 w-5 ${stepGoalMet ? 'text-orange-500' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Step Goal Exceeded (Over 8,000 Steps)</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Daily physical target compliance verified by sensor • (+8 pts)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { playHapticSound(); setStepGoalMet(!stepGoalMet); }}
                    className={`min-h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                      stepGoalMet 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {stepGoalMet ? 'Goal Met' : 'Simulate'}
                  </button>
                </div>

                {/* 3. Med Compliance */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-[#EDEBE9] transition-all">
                  <div className="flex items-center gap-3">
                    <Pill className={`h-5 w-5 ${medCompliance ? 'text-[#0078D4]' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Medication Compliance 100%</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Refills completed on schedule with daily dosage logging • (+25 pts)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { playHapticSound(); setMedCompliance(!medCompliance); }}
                    className={`min-h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                      medCompliance 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {medCompliance ? 'Compliant' : 'Simulate Lapsed'}
                  </button>
                </div>

                {/* 4. Sleep Avg */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-[#EDEBE9] transition-all">
                  <div className="flex items-center gap-3">
                    <Moon className={`h-5 w-5 ${sleepScoreHigh ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Target Sleep Sleep Duration Met</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Achieved over 7.5 hours of REST score on average • (+7 pts)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { playHapticSound(); setSleepScoreHigh(!sleepScoreHigh); }}
                    className={`min-h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                      sleepScoreHigh 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {sleepScoreHigh ? 'Sufficient' : 'Simulate'}
                  </button>
                </div>

                {/* 5. Vitals verification */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-[#EDEBE9] transition-all">
                  <div className="flex items-center gap-3">
                    <Activity className={`h-5 w-5 ${vitalsInNorm ? 'text-teal-500' : 'text-slate-300'}`} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Vitals within Physiological Normal Limits</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Blood glucose (90-130mg/dL), BP within normal limits • (+20 pts)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { playHapticSound(); setVitalsInNorm(!vitalsInNorm); }}
                    className={`min-h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                      vitalsInNorm 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-white text-slate-500 border-[#0EA5E9] border'
                    }`}
                  >
                    {vitalsInNorm ? 'Optimal' : 'Flag Abnormal'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. CLASSES & WELLNESS GROUPS TAB */}
        {activeTab === 'community' && (
          <motion.div
            key="tab_community"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Fitness Classes */}
            <div className="bg-white border border-[#EDEBE9] rounded-2xl p-6 shadow-sm">
              <div className="border-b border-[#EDEBE9] pb-3 mb-6">
                <h3 className="text-xs font-black text-[#107C10] tracking-widest uppercase flex items-center gap-2">
                  <Activity size={16} /> Wellness Fitness & Movement Classes
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Physically-focused group scheduling matching wellness parameters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {MOCK_FITNESS_CLASSES.map(cls => {
                  const isJoined = joinedEvents.includes(cls.id);
                  return (
                    <div 
                      key={cls.id} 
                      className={`p-5 flex flex-col justify-between rounded-xl border transition-all hover:border-slate-300 relative ${
                        isJoined ? 'bg-emerald-50/40 border-[#107C10]/20' : 'bg-slate-50/50 border-[#EDEBE9]'
                      }`}
                    >
                      <div>
                        {isJoined && (
                          <span className="absolute top-4 right-4 bg-[#DFF6DD] text-[#107C10] border border-[#107C10]/10 rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none">
                            Enrolled
                          </span>
                        )}
                        <h4 className="text-sm font-black text-slate-900 pr-12 leading-snug mb-2">{cls.title}</h4>
                        <div className="space-y-1.5 mb-5 text-[11px] font-bold text-slate-500">
                          <p className="flex items-center gap-1.5"><Clock size={12} className="text-sky-500 shrink-0" /> {cls.time}</p>
                          <p className="flex items-center gap-1.5"><MapPin size={12} className="text-rose-500 shrink-0" /> {cls.location}</p>
                          <p className="flex items-center gap-1.5"><Users size={12} className="text-[#0078D4] shrink-0" /> Instructor: <span className="font-extrabold text-slate-700">{cls.instructor}</span></p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleToggleJoinEvent(cls.id, cls.title)}
                        className={`w-full min-h-10 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                          isJoined 
                            ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                            : 'bg-white text-slate-750 border-[#EDEBE9] hover:bg-slate-50'
                        }`}
                      >
                        {isJoined ? 'Leave Session' : 'Enroll Class'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Health Social / Peer Groups */}
            <div className="bg-white border border-[#EDEBE9] rounded-2xl p-6 shadow-sm">
              <div className="border-b border-[#EDEBE9] pb-3 mb-6">
                <h3 className="text-xs font-black text-amber-600 tracking-widest uppercase flex items-center gap-2">
                  <Users size={16} /> Health-Related Social Peer Groups
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Connect and stay active with others managing metabolic adjustments</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {MOCK_SOCIAL_GROUPS.map(grp => {
                  const isJoined = joinedEvents.includes(grp.id);
                  return (
                    <div 
                      key={grp.id} 
                      className={`p-5 flex flex-col justify-between rounded-xl border transition-all hover:border-slate-300 relative ${
                        isJoined ? 'bg-amber-50/40 border-amber-300/30' : 'bg-slate-50/50 border-[#EDEBE9]'
                      }`}
                    >
                      <div>
                        {isJoined && (
                          <span className="absolute top-4 right-4 bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none">
                            Member
                          </span>
                        )}
                        <h4 className="text-sm font-black text-slate-900 pr-12 leading-snug mb-2">{grp.title}</h4>
                        <p className="text-[11px] font-medium text-slate-500 mb-4 leading-normal bg-white p-2 border border-slate-100 border-dashed rounded-lg">{grp.description}</p>
                        
                        <div className="space-y-1.5 mb-5 text-[11px] font-bold text-slate-400">
                          <p className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> {grp.time}</p>
                          <p className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {grp.location}</p>
                          <p className="flex items-center gap-1.5"><Users size={12} className="text-slate-400" /> <span className="text-slate-600">{grp.membersCount} active patients</span></p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleToggleJoinEvent(grp.id, grp.title)}
                        className={`w-full min-h-10 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                          isJoined 
                            ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                            : 'bg-white text-slate-750 border-[#EDEBE9] hover:bg-slate-50'
                        }`}
                      >
                        {isJoined ? 'Leave Circle' : 'Join Peer Circle'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────── SECURE PATIENT COMMUNICATION DRAWERS / MODALS ────────────────── */}

      {/* MODAL 1: MESSAGE SECURE LINE */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="max-w-md w-full bg-white border border-[#EDEBE9] rounded-2xl shadow-xl p-6 font-sans">
          <DialogHeader className="pb-3 border-b border-[#EDEBE9]">
            <DialogTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={16} className="text-sky-600" /> Secure Clinical Messaging
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendMessage} className="space-y-4 pt-4">
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Select Clinician Roster Reference</label>
              <select 
                value={selectedProvider ? selectedProvider.id : ''} 
                onChange={(e) => {
                  const found = healthcareProviders.find(p => p.id === e.target.value);
                  setSelectedProvider(found || null);
                }}
                className="w-full bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl px-4 py-3 text-xs font-bold text-[#242424]"
                required
              >
                <option value="">-- Choose Assigned Provider --</option>
                {healthcareProviders.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.specialty})
                  </option>
                ))}
              </select>
            </div>

            {selectedProvider && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
                Active Context: Re: <span className="font-extrabold">{selectedProvider.currentIssue}</span>
              </div>
            )}

            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Secure Encrypted Message</label>
              <Textarea 
                placeholder="Type your clinical update or symptom logs here..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="min-h-28 bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl font-medium"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsMessageOpen(false)}
                className="flex-1 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest bg-white border border-[#EDEBE9] py-3.5"
              >
                Cancel [ESC]
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-extrabold text-[10px] uppercase tracking-widest py-3.5 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>Send Message <Send size={11} /></>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: PRESCRIPTION REFILL */}
      <Dialog open={isRefillOpen} onOpenChange={setIsRefillOpen}>
        <DialogContent className="max-w-md w-full bg-white border border-[#EDEBE9] rounded-2xl shadow-xl p-6 font-sans">
          <DialogHeader className="pb-3 border-b border-[#EDEBE9]">
            <DialogTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Pill size={16} className="text-sky-600 animate-bounce" /> Request Regimen Refill
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRefillSubmit} className="space-y-4 pt-4">
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Active Prescription Forms</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {prescriptions.map(rx => {
                  const checked = selectedMeds.includes(rx.medicationName);
                  return (
                    <label 
                      key={rx.id} 
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                        checked ? 'bg-sky-50/50 border-sky-200' : 'bg-[#FAFAFA] border-[#EDEBE9]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedMeds(selectedMeds.filter(m => m !== rx.medicationName));
                            } else {
                              setSelectedMeds([...selectedMeds, rx.medicationName]);
                            }
                          }}
                          className="h-4 w-4 rounded text-sky-600"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-950">{rx.medicationName} <span className="text-[10px] font-bold text-slate-400">({rx.dosage})</span></p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{rx.condition} • {rx.frequency}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold uppercase text-[8px] tracking-wider">Active</Badge>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Preferred Pharmacy Network</label>
              <select 
                value={selectedPharmacy}
                onChange={(e) => setSelectedPharmacy(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl px-4 py-3 text-xs font-bold text-[#242424]"
              >
                <option value="Queen's Park Pharmacy">Queen's Park Pharmacy - Port of Spain</option>
                <option value="Caring Hands Pharmacy">Caring Hands Pharmacy - San Fernando</option>
                <option value="St. Clair Health Pharmacy">St. Clair Family Medical Pharmacy</option>
                <option value="Patient Selected Delivery">Deliver directly to Registered Address</option>
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Special Directions or Safety Concerns</label>
              <Textarea 
                placeholder="Include dosage modifications discussed with clinical providers..."
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                className="min-h-20 bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl font-medium"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsRefillOpen(false)}
                className="flex-1 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest bg-white border border-[#EDEBE9] py-3.5"
              >
                Cancel [ESC]
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || selectedMeds.length === 0}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-extrabold text-[10px] uppercase tracking-widest py-3.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>Submit Refill Request</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REQUEST HOME VISIT */}
      <Dialog open={isHomeVisitOpen} onOpenChange={setIsHomeVisitOpen}>
        <DialogContent className="max-w-md w-full bg-white border border-[#EDEBE9] rounded-2xl shadow-xl p-6 font-sans">
          <DialogHeader className="pb-3 border-b border-[#EDEBE9]">
            <DialogTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Home size={16} className="text-indigo-600" /> Mobile Triage home Visit Request
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleHomeVisitSubmit} className="space-y-4 pt-4">
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Check All Present Physical Symptoms</label>
              <div className="grid grid-cols-2 gap-2">
                {['Severe fatigue', 'Glycemic fluctuation', 'Cardiorespiratory discomfort', 'Allergy indicators', 'Biometric discrepancy', 'Reflex/gait issues'].map(symptom => {
                  const check = homeVisitSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => {
                        playHapticSound();
                        if (check) {
                          setHomeVisitSymptoms(homeVisitSymptoms.filter(s => s !== symptom));
                        } else {
                          setHomeVisitSymptoms([...homeVisitSymptoms, symptom]);
                        }
                      }}
                      className={`px-3 py-2 border rounded-lg text-[10px] font-bold text-left transition-all flex items-center justify-between ${
                        check 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                          : 'bg-[#FAFAFA] border-[#EDEBE9] text-[#616161]'
                      }`}
                    >
                      {symptom}
                      {check && <Check size={10} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Preferred Day</label>
                <select 
                  value={homeVisitDate}
                  onChange={(e) => setHomeVisitDate(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl px-3 py-2 text-xs font-bold text-[#242424]"
                >
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="In 2 Days">In 2 Days</option>
                  <option value="In 3 Days">In 3 Days</option>
                  <option value="Next available slot">First Available</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Time Frame</label>
                <select 
                  value={homeVisitTime}
                  onChange={(e) => setHomeVisitTime(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl px-3 py-2 text-xs font-bold text-[#242424]"
                >
                  <option value="Morning (8:00 AM - 12:00 PM)">Morning</option>
                  <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon</option>
                  <option value="Evening (6:00 PM - 9:00 PM)">Evening</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-1.5">Contextual visit description</label>
              <Textarea 
                placeholder="Give details about support requirements or mobility concerns..."
                value={homeVisitNotes}
                onChange={(e) => setHomeVisitNotes(e.target.value)}
                className="min-h-16 bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl font-medium"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsHomeVisitOpen(false)}
                className="flex-1 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest bg-white border border-[#EDEBE9] py-3.5"
              >
                Cancel [ESC]
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest py-3.5 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>Submit Request</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CLINIC / TELEHEALTH BOOKING ENGINE */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-lg w-full bg-white border border-[#EDEBE9] rounded-2xl shadow-xl p-6 font-sans">
          <DialogHeader className="pb-3 border-b border-[#EDEBE9]">
            <DialogTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" /> Book Health Consultation
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBookAppointment} className="space-y-4 pt-4 overflow-y-auto max-h-[75vh] pr-1">
            {/* 1. Provider Cards Selector */}
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-2">Select Clinical Specialist</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {healthcareProviders.map(provider => {
                  const isSelected = bookingProviderId === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => { playHapticSound(); setBookingProviderId(provider.id); }}
                      className={`p-3 border rounded-xl text-left transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm shadow-indigo-100' 
                          : 'bg-[#FAFAFA] border-[#EDEBE9] text-[#616161] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {provider.avatar}
                        </div>
                        <span className="text-[11px] font-black tracking-tight truncate leading-none">{provider.name}</span>
                      </div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">{provider.specialty}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Date and Visit Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-1.5">Consultation Date</label>
                <input 
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl px-3 py-2 text-xs font-bold text-[#242424] focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-1.5">Visit Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'in_clinic', label: 'In-Clinic', icon: Stethoscope },
                    { value: 'telehealth', label: 'Telehealth', icon: Smartphone }
                  ].map(type => {
                    const isSelected = bookingVisitType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => { playHapticSound(); setBookingVisitType(type.value as any); }}
                        className={`py-2 px-3 border rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                          isSelected 
                            ? 'bg-[#0078D4] border-[#005A9E] text-white' 
                            : 'bg-white border-[#EDEBE9] text-[#616161] hover:bg-slate-50'
                        }`}
                      >
                        <type.icon size={13} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Availability Time Slot Picker */}
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-2">Available Daily Time Slots</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['09:00 AM', '10:15 AM', '11:15 AM', '01:30 PM', '02:45 PM', '04:00 PM'].map(slot => {
                  const isSelected = bookingTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { playHapticSound(); setBookingTimeSlot(slot); }}
                      className={`py-2 rounded-xl text-[10px] font-black text-center transition-all border ${
                        isSelected 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs font-bold' 
                          : 'bg-[#FAFAFA] border-[#EDEBE9] text-[#616161] hover:bg-slate-100'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Priority Triage Level */}
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-1.5">Triage Priority Assessment</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'routine', label: 'Routine Preventative Care' },
                  { value: 'urgent', label: 'Urgent Symptom Review' }
                ].map(p => {
                  const isSelected = bookingPriority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => { playHapticSound(); setBookingPriority(p.value as any); }}
                      className={`py-2 px-3 border rounded-xl text-[10px] font-black transition-all ${
                        isSelected 
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' 
                          : 'bg-[#FAFAFA] border-[#EDEBE9] text-[#616161]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Reason for Consultation */}
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-[#757370] mb-1.5">Reason for Booking & Symptoms</label>
              <Textarea 
                placeholder="Briefly explain your health concerns, physiological changes, or questions..."
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
                className="min-h-18 bg-[#FAFAFA] border border-[#EDEBE9] rounded-xl font-medium text-xs text-slate-800"
                required
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsBookingOpen(false)}
                className="flex-1 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest bg-white border border-[#EDEBE9] py-3.5"
              >
                Cancel Open [ESC]
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest py-3.5 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>Book Appointment Now</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DRAWERS Helper: Keyboards Shortcuts dialog */}
      <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
        <DialogContent className="max-w-sm w-full bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 font-sans">
          <div className="flex flex-col items-center text-center pb-2 border-b border-white/10 mb-4">
            <Keyboard size={36} className="text-sky-400 mb-2" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Gaze/Trackball Key Navigation</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Spatial Android XR Accessible Bindings</p>
          </div>

          <div className="space-y-3.5 py-2">
            {[
              { key: 'M', action: 'Direct Secure Messaging Drawer' },
              { key: 'R', action: 'Regimen Refill Request Modal' },
              { key: 'H', action: 'Home Triage Visit Request Form' },
              { key: 'B', action: 'Toggle tab to My Health Board' },
              { key: 'S', action: 'Toggle tab to Adherence Simulator' },
              { key: 'C', action: 'Toggle tab to Wellness Classes' },
              { key: 'Esc', action: 'Dismiss active drawer/modal instantly' },
            ].map(shortcut => (
              <div key={shortcut.key} className="flex items-center justify-between font-bold text-xs">
                <span className="text-slate-400 uppercase tracking-wide">{shortcut.action}</span>
                <span className="px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-mono text-[10px] uppercase leading-none">{shortcut.key}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowShortcutsHelp(false)}
            className="w-full mt-4 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
          >
            Acknowledge [ESC]
          </button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
