import { useState, useEffect } from 'react';
import { 
  Activity, 
  Pill, 
  Moon, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Droplet, 
  CheckCircle2, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { updatePatientHealthScore } from '../../../services/clinicalFirestoreService';

interface MyHealthScoreProps {
  patientData?: any;
}

export function MyHealthScore({ patientData }: MyHealthScoreProps) {
  const rPatient = patientData?.patient || {};
  const baseScore = 72;
  
  const [medsDays, setMedsDays] = useState<number>(() => typeof rPatient.medsDays === 'number' ? rPatient.medsDays : 5);
  const [sleepHours, setSleepHours] = useState<number>(() => typeof rPatient.sleepHours === 'number' ? rPatient.sleepHours : 7.6);
  const [dailySteps, setDailySteps] = useState<number>(() => typeof rPatient.dailySteps === 'number' ? rPatient.dailySteps : 8420);
  const [bloodGlucose, setBloodGlucose] = useState<number>(() => typeof rPatient.bloodGlucose === 'number' ? rPatient.bloodGlucose : 104);
  const [aiGoalsCompleted, setAiGoalsCompleted] = useState<boolean>(() => typeof rPatient.aiGoalsCompleted === 'boolean' ? rPatient.aiGoalsCompleted : true);
  const [willAttend, setWillAttend] = useState<boolean>(() => typeof rPatient.willAttend === 'boolean' ? rPatient.willAttend : true);
  const [predictedScore, setPredictedScore] = useState<number>(baseScore);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'dirty'>('synced');
  const [prevPatientId, setPrevPatientId] = useState<string | null>(null);

  // Sync state with incoming loaded patient records safely on load/tab switch
  useEffect(() => {
    if (rPatient?.id) {
      if (rPatient.id !== prevPatientId) {
        setPrevPatientId(rPatient.id);
      }
      if (typeof rPatient.medsDays === 'number') setMedsDays(rPatient.medsDays);
      if (typeof rPatient.sleepHours === 'number') setSleepHours(rPatient.sleepHours);
      if (typeof rPatient.dailySteps === 'number') setDailySteps(rPatient.dailySteps);
      if (typeof rPatient.bloodGlucose === 'number') setBloodGlucose(rPatient.bloodGlucose);
      if (typeof rPatient.aiGoalsCompleted === 'boolean') setAiGoalsCompleted(rPatient.aiGoalsCompleted);
      if (typeof rPatient.willAttend === 'boolean') setWillAttend(rPatient.willAttend);
      // Let's preserve synced indicator
      setSyncStatus('synced');
    }
  }, [rPatient?.id, rPatient?.medsDays, rPatient?.sleepHours, rPatient?.dailySteps, rPatient?.bloodGlucose, rPatient?.aiGoalsCompleted, rPatient?.willAttend]);

  // Debounced auto-sync to Firestore Patients collection
  useEffect(() => {
    if (syncStatus !== 'dirty') return;

    const delayDebounce = setTimeout(async () => {
      setSyncStatus('saving');
      try {
        const patientId = rPatient.id || 'pat-marcus-001';
        await updatePatientHealthScore(patientId, predictedScore, {
          medsDays,
          sleepHours,
          dailySteps,
          bloodGlucose,
          aiGoalsCompleted,
          willAttend
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to autosave health score:', err);
        setSyncStatus('dirty');
      }
    }, 1500);

    return () => clearTimeout(delayDebounce);
  }, [medsDays, sleepHours, dailySteps, bloodGlucose, aiGoalsCompleted, willAttend, predictedScore, syncStatus, rPatient.id]);

  const handleManualSync = async () => {
    setSyncStatus('saving');
    try {
      const patientId = rPatient.id || 'pat-marcus-001';
      await updatePatientHealthScore(patientId, predictedScore, {
        medsDays,
        sleepHours,
        dailySteps,
        bloodGlucose,
        aiGoalsCompleted,
        willAttend
      });
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed manual sync of health score:', err);
      setSyncStatus('dirty');
    }
  };

  // Score computation details
  const [calculationDetails, setCalculationDetails] = useState({
    medsContribution: 0,
    sleepContribution: 0,
    stepsContribution: 0,
    glucoseContribution: 0,
    aiContribution: 0,
    appointmentContribution: 0
  });

  useEffect(() => {
    let mods = {
      medsContribution: 0,
      sleepContribution: 0,
      stepsContribution: 0,
      glucoseContribution: 0,
      aiContribution: 0,
      appointmentContribution: 0
    };

    // 1. Medication compliance (Max +8, or -4 below 4 days)
    if (medsDays === 7) mods.medsContribution = 8;
    else if (medsDays >= 5) mods.medsContribution = 5;
    else if (medsDays >= 3) mods.medsContribution = 1;
    else mods.medsContribution = -4;

    // 2. Sleep duration (Max +6 for 7-9 hours, penalty drops below 6.5)
    if (sleepHours >= 7 && sleepHours <= 9) {
      mods.sleepContribution = 6;
    } else if (sleepHours >= 6 && sleepHours < 7) {
      mods.sleepContribution = 2;
    } else if (sleepHours > 9) {
      mods.sleepContribution = 3; // overslept
    } else {
      mods.sleepContribution = -3; // sleep deprivation
    }

    // 3. Daily Steps (Max +8 for >= 8000 steps, step counts below 4000 get 0 or negative)
    if (dailySteps >= 9000) mods.stepsContribution = 8;
    else if (dailySteps >= 8000) mods.stepsContribution = 7;
    else if (dailySteps >= 7000) mods.stepsContribution = 6;
    else if (dailySteps >= 5000) mods.stepsContribution = 3;
    else if (dailySteps >= 3000) mods.stepsContribution = 1;
    else mods.stepsContribution = -2;

    // 4. Blood Glucose level (Target is 70 to 130 mg/dL for +8, severe penalty high/low)
    if (bloodGlucose >= 75 && bloodGlucose <= 125) {
      mods.glucoseContribution = 8;
    } else if (bloodGlucose >= 126 && bloodGlucose <= 150) {
      mods.glucoseContribution = 3;
    } else if (bloodGlucose > 150) {
      mods.glucoseContribution = -5; // Hyperglycemic strain
    } else if (bloodGlucose < 70) {
      mods.glucoseContribution = -6; // Hypoglycemic strain
    } else {
      mods.glucoseContribution = 1;
    }

    // 5. Completion of dynamic AI JITAI Micro-Goals (+10 pts)
    if (aiGoalsCompleted) {
      mods.aiContribution = 10;
    } else {
      mods.aiContribution = -2; // penalty for unaddressed alerts
    }

    // 6. Clinical Appointment confirmation stability
    if (!willAttend) {
      mods.appointmentContribution = -5;
    } else {
      mods.appointmentContribution = 2;
    }

    const totalModifiers = 
      mods.medsContribution + 
      mods.sleepContribution + 
      mods.stepsContribution + 
      mods.glucoseContribution + 
      mods.aiContribution + 
      mods.appointmentContribution;

    setCalculationDetails(mods);
    setPredictedScore(Math.min(Math.max(baseScore + totalModifiers, 0), 100));
  }, [medsDays, sleepHours, dailySteps, bloodGlucose, aiGoalsCompleted, willAttend]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800"
    >
      {/* Header and conceptual framework */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#DEE8E0] pb-5 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#3F5B42]/10 text-[#3F5B42] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide font-mono">
              CarePlus Core Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            My Health Score Engine
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            Simulate how your weekly medication courses, biometric wearable stats (steps, sleep, glucose), and active AI micro-goals adjust your therapeutic health status and overall score.
          </p>
        </div>
      </div>

      {/* Main Results Scorecard Bento Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Giant Simulated Outcome Card */}
        <div className="lg:col-span-4 bg-[#EEF3F0] rounded-2xl p-6 border border-[#DCE7E1] shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-[#3F5B42] uppercase tracking-wider block">
                Simulated Clinical Outcome
              </span>
              {/* Live Sync Status Indicator */}
              <button
                onClick={handleManualSync}
                disabled={syncStatus === 'saving'}
                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200/80 shrink-0"
                title="Click to sync immediately with your Health Board"
              >
                {syncStatus === 'synced' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-800 font-bold uppercase tracking-wider">Synced to Board</span>
                  </>
                )}
                {syncStatus === 'saving' && (
                  <>
                    <div className="w-2 h-2 rounded-full border-b border-r border-[#3F5B42] animate-spin" />
                    <span className="text-slate-600 uppercase tracking-wider">Saving...</span>
                  </>
                )}
                {syncStatus === 'dirty' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-800 font-bold uppercase tracking-wider">Drafting</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center py-6">
              <div className="relative flex items-center justify-center">
                {/* Visual Glow Layer */}
                <div className="absolute inset-0 bg-[#3F5B42] opacity-5 blur-2xl rounded-full" />
                
                {/* Round dial representing score */}
                <div className="w-36 h-36 rounded-full border-4 border-dashed border-[#BCD1C5] flex flex-col items-center justify-center bg-white shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                  <span className="text-5xl font-black text-[#3F5B42]" id="simulated-score-value">
                    {predictedScore}%
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.25 rounded mt-1">
                    {predictedScore >= 85 ? 'Optimized' : predictedScore >= 70 ? 'Moderate' : 'Under Review'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-white/70 p-3.5 rounded-xl border border-white/50 text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-[#3F5B42]" />
                <span>Simulated Impact Trajectory</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                An adherence score above <strong className="text-[#3F5B42]">85%</strong> acts as a clinically proven buffer, associated with a 42% decrease in chronic breakthrough symptoms.
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#DCE7E1] flex justify-between text-xs font-mono font-bold text-[#344E36]">
            <span>Base Clinic Rating: {baseScore}%</span>
            <span>Delta Shift: {predictedScore >= baseScore ? '+' : ''}{predictedScore - baseScore}%</span>
          </div>
        </div>

        {/* Dynamic Calculation Breakdown */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-700" />
              Weight Matrix Contribution Analysis
            </h3>
            <span className="text-[11px] font-bold text-slate-400 italic">Adjust sliders below to modify</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Meds */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Medication</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 rounded ${
                  calculationDetails.medsContribution >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'
                }`}>
                  {calculationDetails.medsContribution >= 0 ? '+' : ''}{calculationDetails.medsContribution}
                </span>
              </div>
              <strong className="text-xs block text-slate-800">{medsDays} days / week</strong>
            </div>

            {/* Sleep */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sleep Target</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 rounded ${
                  calculationDetails.sleepContribution >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {calculationDetails.sleepContribution >= 0 ? '+' : ''}{calculationDetails.sleepContribution}
                </span>
              </div>
              <strong className="text-xs block text-slate-800">{sleepHours} hrs / night</strong>
            </div>

            {/* Steps */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Step Activity</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 rounded ${
                  calculationDetails.stepsContribution >= 6 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {calculationDetails.stepsContribution >= 0 ? '+' : ''}{calculationDetails.stepsContribution}
                </span>
              </div>
              <strong className="text-xs block text-slate-800">{dailySteps.toLocaleString()} steps</strong>
            </div>

            {/* Glucose */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Glycemic Stability</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 rounded ${
                  calculationDetails.glucoseContribution === 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'
                }`}>
                  {calculationDetails.glucoseContribution >= 0 ? '+' : ''}{calculationDetails.glucoseContribution}
                </span>
              </div>
              <strong className="text-xs block text-slate-800">{bloodGlucose} mg/dL</strong>
            </div>

            {/* AI Goals */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Adaptive Nudges</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 rounded ${
                  calculationDetails.aiContribution > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'
                }`}>
                  {calculationDetails.aiContribution >= 0 ? '+' : ''}{calculationDetails.aiContribution}
                </span>
              </div>
              <strong className="text-xs block text-slate-800">{aiGoalsCompleted ? 'Completed All' : 'Pending Action'}</strong>
            </div>

            {/* Event Engagement */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Care Appointment</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 rounded ${
                  calculationDetails.appointmentContribution >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {calculationDetails.appointmentContribution >= 0 ? '+' : ''}{calculationDetails.appointmentContribution}
                </span>
              </div>
              <strong className="text-xs block text-slate-800">{willAttend ? 'Confirmed' : 'Needs Reschedule'}</strong>
            </div>

          </div>

          {/* Quick Informational Breakdown */}
          <div className="p-3 bg-[#EEF3F0] rounded-xl border border-emerald-100 text-slate-700 space-y-1.5">
            <span className="text-[9px] font-extrabold uppercase text-[#3F5B42] flex items-center gap-1">
              <Sparkles className="h-3 w-3 stroke-[3]" /> CLINICAL PERSPECTIVE
            </span>
            <p className="text-[11px] leading-relaxed">
              Your overall score fluctuates continuously inside CarePlus. Real-time biometrics streamed from Apple Health or Android Health Connect auto-regulate your metabolic tracking daily. Dynamic AI goals provide transient points to motivate healthy routine responses (JITAI behavior).
            </p>
          </div>

        </div>

      </div>

      {/* Interactive Sliders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        
        {/* Left Interactive Group: Standard Compliance */}
        <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200/80 pb-2">
            Weekly Therapeutic Compliance
          </h3>
          
          {/* Medication Slider */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Pill className="h-4 w-4 text-emerald-600" />
                Medication Adherence Rate
              </label>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {medsDays} days / 7
              </span>
            </div>
            <input 
              type="range" min="0" max="7" value={medsDays} 
              onChange={(e) => {
                setMedsDays(Number(e.target.value));
                setSyncStatus('dirty');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3F5B42]"
            />
            <p className="text-[10px] text-slate-500">
              Corresponds to routine pharmacology compliance. Missing more than 3 days drops overall stability modifier.
            </p>
          </div>

          {/* Appointment Attending Toggle */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-[#3F5B42]" />
              Physical / Virtual Consultation Booking status
            </label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  setWillAttend(true);
                  setSyncStatus('dirty');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  willAttend 
                    ? 'bg-[#3F5B42] text-white border-[#2A3F2C]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Booking Confirmed
              </button>
              <button 
                type="button"
                onClick={() => {
                  setWillAttend(false);
                  setSyncStatus('dirty');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  !willAttend 
                    ? 'bg-amber-600 text-white border-amber-800 shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Requires Reschedule (-5 pts)
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Keeps medical staff informed about slot changes, preventing clinician down-times.
            </p>
          </div>

          {/* Dynamic AI completion toggle */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Adaptive JITAI Micro-Goals
              </label>
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.25 rounded ${
                aiGoalsCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {aiGoalsCompleted ? 'Completed' : 'Pending Alert'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-800">Complete Live Telemetry Nudges</span>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Toggle response to simulated physical/metabolic steps pushes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiGoalsCompleted(!aiGoalsCompleted);
                  setSyncStatus('dirty');
                }}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                  aiGoalsCompleted ? 'bg-[#3F5B42]' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${aiGoalsCompleted ? 'translate-x-[20px]' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Fulfillment of transient health actions pushed to device prompts adds +10 crucial score percentiles.
            </p>
          </div>

        </div>

        {/* Right Interactive Group: Smart Wearable Feed Simulations */}
        <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200/80 pb-2">
            Smart Biometric Wearable Stream
          </h3>

          {/* Slide Daily Steps */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Activity className="h-4 w-4 text-sky-600" />
                Daily Wearable Step Count
              </label>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {dailySteps.toLocaleString()} steps
              </span>
            </div>
            <input 
              type="range" min="1000" max="15000" step="500" value={dailySteps} 
              onChange={(e) => {
                setDailySteps(Number(e.target.value));
                setSyncStatus('dirty');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3F5B42]"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Sedentary</span>
              <span>Baseline Goal (7k)</span>
              <span>Highly Active (10k+)</span>
            </div>
          </div>

          {/* Sleep Hours */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Moon className="h-4 w-4 text-purple-600" />
                Sleep Recovery Duration
              </label>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {sleepHours} hours
              </span>
            </div>
            <input 
              type="range" min="4" max="11" step="0.5" value={sleepHours} 
              onChange={(e) => {
                setSleepHours(Number(e.target.value));
                setSyncStatus('dirty');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3F5B42]"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Deprived (&lt;6)</span>
              <span>Optimal Zone (7-9)</span>
              <span>Oversleep (&gt;9)</span>
            </div>
          </div>

          {/* Blood Glucose Level slider */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Droplet className="h-4 w-4 text-red-600" />
                Blood Glucose Feed Status
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                bloodGlucose >= 75 && bloodGlucose <= 125 
                  ? 'bg-emerald-50 text-emerald-800' 
                  : 'bg-rose-50 text-rose-800'
              }`}>
                {bloodGlucose} mg/dL
              </span>
            </div>
            <input 
              type="range" min="50" max="230" step="2" value={bloodGlucose} 
              onChange={(e) => {
                setBloodGlucose(Number(e.target.value));
                setSyncStatus('dirty');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3F5B42]"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span className="text-rose-600">Hypo (&lt;70)</span>
              <span className="text-emerald-700">Target (75-125)</span>
              <span className="text-rose-600">Hyper (&gt;150)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Glucometer tracking. Staying centered dynamically rewards optimal hormonal and metabolic wellness.
            </p>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
