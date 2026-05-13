
import React from 'react';
import { 
  ClipboardList, ChevronRight, Pill, Calendar, FlaskConical, Users, ArrowRight, Building2, Activity, AlertTriangle, User, Shield, Zap, CreditCard 
} from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { DashCard, SectionHeader, Empty, ListItem, Avatar } from '../components/DashboardUI';
import { urgencyPill } from '../utils';

// --- Check-in Queue Widget ---
export function CheckInQueueWidget({ queue, onNavigate }: { queue: any[], onNavigate?: (id: string) => void }) {
  const statusBadge = (p: any) => {
    if (p.isTriage) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Triage</span>;
    if (p.vitalsStale) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Vitals Due</span>;
    return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Current</span>;
  };

  return (
    <DashCard>
      <SectionHeader icon={ClipboardList} label="Check-in Queue" count={queue.length} color="bg-[#FFF4CE] text-[#845701]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {queue.length === 0 && <Empty message="Queue is clear" />}
          {queue.map(p => (
            <ListItem
              key={p.id}
              onClick={() => onNavigate?.(p.id)}
              urgent={p.isTriage}
              leading={
                <div className={`h-9 w-9 rounded-2xl flex items-center justify-center font-black text-[12px] ${p.isTriage ? 'bg-red-100 text-red-700' : 'bg-[#F3F2F1] text-[#444441]'}`}>
                  {p.name?.[0]}
                </div>
              }
              headline={p.name}
              supporting={
                p.last
                  ? `HR ${p.last.hr} · BP ${p.last.bp} · ${Math.round(p.hoursAgo)}h ago`
                  : 'No vitals on record'
              }
              trailing={
                <div className="flex flex-col items-end gap-1.5">
                  {statusBadge(p)}
                  <ChevronRight className="h-3.5 w-3.5 text-[#A19F9D] group-hover:text-[#0078D4] transition-colors" />
                </div>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- Medication Flags Widget ---
export function MedicationFlagsWidget({ flagged, onNavigate }: { flagged: any[], onNavigate?: (id: string) => void }) {
  const adherenceBg: Record<string, string> = {
    poor: 'bg-red-50 border-red-200 text-red-800',
    partial: 'bg-amber-50 border-amber-200 text-amber-800',
    uncertain: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <DashCard>
      <SectionHeader icon={Pill} label="Medication Flags" count={flagged.length} color="bg-red-50 text-red-600" />
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-2 pb-3">
          {flagged.length === 0 && <Empty message="All medications on track" />}
          {flagged.map(med => (
            <button
              key={med.id}
              onClick={() => onNavigate?.(med.patientId)}
              className={`w-full text-left p-3 rounded-2xl border transition-all hover:shadow-sm ${adherenceBg[med.adherenceStatus] || 'bg-slate-50 border-slate-200 text-slate-700'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold truncate">{med.patientName}</p>
                  <p className="text-[11px] opacity-80 mt-0.5 truncate">{med.medicationName}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{med.dosage} · {med.frequency}</p>
                </div>
                <span className="text-[9px] font-black uppercase shrink-0 mt-0.5 opacity-80 tracking-wide">
                  {med.adherenceStatus}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- Today Schedule Widget ---
export function TodayScheduleWidget({ schedule, onNavigate }: { schedule: any[], onNavigate?: (id: string) => void }) {
  const statusStyle: Record<string, string> = {
    done: 'bg-slate-100 text-slate-500 border-slate-200',
    active: 'bg-[#0078D4] text-white border-[#0078D4]',
    overdue: 'bg-red-100 text-red-700 border-red-200',
    imminent: 'bg-amber-100 text-amber-700 border-amber-200',
    upcoming: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <DashCard>
      <SectionHeader icon={Calendar} label="Today's Schedule" count={schedule.length} color="bg-[#DEECF9] text-[#0078D4]" />
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-2 pb-3">
          {schedule.length === 0 && <Empty message="No appointments today" />}
          {schedule.map((appt: any) => (
            <button
              key={appt.id}
              onClick={() => onNavigate?.(appt.patientId)}
              className="w-full text-left p-3 rounded-2xl border border-[#EDEBE9] bg-white hover:bg-[#F5F4F3] transition-all flex gap-3 items-center group"
            >
              <div className="shrink-0 text-center min-w-[44px]">
                <p className="text-[14px] font-black text-[#242424] leading-none">
                  {new Date(appt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[9px] text-[#A19F9D] font-medium mt-0.5">
                  {appt.visitType === 'telehealth' ? '📱 Virtual' : '🏥 Clinic'}
                </p>
              </div>
              <div className="w-px h-8 bg-[#EDEBE9] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold text-[#242424] truncate">{appt.patientName}</p>
                <p className="text-[11px] text-[#757370] mt-0.5 truncate">{appt.reason}</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusStyle[appt.dashboardStatus]}`}>
                {appt.dashboardStatus === 'active' ? 'Now' : appt.dashboardStatus === 'imminent' ? 'Soon' : appt.dashboardStatus}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- Pending Results Widget ---
export function PendingResultsWidget({ results, onNavigate }: { results: any[], onNavigate?: (id: string) => void }) {
  const categoryIcon: Record<string, string> = { laboratory: '🧪', imaging: '🩻', functional: '📈' };

  return (
    <DashCard>
      <SectionHeader icon={FlaskConical} label="Pending Results" count={results.length} color="bg-purple-50 text-purple-700" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {results.length === 0 && <Empty message="No pending results" />}
          {results.map(r => (
            <button 
              key={r.id} 
              onClick={() => onNavigate?.(r.patientId)}
              className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-[#F5F4F3] transition-colors group"
            >
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-[16px] shrink-0 ${r.priority === 'urgent' ? 'bg-red-50' : 'bg-purple-50'}`}>
                {categoryIcon[r.category] || '🔬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[12.5px] font-bold text-[#242424] group-hover:text-[#0078D4] transition-colors truncate">{r.patientName}</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${urgencyPill(r.priority)}`}>
                    {r.priority}
                  </span>
                </div>
                <p className="text-[11px] text-[#757370] mt-0.5 truncate capitalize">
                  {r.category} · {r.tests?.map((t: any) => t.testName).join(', ')}
                </p>
                <p className="text-[10px] text-[#A19F9D] mt-0.5 capitalize">{r.status?.replace('_', ' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- My Patients Widget ---
export function MyPatientsWidget({ patients, onNavigate }: { patients: any[], onNavigate?: (id: string) => void }) {
  return (
    <DashCard>
      <SectionHeader icon={Users} label="My Patients" count={patients.length} color="bg-[#DFF6DD] text-[#107C10]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {patients.length === 0 && <Empty message="No patients assigned yet" />}
          {patients.map(p => (
            <ListItem
              key={p.id}
              onClick={() => onNavigate?.(p.id)}
              leading={<Avatar name={p.name} color="#107C10" />}
              headline={p.name}
              supporting={p.conditions?.slice(0, 2).join(' · ') || 'No conditions recorded'}
              trailing={<ChevronRight className="h-4 w-4 text-[#A19F9D] group-hover:text-[#107C10] transition-colors" />}
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- Referrals Widget ---
export function ReferralsWidget({ referrals, onNavigate }: { referrals: any[], onNavigate?: (id: string) => void }) {
  return (
    <DashCard>
      <SectionHeader icon={ArrowRight} label="Incoming Referrals" count={referrals.length} color="bg-purple-50 text-purple-700" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {referrals.length === 0 && <Empty message="No referrals for your specialty" />}
          {referrals.map(r => (
            <ListItem
              key={r.id}
              onClick={() => onNavigate?.(r.patientId)}
              leading={<Avatar name={r.patientName || '?'} color="#5C2D91" />}
              headline={r.patientName || 'Unknown'}
              supporting={r.reason || r.specialty || 'Referral'}
              trailing={
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {r.status || 'Pending'}
                </span>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- System Overview Widget ---
export function SystemOverviewWidget({ stats }: { stats: any[] }) {
  return (
    <DashCard>
      <SectionHeader icon={Building2} label="System Overview" color="bg-slate-100 text-slate-600" />
      <div className="p-4 grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl bg-[#FAFAFA] border border-[#EDEBE9] p-4 flex flex-col gap-2">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className={`text-[28px] font-black leading-none ${s.textColor}`}>{s.value}</p>
            <p className="text-[11px] text-[#A19F9D] font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 flex items-center gap-2 p-3 rounded-2xl bg-green-50 border border-green-200 mx-4 mb-4">
        <Shield className="h-4 w-4 text-green-700 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-green-800">HIPAA Compliant</p>
          <p className="text-[10px] text-green-700">All access logs current</p>
        </div>
        <Zap className="h-3.5 w-3.5 text-green-600 ml-auto" />
      </div>
    </DashCard>
  );
}

// --- Staff Directory Widget ---
export function StaffDirectoryWidget({ staff }: { staff: any[] }) {
  const roleColor: Record<string, string> = {
    clinician: '#107C10', nurse: '#0078D4', allied_health: '#5C2D91',
    admin: '#D13438', billing: '#8764B8', patient: '#CA5010',
  };

  return (
    <DashCard>
      <SectionHeader icon={Users} label="Active Staff" count={staff.length} color="bg-[#DEECF9] text-[#0078D4]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {staff.length === 0 && <Empty message="No staff profiles found" />}
          {staff.map(u => (
            <ListItem
              key={u.id}
              leading={<Avatar name={u.displayName || '?'} color={roleColor[u.role] || '#616161'} />}
              headline={u.displayName || u.email}
              supporting={u.specialty || u.email || u.role}
              trailing={
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0"
                  style={{ background: `${roleColor[u.role] || '#616161'}15`, color: roleColor[u.role] || '#616161', borderColor: `${roleColor[u.role] || '#616161'}30` }}>
                  {u.role?.replace('_', ' ')}
                </span>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// --- Billing Overview Widget ---
export function BillingWidget({ stats }: { stats: any[] }) {
  return (
    <DashCard>
      <SectionHeader icon={CreditCard} label="Billing Summary" color="bg-slate-100 text-slate-600" />
      <div className="p-4 space-y-2">
        {stats.map(s => (
          <div key={s.label} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAFA] border border-[#EDEBE9]">
            <p className="text-[12px] font-semibold text-[#444441]">{s.label}</p>
            <p className="text-[18px] font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
    </DashCard>
  );
}
