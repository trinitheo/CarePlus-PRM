
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Settings2, Save } from 'lucide-react';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../../components/ui/button';
import { markMessageRead, completeCourtesyCall, createReminder, completeReminder } from '../../services/clinicalFirestoreService';

import { useDashboardData } from './hooks/useDashboardData';
import { useWidgetLayout } from './hooks/useWidgetLayout';
import { WidgetGrid } from './components/WidgetGrid';
import { MessagesWidget, RemindersWidget, CourtesyCallsWidget } from './widgets/SharedWidgets';
import { 
  CheckInQueueWidget, MedicationFlagsWidget, TodayScheduleWidget, 
  PendingResultsWidget, MyPatientsWidget, ReferralsWidget, 
  SystemOverviewWidget, StaffDirectoryWidget, BillingWidget 
} from './widgets/StaffWidgets';
import { MyVitalsWidget, MyMedicationsWidget, HealthSyncWidget } from './widgets/PatientWidgets';

const ROLE_META: Record<string, { headline: string; sub: string; accentColor: string }> = {
  clinician: { headline: 'Clinical Overview', sub: "Your patients, results, and schedule", accentColor: '#107C10' },
  nurse: { headline: 'Nursing Dashboard', sub: "Queue, vitals, and care tasks", accentColor: '#0078D4' },
  allied_health: { headline: 'Allied Health Hub', sub: "Referrals, patients, and calls", accentColor: '#5C2D91' },
  admin: { headline: 'Administration', sub: "System health and staff directory", accentColor: '#D13438' },
  financial: { headline: 'Billing & Claims', sub: "Financial overview and messaging", accentColor: '#8764B8' },
  front_desk: { headline: 'Reception & Queue', sub: "Patient check-ins and front-desk flow", accentColor: '#00B7C3' },
  patient: { headline: 'My Health', sub: "Vitals, medications, and appointments", accentColor: '#0078D4' },
};

