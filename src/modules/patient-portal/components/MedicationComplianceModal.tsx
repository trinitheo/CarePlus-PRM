import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Pill,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';

interface MedicationComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complianceData?: any;
  medicationData?: any[];
}

export function MedicationComplianceModal({
  open,
  onOpenChange,
  complianceData = {
    overallPercentage: 80,
    totalMedications: 2,
    adherentDays: 24,
    totalDays: 30,
  },
  medicationData = [
    {
      id: 'rx-1',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      adherencePercentage: 85,
      adherentDays: 25,
      missedDoses: 5,
      reason: 'Type 2 Diabetes Management',
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      accentColor: '#3B82F6',
    },
    {
      id: 'rx-2',
      name: 'HRT (Combined)',
      dosage: 'Varies',
      frequency: 'Daily',
      adherencePercentage: 75,
      adherentDays: 23,
      missedDoses: 7,
      reason: 'PCOS / Hormone Replacement',
      color: 'bg-purple-50 border-purple-200 text-purple-900',
      accentColor: '#8B5CF6',
    },
  ],
}: MedicationComplianceModalProps) {
  const [expandedMeds, setExpandedMeds] = useState<string[]>([]);

  const toggleMedExpanded = (medId: string) => {
    setExpandedMeds(prev =>
      prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
    );
  };

  // Generate daily compliance calendar for the month
  const complianceCalendar = useMemo(() => {
    const calendar = [];
    for (let day = 1; day <= 30; day++) {
      const isMissed = day === 9 || day === 15 || day === 22; // Simulated missed days
      calendar.push({
        day,
        compliant: !isMissed,
      });
    }
    return calendar;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto font-sans bg-white">
        {/* Header */}
        <DialogHeader className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Medication Compliance Tracker
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Monitor your medication adherence and track your prescription history
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Overall Compliance Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Score Circle */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24 mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="40" stroke="#E5D4F7" strokeWidth="8" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#8B5CF6"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="251.3"
                        strokeDashoffset={251.3 - (251.3 * complianceData.overallPercentage) / 100}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-purple-900">
                        {complianceData.overallPercentage}%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Overall Score</span>
                </div>

                {/* Statistics */}
                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                  {/* Adherent Days */}
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Adherent Days
                    </div>
                    <div className="text-2xl font-black text-purple-900">
                      {complianceData.adherentDays}/{complianceData.totalDays}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium mt-1">
                      ✓ Doses taken on schedule
                    </div>
                  </div>

                  {/* Active Medications */}
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Active Medications
                    </div>
                    <div className="text-2xl font-black text-purple-900">
                      {complianceData.totalMedications}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium mt-1">
                      Currently tracking prescriptions
                    </div>
                  </div>

                  {/* Missed Doses */}
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Missed Doses (Month)
                    </div>
                    <div className="text-2xl font-black text-red-600">
                      {30 - complianceData.adherentDays}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium mt-1">
                      Days with missed doses
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200 flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-purple-900">Your compliance is strong!</strong> You're maintaining 80% adherence. Continue your current medication schedule and mark doses when taken to stay on track.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Compliance Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                <Calendar className="h-4 w-4 inline mr-2" />
                June 2026 Compliance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-[9px] font-bold text-slate-500 uppercase">
                    {day}
                  </div>
                ))}
                {complianceCalendar.map((entry) => (
                  <div
                    key={entry.day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      entry.compliant
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 shadow-sm'
                        : 'bg-rose-100 border border-rose-300 text-rose-900 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px]">{entry.day}</span>
                      <span className="text-[9px]">{entry.compliant ? '✓' : '✗'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded" />
                  <span className="text-slate-600 font-medium">Adherent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-rose-100 border border-rose-300 rounded" />
                  <span className="text-slate-600 font-medium">Missed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Individual Medication Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider px-1">Your Medications</h3>

          {medicationData.map((med, idx) => {
            const isExpanded = expandedMeds.includes(med.id);
            const daysRemaining = 30 - med.missedDoses;

            return (
              <motion.div key={med.id} layout>
                <Card className={`border ${med.color} shadow-sm overflow-hidden`}>
                  <CardContent className="p-0">
                    {/* Header - Always visible */}
                    <button
                      onClick={() => toggleMedExpanded(med.id)}
                      className="w-full text-left p-4 hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-slate-900">{med.name}</h4>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-white"
                              style={{ borderColor: med.accentColor, color: med.accentColor }}
                            >
                              {med.adherencePercentage}%
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mb-2">{med.reason}</p>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
                            <span>{med.dosage}</span>
                            <span>•</span>
                            <span>{med.frequency}</span>
                          </div>
                        </div>

                        {/* Progress Ring */}
                        <div className="relative w-14 h-14 shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="40" stroke="#E5ECE7" strokeWidth="8" fill="none" />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={med.accentColor}
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray="251.3"
                              strokeDashoffset={251.3 - (251.3 * med.adherencePercentage) / 100}
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-900">{med.adherencePercentage}%</span>
                          </div>
                        </div>

                        {/* Expand Arrow */}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-200/60 p-4 bg-black/2 space-y-4"
                      >
                        {/* Compliance breakdown */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/60 rounded-lg p-3 border border-slate-200">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Taken on Schedule</div>
                            <div className="text-xl font-black text-emerald-700">{med.adherentDays}</div>
                            <div className="text-[9px] text-slate-500 mt-1">days this month</div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-3 border border-slate-200">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Missed Doses</div>
                            <div className="text-xl font-black text-rose-700">{med.missedDoses}</div>
                            <div className="text-[9px] text-slate-500 mt-1">this month</div>
                          </div>
                        </div>

                        {/* Compliance progress bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">Monthly Progress</span>
                            <span className="text-[10px] font-mono text-slate-600">
                              {daysRemaining} / 30 days
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(daysRemaining / 30) * 100}%`,
                                background: `linear-gradient(to right, ${med.accentColor}, ${med.accentColor}dd)`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Tips Section */}
                        <div className="bg-blue-50/60 border border-blue-200/60 rounded-lg p-3 flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-900 leading-relaxed">
                            <strong>Pro tip:</strong> Set daily phone reminders for your medications at the same time each day to maintain consistency and improve compliance.
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 uppercase mb-2 tracking-wider">Recent Activity</h5>
                          <div className="space-y-1.5">
                            {[
                              { date: 'Today, 8:30 AM', status: 'Dose Recorded', type: 'success' },
                              { date: 'Jun 25, 8:15 AM', status: 'Dose Recorded', type: 'success' },
                              { date: 'Jun 24, Missed', status: 'Dose Missed', type: 'missed' },
                              { date: 'Jun 23, 8:45 AM', status: 'Dose Recorded', type: 'success' },
                            ].map((activity, i) => (
                              <div key={i} className="flex items-center justify-between text-xs p-2 bg-white/40 rounded border border-slate-200/40">
                                <span className="text-slate-600">{activity.date}</span>
                                <div className="flex items-center gap-1">
                                  {activity.type === 'success' ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                      <span className="text-emerald-700 font-semibold">{activity.status}</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3 w-3 text-rose-600" />
                                      <span className="text-rose-700 font-semibold">{activity.status}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer Action */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong>Need help?</strong> If you're having trouble remembering doses, contact your care team to discuss alternative reminders or simplified dosing schedules.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
