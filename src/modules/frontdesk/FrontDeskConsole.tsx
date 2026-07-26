import React, { useState } from 'react';
import { 
  Search, Clock, CreditCard, ShieldAlert, CheckCircle2, 
  FileText, Activity, AlertTriangle, Users, Wallet,
  ChevronRight, FileSignature, Stethoscope, User, Bot, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppointmentSchedulingAgentPanel } from '../scheduling/AppointmentSchedulingAgentPanel';

// --- Types & Mock Data ---
type QueueStatus = 'pending' | 'arrived' | 'in_intake' | 'ready_for_clinical';
type InsuranceStatus = 'verified' | 'mismatched' | 'pending';

interface DocketPatient {
  id: string;
  name: string;
  time: string;
  tMinus: number; // minutes
  status: QueueStatus;
  type: 'appointment' | 'walk-in';
  age: number;
  gender: 'M' | 'F' | 'O';
  insurance: InsuranceStatus;
  copayDue: number;
  consentSigned: boolean;
}

const MOCK_QUEUE: DocketPatient[] = [
  { id: '1', name: 'Eleanor Vance', time: '09:45 AM', tMinus: 9, status: 'pending', type: 'appointment', age: 34, gender: 'F', insurance: 'verified', copayDue: 45.00, consentSigned: false },
  { id: '2', name: 'Marcus Sterling', time: '10:00 AM', tMinus: 24, status: 'pending', type: 'appointment', age: 12, gender: 'M', insurance: 'mismatched', copayDue: 0, consentSigned: true },
  { id: '3', name: 'Sophia Jenkins', time: '09:15 AM', tMinus: -21, status: 'arrived', type: 'appointment', age: 65, gender: 'F', insurance: 'verified', copayDue: 20.00, consentSigned: true },
  { id: '4', name: 'David Cho', time: 'Walk-in', tMinus: 0, status: 'in_intake', type: 'walk-in', age: 41, gender: 'M', insurance: 'pending', copayDue: 150.00, consentSigned: false },
];