export function RoleDashboard({ onNavigateToPatient }: { onNavigateToPatient?: (id: string) => void }) {
  const { userProfile } = useCurrentUser();
  const data = useDashboardData(userProfile);
  const role = userProfile?.role || 'clinician';
  
  const handleRead = async (id: string) => { await markMessageRead(id); };
  const handleCompleteCall = async (id: string, notes: string) => { await completeCourtesyCall(id, notes); };
  const handleCompleteReminder = async (id: string) => { await completeReminder(id); };
  const handleCreateReminder = async (reminderData: any) => { 
    await createReminder({
      ...reminderData,
      assignedToUserId: userProfile?.id,
      assignedToRole: userProfile?.role
    });
  };

  const widgetDefinitions = useMemo(() => {
    const shared = {
      messages: <MessagesWidget messages={data.messages} onRead={handleRead} />,
      reminders: <RemindersWidget reminders={data.reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      calls: <CourtesyCallsWidget tasks={data.courtesyCalls} onComplete={handleCompleteCall} />,
    };

    const roles: Record<string, Record<string, React.ReactNode>> = {
      clinician: {
        ...shared,
        schedule: <TodayScheduleWidget schedule={data.todaySchedule} onNavigate={onNavigateToPatient} />,
        results: <PendingResultsWidget results={data.pendingResults} onNavigate={onNavigateToPatient} />,
        patients: <MyPatientsWidget patients={data.myPatients} onNavigate={onNavigateToPatient} />,
      },
      nurse: {
        ...shared,
        queue: <CheckInQueueWidget queue={data.queue} onNavigate={onNavigateToPatient} />,
        med_flags: <MedicationFlagsWidget flagged={data.flaggedMedications} onNavigate={onNavigateToPatient} />,
        schedule: <TodayScheduleWidget schedule={data.todaySchedule} onNavigate={onNavigateToPatient} />,
      },
      allied_health: {
        ...shared,
        patients: <MyPatientsWidget patients={data.myPatients} onNavigate={onNavigateToPatient} />,
        referrals: <ReferralsWidget referrals={data.referrals.filter((r: any) => !userProfile?.specialty || r.specialty?.toLowerCase().includes((userProfile.specialty as string).toLowerCase()))} onNavigate={onNavigateToPatient} />,
        schedule: <TodayScheduleWidget schedule={data.todaySchedule} onNavigate={onNavigateToPatient} />,
      },
      admin: {
        ...shared,
        overview: <SystemOverviewWidget stats={data.systemStats} />,
        directory: <StaffDirectoryWidget staff={data.staffUsers} />,
        queue: <CheckInQueueWidget queue={data.queue} onNavigate={onNavigateToPatient} />,
      },
      financial: {
        ...shared,
        billing: <BillingWidget stats={data.billingStats} />,
        schedule: <TodayScheduleWidget schedule={data.todaySchedule} onNavigate={onNavigateToPatient} />,
        patients: <MyPatientsWidget patients={data.myPatients} onNavigate={onNavigateToPatient} />,
      },
      front_desk: {
        ...shared,
        queue: <CheckInQueueWidget queue={data.queue} onNavigate={onNavigateToPatient} />,
        schedule: <TodayScheduleWidget schedule={data.todaySchedule} onNavigate={onNavigateToPatient} />,
        billing: <BillingWidget stats={data.billingStats} />,
      },
      patient: {
        ...shared,
        vitals: <MyVitalsWidget metrics={data.patientMetrics} hasCritical={data.hasCriticalVitals} onNavigate={() => userProfile?.id && onNavigateToPatient?.(userProfile.id)} />,
        medications: <MyMedicationsWidget meds={data.myMeds} onNavigate={() => userProfile?.id && onNavigateToPatient?.(userProfile.id)} />,
        schedule: <TodayScheduleWidget schedule={data.todaySchedule.filter(a => a.patientId === userProfile?.id)} onNavigate={onNavigateToPatient} />,
        health_sync: <HealthSyncWidget patientId={userProfile?.id || ''} />,
      },
    };
    return roles[role] || roles.clinician;
  }, [role, data, userProfile, onNavigateToPatient]);

  const availableWidgetIds = useMemo(() => Object.keys(widgetDefinitions), [widgetDefinitions]);
  
  const layout = useWidgetLayout(userProfile, availableWidgetIds);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (data.loading && !userProfile) return null;

  const meta = ROLE_META[role] || ROLE_META.clinician;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userProfile?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="h-full flex flex-col gap-5 min-w-0 overflow-y-auto pb-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
        className="flex items-end justify-between shrink-0"
      >
        <div>
          <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest mb-1.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-4">
             <h1 className="text-[26px] font-black text-[#1A1A1A] tracking-tight leading-none">
              {greeting}, <span style={{ color: meta.accentColor }}>{firstName}</span>
            </h1>
            <Button 
               size="sm" 
               variant="ghost" 
               onClick={() => layout.isEditing ? layout.saveSettings() : layout.setIsEditing(true)}
               className={`h-9 px-4 rounded-full font-black text-[11px] uppercase tracking-widest gap-2 ${layout.isEditing ? 'bg-[#107C10] text-white hover:bg-[#0b5e0b]' : 'bg-[#FAFAFA] border border-[#EDEBE9] text-[#757370] hover:bg-[#F3F2F1]'}`}
            >
              {layout.isEditing ? <><Save className="h-3.5 w-3.5" /> Save Layout</> : <><Settings2 className="h-3.5 w-3.5" /> Customize</>}
            </Button>
            {layout.isEditing && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => layout.setIsEditing(false)}
                className="h-9 px-4 rounded-full font-black text-[11px] uppercase tracking-widest text-[#D13438] hover:bg-red-50"
              >
                Cancel
              </Button>
            )}
            {layout.isEditing && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={layout.resetToDefaults}
                className="h-9 px-4 rounded-full font-black text-[11px] uppercase tracking-widest text-[#616161] hover:bg-[#F3F2F1]"
              >
                Reset to Defaults
              </Button>
            )}
          </div>
          <p className="text-[13px] text-[#757370] font-medium mt-1.5">
            {layout.isEditing ? 'Drag handles to reorder, use eye icon to toggle visibility' : meta.sub}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="h-10 px-4 rounded-full flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"
            style={{ background: `${meta.accentColor}14`, color: meta.accentColor }}
          >
            {role.replace('_', ' ')}
          </div>
          {data.messages.filter(m => !m.read).length > 0 && (
            <p className="text-[10px] text-[#757370] font-semibold">
              {data.messages.filter(m => !m.read).length} unread message{data.messages.filter(m => !m.read).length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={layout.handleDragEnd}
      >
        <WidgetGrid 
          isEditing={layout.isEditing} 
          order={layout.widgetOrder} 
          onToggleVisibility={layout.toggleVisibility}
          onToggleSize={layout.toggleSize}
          visibility={layout.widgetVisibility}
          sizes={layout.widgetSizes}
          viewClass={layout.viewClass}
        >
          {widgetDefinitions}
        </WidgetGrid>
      </DndContext>
    </div>
  );
}
