import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Heart,
  Activity,
  Pill,
  Calendar,
  TrendingUp,
  Droplet,
  Gauge,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

interface MobileHealthDashboardProps {
  patientData?: {
    patient?: any;
    vitals?: any[];
    prescriptions?: any[];
  };
  appointments?: any[];
  onOpenMedicationCompliance?: () => void;
  onOpenConsultationNotes?: () => void;
}

export function MobileHealthDashboard({
  patientData = {},
  appointments = [],
  onOpenMedicationCompliance,
  onOpenConsultationNotes,
}: MobileHealthDashboardProps) {
  const [medicationComplianceExpanded, setMedicationComplianceExpanded] = useState(false);

  // Parse patient data
  const rawPatient = patientData?.patient;
  const patient = useMemo(() => {
    if (!rawPatient || (!rawPatient.name && !rawPatient.id)) {
      return {
        name: 'Marcus Everett',
        healthScore: 78,
        id: 'pat-marcus-001',
      };
    }
    return {
      ...rawPatient,
      name: rawPatient.name || 'Patient',
      healthScore: rawPatient.healthScore || 78,
    };
  }, [rawPatient]);

  // Extract vitals
  const vitals = patientData?.vitals || [];
  const latestVitalRecord = useMemo(() => {
    if (!vitals || vitals.length === 0) return null;
    return [...vitals].sort((a, b) => {
      const timeA = a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
      const timeB = b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
      return timeB - timeA;
    })[0];
  }, [vitals]);

  // Behavior goals data
  const behaviorGoals = [
    { label: 'Steps', value: 8420, target: 10000, percentage: 84, icon: '🏃‍♂️', color: '#10B981' },
    { label: 'Diet', value: '2,150 kcal', target: '2,400 kcal', percentage: 90, icon: '🍽️', color: '#3B82F6' },
    { label: 'Rx Compliance', value: '4/5', target: '5/5', percentage: 80, icon: '💊', color: '#8B5CF6' },
  ];

  // Extract appointment
  const nextAppointment = appointments?.[0] || {
    providerName: 'Dr. G. Theogate',
    specialty: 'Rheumatology',
    date: 'SAT, JUN 27',
    time: '11:30 AM',
    room: 'Consultation Suite 3B • In-clinic',
  };

  // Mock consultation note
  const lastConsultationNote = {
    date: 'June 15, 2026',
    snippet: 'Patient demonstrates excellent medication adherence. Joint mobility improving with PT sessions. Continue current regimen.',
  };

  // Medication compliance percentage
  const medicationCompliance = 80;

  return (
    <div className="w-full space-y-4 pb-6 font-sans">
      {/* HERO BANNER - Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#EEF3F0] to-[#D1E2D7] rounded-2xl p-6 border border-[#C5D9C9] shadow-sm overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            Welcome back, <br />
            <span className="text-[#3F5B42]">{patient?.name || 'Marcus'}</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-2">
            Your health journey is on track. Keep up the great work! 🌱
          </p>
        </div>
      </motion.div>

      {/* CARD 1: Health Score + Behavior Goals (Two-Column Layout) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Health Score */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF3F0] to-[#E0EAE5] rounded-xl p-4 border border-[#DEE8E0]">
                <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" stroke="#E5ECE7" strokeWidth="8" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10B981"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 - (251.3 * (patient?.healthScore ?? 78)) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-slate-900">{patient?.healthScore ?? 78}</span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase block">Score</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Health Score</span>
              </div>

              {/* Right: Behavior Goals - Vertical Stack */}
              <div className="flex flex-col justify-between space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Behavior Goals</span>
                {behaviorGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative w-6 h-6">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#E5ECE7" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke={goal.color}
                          strokeWidth="3"
                          strokeDasharray="88"
                          strokeDashoffset={88 - (88 * goal.percentage) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[6px] font-black text-slate-700">
                        {goal.percentage}%
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-700">{goal.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CARD 2: Upcoming Session (Default 3 rows height) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Upcoming Session
              </CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold">
                Next Up
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {/* Session Card */}
            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 space-y-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{nextAppointment.providerName}</h3>
                <p className="text-xs text-slate-500 font-medium">{nextAppointment.specialty}</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono bg-white p-2 rounded-lg border border-amber-100 divide-x divide-amber-200">
                <div>
                  <span className="text-[8px] uppercase text-amber-600 block font-semibold">Date</span>
                  <strong className="text-slate-800 text-xs">{nextAppointment.date}</strong>
                </div>
                <div className="pl-3">
                  <span className="text-[8px] uppercase text-amber-600 block font-semibold">Time</span>
                  <strong className="text-slate-800 text-xs">{nextAppointment.time}</strong>
                </div>
              </div>
              <div className="text-[9px] font-bold text-slate-600 bg-white p-1.5 rounded border border-amber-100">
                📍 {nextAppointment.room}
              </div>
            </div>

            {/* Additional spacing for 3-row height */}
            <div className="flex-1" />
          </CardContent>
        </Card>
      </motion.div>

      {/* CARD 3: My Consultation Notes (1 row, with preview) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={onOpenConsultationNotes}
          className="w-full text-left"
        >
          <Card className="border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50 p-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
                My Consultation Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{lastConsultationNote.date}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                  {lastConsultationNote.snippet}
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      </motion.div>

      {/* CARD 4: Medication Compliance Button Widget (1 row) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={() => {
            setMedicationComplianceExpanded(!medicationComplianceExpanded);
            onOpenMedicationCompliance?.();
          }}
          className="w-full text-left"
        >
          <Card className="border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Pill className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Medication Compliance
                    </h3>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                      Track your adherence
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg font-black text-purple-700">{medicationCompliance}%</div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </motion.div>

      {/* Expandable Medication Compliance Tracker (appears below when expanded) */}
      {medicationComplianceExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-purple-900 uppercase">Weekly Compliance</h4>
            <button
              onClick={() => setMedicationComplianceExpanded(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Hide
            </button>
          </div>

          {/* Daily compliance grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const isCompliant = idx !== 2; // One missed day (Wednesday)
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center text-[9px] font-bold ${
                    isCompliant
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  <span className="mb-1">{day}</span>
                  <span>{isCompliant ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
            You're doing great! Just one missed dose this week. Keep up your routine!
          </p>

          <button
            onClick={onOpenMedicationCompliance}
            className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            View Full Tracker
          </button>
        </motion.div>
      )}

      {/* Bottom Spacing */}
      <div className="h-4" />
    </div>
  );
}