export function FrontDeskConsole({ onRegisterPatient }: { onRegisterPatient: () => void }) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'walk-ins'>('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<DocketPatient | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  const filteredQueue = MOCK_QUEUE.filter(p => 
    (activeTab === 'appointments' ? p.type === 'appointment' : p.type === 'walk-in') &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-[#FAFAFA] p-6 flex flex-col font-sans min-h-0 overflow-hidden">
      {/* Top Header & Omni Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-[11px] font-black text-indigo-600 tracking-widest uppercase">
              Front Desk Operations
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Access Center</h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => setShowAgent(!showAgent)}
            className={`px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-md whitespace-nowrap ${
              showAgent 
                ? 'bg-slate-900 text-white hover:bg-black' 
                : 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:opacity-95 shadow-indigo-500/20'
            }`}
          >
            <Bot size={16} />
            <span>{showAgent ? 'Close AI Agent' : 'AI Scheduling Agent'}</span>
          </button>

          <div className="group relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
              <Search size={16} strokeWidth={3} />
            </div>
            <input
              type="text"
              placeholder="Omni Search (Name, MRN, DOB)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold shadow-sm"
            />
          </div>
          <button 
            onClick={onRegisterPatient}
            className="px-6 py-3 rounded-xl shadow-[0_4px_15px_rgb(14,165,233,0.15)] text-[11px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 hover:shadow-[0_8px_25px_rgb(14,165,233,0.25)] active:scale-[0.98] transition-all whitespace-nowrap"
          >
            New Walk-in
          </button>
        </div>
      </div>

      {/* Embedded AI Agent Drawer / Panel */}
      <AnimatePresence>
        {showAgent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6 shrink-0"
          >
            <AppointmentSchedulingAgentPanel onClose={() => setShowAgent(false)} embedded={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Split Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Column: Arrival Docket & Queue */}
        <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col bg-white border border-[#EDEBE9] rounded-2xl shadow-sm overflow-hidden">
          {/* Queue Toggles */}
          <div className="flex border-b border-[#EDEBE9] p-2 shrink-0">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'appointments' ? 'bg-sky-50 text-sky-700' : 'text-[#A19F9D] hover:bg-slate-50'
              }`}
            >
              Scheduled (3)
            </button>
            <button
              onClick={() => setActiveTab('walk-ins')}
              className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'walk-ins' ? 'bg-sky-50 text-sky-700' : 'text-[#A19F9D] hover:bg-slate-50'
              }`}
            >
              Walk-in Waitlist (1)
            </button>
          </div>

          {/* Docket List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {filteredQueue.map((patient) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedPatient?.id === patient.id 
                      ? 'border-sky-400 bg-sky-50/50 shadow-md' 
                      : 'border-[#EDEBE9] hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{patient.name}</h3>
                      <div className="text-[10px] font-bold text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{patient.age}Y • {patient.gender}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {patient.time}
                        </span>
                      </div>
                    </div>
                    {/* T-Minus Timer */}
                    <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                      patient.tMinus < 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                      patient.tMinus <= 15 ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {patient.tMinus < 0 ? `LATE ${Math.abs(patient.tMinus)}M` : `T-${patient.tMinus}M`}
                    </div>
                  </div>

                  {/* Financial & Compliance Badges */}
                  <div className="flex flex-wrap gap-2">
                    {patient.insurance === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        <CheckCircle2 size={10} /> Ins Verified
                      </span>
                    ) : patient.insurance === 'mismatched' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-rose-50 text-rose-700 rounded border border-rose-200">
                        <ShieldAlert size={10} /> Ins Mismatch
                      </span>
                    ) : null}

                    {patient.copayDue > 0 && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                        <Wallet size={10} /> ${patient.copayDue.toFixed(2)} Due
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredQueue.length === 0 && (
              <div className="text-center py-10 text-sm font-bold text-slate-400">
                No patients in this queue.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Action Panel & Metrics */}
        <div className="hidden md:flex flex-1 flex-col gap-6">
          
          {/* Top Operational Metrics (Always visible) */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white border border-[#EDEBE9] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] flex items-center gap-2 mb-1">
                <Wallet size={14} /> Co-Pay Recovery
              </span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900">$450.00</span>
                <span className="text-xs font-bold text-emerald-600 mb-1">Target 100%</span>
              </div>
            </div>
            <div className="bg-white border border-[#EDEBE9] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] flex items-center gap-2 mb-1">
                <FileSignature size={14} /> Consent Compliance
              </span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900">96.4%</span>
                <span className="text-xs font-bold text-emerald-600 mb-1">Above 94% SLA</span>
              </div>
            </div>
          </div>

          {/* Dynamic Action Area: Shows Selected Patient OR Empty State */}
          <div className="flex-1 bg-white border border-[#EDEBE9] rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
            {selectedPatient ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={selectedPatient.id}
                className="flex-1 flex flex-col"
              >
                {/* Selected Header */}
                <div className="p-6 border-b border-[#EDEBE9] bg-[#FAF9F8]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{selectedPatient.name}</h2>
                      <p className="text-sm font-bold text-slate-500 mt-1">
                        {selectedPatient.age} yrs • {selectedPatient.gender === 'F' ? 'Female' : selectedPatient.gender === 'M' ? 'Male' : 'Other'} • MRN: 9482-11{selectedPatient.id}
                      </p>
                    </div>
                    {selectedPatient.age < 18 && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        Pediatric Pathway
                      </span>
                    )}
                    {selectedPatient.gender === 'F' && selectedPatient.age > 10 && (
                      <span className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        Women's Health Protocol
                      </span>
                    )}
                  </div>
                </div>

                {/* Triage Checklist */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Intake Readiness Checklist</h3>
                  
                  <div className="space-y-4">
                    {/* Financial Block */}
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-[#EDEBE9] bg-white">
                      <div className={`p-2 rounded-lg mt-0.5 ${selectedPatient.copayDue > 0 || selectedPatient.insurance !== 'verified' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <CreditCard size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 mb-1">Financial Clearance</h4>
                        {selectedPatient.insurance === 'mismatched' ? (
                          <p className="text-xs font-medium text-rose-600 mb-2">Payer ID mismatch. Re-scan primary card required.</p>
                        ) : selectedPatient.copayDue > 0 ? (
                          <p className="text-xs font-medium text-amber-600 mb-2">Uncollected Copay: ${selectedPatient.copayDue.toFixed(2)}</p>
                        ) : (
                          <p className="text-xs font-medium text-emerald-600 mb-2">Insurance verified. No outstanding balances.</p>
                        )}
                        {(selectedPatient.copayDue > 0 || selectedPatient.insurance === 'mismatched') && (
                          <button className="text-[10px] font-black uppercase tracking-widest text-sky-600 hover:text-sky-700">
                            Resolve Financials →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Consent Block */}
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-[#EDEBE9] bg-white">
                      <div className={`p-2 rounded-lg mt-0.5 ${!selectedPatient.consentSigned ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <FileSignature size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 mb-1">Legal & Consents</h4>
                        {!selectedPatient.consentSigned ? (
                          <p className="text-xs font-medium text-rose-600 mb-2">HIPAA and General Consent to Treat missing.</p>
                        ) : (
                          <p className="text-xs font-medium text-emerald-600 mb-2">All electronic signatures executed.</p>
                        )}
                        {!selectedPatient.consentSigned && (
                          <button className="text-[10px] font-black uppercase tracking-widest text-sky-600 hover:text-sky-700">
                            Capture E-Signature →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-6 border-t border-[#EDEBE9] bg-white">
                  <button 
                    onClick={onRegisterPatient}
                    className="w-full flex items-center justify-between py-4 px-6 rounded-xl shadow-[0_8px_30px_rgb(14,165,233,0.1)] text-[12px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-black active:scale-[0.98] transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <Stethoscope size={18} />
                      Launch Clinical Intake Wizard
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[#A19F9D]">
                <User size={48} strokeWidth={1} className="mb-4 text-[#EDEBE9]" />
                <h3 className="text-lg font-black text-slate-900 mb-2">No Patient Selected</h3>
                <p className="text-sm font-medium max-w-xs">
                  Select a patient from the arrival docket to review financials, capture signatures, and initiate the intake wizard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
