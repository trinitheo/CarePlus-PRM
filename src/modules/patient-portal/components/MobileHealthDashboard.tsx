import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Pill, 
  Calendar, 
  ChevronUp, 
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  Bell,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface MobileHealthDashboardProps {
  patientData?: any;
  appointments?: any[];
  onOpenMedicationCompliance?: () => void;
  onOpenConsultationNotes?: () => void;
  onNavigatePage?: (page: number) => void;
}

export function MobileHealthDashboard({
  patientData,
  appointments = [],
  onOpenMedicationCompliance,
  onOpenConsultationNotes,
  onNavigatePage
}: MobileHealthDashboardProps) {
  const [isMedExpanded, setIsMedExpanded] = useState(false);

  // Derive patient's display name
  const patientFirstName = useMemo(() => {
    if (patientData?.personal_contacts?.first_name) {
      return patientData.personal_contacts.first_name;
    }
    if (patientData?.name) {
      return patientData.name.split(' ')[0];
    }
    return "Theodore";
  }, [patientData]);

  // Find upcoming appointment
  const upcomingAppointment = useMemo(() => {
    if (appointments && appointments.length > 0) {
      return appointments[0];
    }
    return {
      providerName: "Dr. Theodore",
      specialty: "Primary Care & Metabolic Wellness",
      date: "2026-06-28",
      time: "10:30 AM",
      location: "Room 4B, CarePlus Wellness Center"
    };
  }, [appointments]);

  // Get recent clinical notes or default preview
  const recentNote = useMemo(() => {
    if (patientData?.clinical_records && patientData.clinical_records.length > 0) {
      return patientData.clinical_records[0];
    }
    return {
      date: "2026-06-14",
      author: "Dr. Theodore",
      content: "Continue Metformin 500mg, track daily blood pressure after morning exercise."
    };
  }, [patientData]);

  return (
    <div 
      id="adaptive-health-dashboard-wrapper" 
      className="bg-[#FAFCFB] text-slate-800 p-2 md:p-4 font-sans w-full max-w-7xl mx-auto relative overflow-hidden"
    >
      {/* 1. Hero Heading - Beautiful Typography */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 relative z-10"
      >
        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#3F5B42]/80 font-mono">Personalized Wellness</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-slate-900 leading-tight mt-1">
          Welcome, <span className="font-semibold text-[#3F5B42] block md:inline">{patientFirstName}</span>
        </h1>
      </motion.div>

      {/* Responsive Grid Container: 1 column on mobile, 2 columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Vitality Index & Medication Compliance */}
        <div className="space-y-6">
          
          {/* 2. CARD 1: Vitality Index & Goals (Bento Grid Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onNavigatePage?.(2)} // Navigate to Vitals page
          >
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="h-4 w-4 text-[#3F5B42]/50" />
            </div>
            
            <span className="text-[10px] font-black uppercase tracking-widest text-[#3F5B42] block mb-4 font-mono">
              1. Daily Vitality Index
            </span>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Health Score Circular Indicator */}
              <div className="md:col-span-5 flex flex-col items-center justify-center md:border-r border-slate-100 md:pr-4">
                <div className="relative flex items-center justify-center h-24 w-24">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="7"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="stroke-[#3F5B42] fill-none"
                      strokeWidth="7"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - 0.78)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800 tracking-tighter">78</span>
                    <span className="text-[8.5px] font-black text-[#3F5B42] tracking-widest -mt-1">SCORE</span>
                  </div>
                </div>
                <span className="text-[9.5px] text-[#3F5B42] font-bold mt-3 bg-[#EEF3F0] px-3 py-1 rounded-full border border-emerald-950/5">
                  Optimal Level
                </span>
              </div>

              {/* Right Column: Mini Goals Progression */}
              <div className="md:col-span-7 space-y-3.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block font-mono">
                  Target Progressions
                </span>

                {/* Goal 1: Steps */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      👣 <span className="font-sans">Walking Target</span>
                    </span>
                    <span className="font-bold text-[#3F5B42] font-mono text-[9.5px]">93%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3F5B42] rounded-full" style={{ width: '93%' }} />
                  </div>
                </div>

                {/* Goal 2: Diet */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      🥗 <span className="font-sans">Glycemic Diet</span>
                    </span>
                    <span className="font-bold text-[#3F5B42] font-mono text-[9.5px]">100%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3F5B42] rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Goal 3: Rx Compliance */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      💊 <span className="font-sans">Metformin Habit</span>
                    </span>
                    <span className="font-bold text-amber-600 font-mono text-[9.5px]">Due Soon</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* 3. CARD 4: Medication Compliance (Purple Accented, Expandable widget) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white border border-slate-200/80 border-l-4 border-l-purple-500 rounded-3xl p-5 shadow-xs relative overflow-hidden"
          >
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsMedExpanded(!isMedExpanded)}
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <Pill className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">4. Medication Compliance</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block font-mono">
                    Click to Expand Calendar
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-black text-purple-600 block font-mono">80%</span>
                  <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wide">Weekly</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                  {isMedExpanded ? (
                    <ChevronUp className="h-4.5 w-4.5" />
                  ) : (
                    <ChevronDown className="h-4.5 w-4.5" />
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Adherence Tracker Calendar Grid */}
            <AnimatePresence>
              {isMedExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 mt-4 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {[
                        { day: 'M', checked: true, text: "Monday — Metformin logged" },
                        { day: 'T', checked: true, text: "Tuesday — Metformin logged" },
                        { day: 'W', checked: false, text: "Wednesday — Missed Metformin due to side effect barrier" },
                        { day: 'T', checked: true, text: "Thursday — Metformin logged" },
                        { day: 'F', checked: true, text: "Friday — Metformin logged" },
                        { day: 'S', checked: false, text: "Saturday — Missed post-meal activity habit cue" },
                        { day: 'S', checked: true, text: "Sunday — Metformin logged" },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 block font-mono">{item.day}</span>
                          <div 
                            title={item.text}
                            className={`aspect-square rounded-xl flex items-center justify-center text-[10.5px] font-black transition-all ${
                              item.checked 
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                                : 'bg-rose-50 border border-rose-200 text-rose-800 shadow-inner'
                            }`}
                          >
                            {item.checked ? "✓" : "❌"}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-150">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-slate-700">5 / 7 Days Compliant</span>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenMedicationCompliance}
                        className="text-[#3F5B42] hover:text-[#2E4230] font-black uppercase tracking-wider text-[9px] flex items-center gap-0.5 focus:outline-none cursor-pointer"
                      >
                        Update Tracker
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Upcoming Consultation & Consultation Notes */}
        <div className="space-y-6">

          {/* 4. CARD 2: Upcoming Session (Amber Accented, High-contrast, Deep-rounded) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white border border-slate-200/80 border-l-4 border-l-amber-500 rounded-3xl p-6 shadow-xs relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-amber-50 text-amber-800 text-[8.5px] font-black uppercase tracking-widest px-3 py-2 rounded-bl-xl border-l border-b border-slate-100">
              Confirmed
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2 mb-4 font-mono">
              <Calendar className="h-4 w-4 text-amber-500" />
              2. Upcoming Consultation
            </span>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-xl">🩺</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 leading-tight">{upcomingAppointment.providerName || "Dr. Sarah Mitchell"}</h4>
                  <p className="text-[10.5px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">
                    {upcomingAppointment.specialty}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Date & Time</span>
                  <span className="text-xs md:text-sm font-mono font-medium text-slate-700 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    {upcomingAppointment.time}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Room Location</span>
                  <span className="text-xs md:text-sm font-bold text-slate-700 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60 truncate" title={upcomingAppointment.location}>
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    {upcomingAppointment.location?.split(',')[0] || "Room 4B"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 5. CARD 3: My Consultation Notes (Blue Accented, Compact clickable) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <button
              type="button"
              id="consultation-notes-button"
              onClick={onOpenConsultationNotes}
              className="w-full text-left bg-white border border-slate-200/80 border-l-4 border-l-sky-500 rounded-3xl p-5 shadow-xs hover:bg-slate-50/50 active:scale-[0.99] transition-all flex items-center justify-between gap-4 relative overflow-hidden"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-sky-600" />
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-800 block">3. Consultation Notes</span>
                    <span className="text-[8.5px] font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 shrink-0 font-mono">
                      {recentNote.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-1.5">
                    {recentNote.content}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
            </button>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
