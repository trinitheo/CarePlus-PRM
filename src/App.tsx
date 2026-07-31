import { useState, useEffect } from 'react';
import { EventStoreProvider } from './store/eventStore';
import { HIPAAMonitorProvider } from './hooks/useHIPAAMonitor';
import { Shell } from './components/Layout';
import { ClinicalRecords } from './modules/clinical/ClinicalRecords';
import { PatientExplorer } from './modules/clinical/management/PatientExplorer';
import { PatientIntake } from './modules/frontdesk/intake/PatientIntake';
import { NurseWorkflow } from './modules/nurse/NurseWorkflow';
import { FrontDeskConsole } from './modules/frontdesk/FrontDeskConsole';
import { UpcomingSchedule } from './modules/scheduling/UpcomingSchedule';
import { AppointmentsDashboard } from './modules/scheduling/AppointmentsDashboard';
import { RoleDashboard } from './modules/dashboard/RoleDashboard';
import { BillingDashboard } from './modules/billing/BillingDashboard';
import { CareNetworkGraph } from './modules/admin/rbac/CareNetworkGraph';
import { AdminGovernanceConsole } from './modules/admin/AdminGovernanceConsole';
import { MessagesModule } from './modules/messages/MessagesModule';
import { Activity, ChevronRight, PanelLeft, PanelLeftClose, Loader2 } from 'lucide-react';
import { useWindowSizeClass } from './hooks/useAdaptiveWidth';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from './lib/motion';
import { LoginScreen } from './components/LoginScreen';
import { useCurrentUser } from './hooks/useCurrentUser';
import { savePatient, saveUserProfile } from './services/clinicalFirestoreService';
import { ProfileEditor } from './components/ProfileEditor';
import { PatientPortalRoot } from './modules/patient-portal/PatientPortalRoot';
import { Settings } from './modules/patient-portal/views/Settings';
import { WellnessClasses } from './modules/patient-portal/views/WellnessClasses';
import { MyConsultations } from './modules/patient-portal/views/MyConsultations';
import { PatientAppointmentsView } from './modules/patient-portal/views/PatientAppointmentsView';
import { SchedulingOperatorConsole } from './modules/scheduling/SchedulingOperatorConsole';
import { usePatientClinicalData } from './hooks/usePatientClinicalData';

export default function App() {
  const sizeClass = useWindowSizeClass();
  const { userProfile, loading, refreshProfile } = useCurrentUser();
  const [currentModule, setCurrentModule] = useState('dashboard');

  const patientId = userProfile?.patientId || userProfile?.id || '';
  const patientData = usePatientClinicalData(patientId);

  const [viewState, setViewState] = useState<{
    subView: 'explorer' | 'detail' | 'onboarding';
    selectedPatientId: string | null;
  }>(() => {
    try {
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem('precison_health_view_state') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subView === 'detail' && !parsed.selectedPatientId) {
          return { subView: 'explorer', selectedPatientId: null };
        }
        return parsed;
      }
    } catch {
      // Fallback on error
    }
    return { subView: 'explorer', selectedPatientId: null };
  });

  useEffect(() => {
    sessionStorage.setItem('precison_health_view_state', JSON.stringify(viewState));
  }, [viewState]);

  const [isListOpen, setIsListOpen] = useState(true);

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
    if (module === 'patients' && viewState.subView === 'explorer') {
      setIsListOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0078D4]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#616161]">Initializing Clinical Core...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <LoginScreen onLoginSuccess={refreshProfile} />;
  }

  // RBAC Intercept: If the user is a patient, wrap in clinical Shell with permitted views
  if (userProfile.role === 'patient') {
    return (
      <EventStoreProvider>
        <HIPAAMonitorProvider>
          <Shell currentModule={currentModule} onNavigate={handleNavigate}>
            {currentModule === 'dashboard' && <PatientPortalRoot onNavigateTab={handleNavigate} />}
            {currentModule === 'settings' && (
              <div className="flex-1 min-h-0 overflow-auto h-full">
                <Settings />
              </div>
            )}
            {currentModule === 'messages' && (
              <div className="flex-1 min-h-0 overflow-hidden h-full">
                <MessagesModule />
              </div>
            )}
            {currentModule === 'appointments' && (
              <div className="flex-1 min-h-0 overflow-auto h-full">
                <PatientAppointmentsView />
              </div>
            )}
            {currentModule === 'consultations' && (
              <div className="flex-1 min-h-0 overflow-auto h-full">
                <MyConsultations patientData={patientData} />
              </div>
            )}
            {currentModule === 'wellness' && (
              <div className="flex-1 min-h-0 overflow-auto h-full">
                <WellnessClasses />
              </div>
            )}
            {currentModule === 'profile' && (
              <div className="flex-1 min-h-0 overflow-auto h-full">
                <ProfileEditor 
                  initialProfile={userProfile} 
                  onSave={async (updated) => {
                    await saveUserProfile(userProfile.id, updated);
                    const currentSession = localStorage.getItem('careplus_current_user');
                    if (currentSession) {
                      const parsed = JSON.parse(currentSession);
                      localStorage.setItem('careplus_current_user', JSON.stringify({
                        ...parsed,
                        displayName: updated.displayName,
                        email: updated.email,
                        phone: updated.phone,
                        department: updated.department,
                        npiNumber: updated.npiNumber,
                        bio: updated.bio
                      }));
                    }
                    refreshProfile();
                  }}
                  onCancel={() => setCurrentModule('dashboard')}
                />
              </div>
            )}
          </Shell>
        </HIPAAMonitorProvider>
      </EventStoreProvider>
    );
  }

  const selectPatient = (id: string) => {
    setViewState({ subView: 'detail', selectedPatientId: id });
    setIsListOpen(false);
  };

  const startOnboarding = () => {
    setViewState({ subView: 'onboarding', selectedPatientId: null });
    setIsListOpen(false);
  };

  // Adaptive logic: On Expanded screens, we use a split layout in the Patients module IF a sub-view is active
  const isDetailOrOnboarding = viewState.subView === 'detail' || viewState.subView === 'onboarding';
  const isSplitLayout = sizeClass === 'expanded' && currentModule === 'patients' && isDetailOrOnboarding;
  const isCompactList = isSplitLayout;

  return (
    <EventStoreProvider>
      <HIPAAMonitorProvider>
      <Shell currentModule={currentModule} onNavigate={handleNavigate}>
        {currentModule === 'dashboard' && (
          <div className="h-full flex flex-col min-w-0">
            <RoleDashboard 
              onNavigateToPatient={(id) => {
                setCurrentModule('patients');
                setViewState({ subView: 'detail', selectedPatientId: id });
                setIsListOpen(false);
              }} 
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {currentModule === 'patients' && (
          <div className="h-full flex flex-col min-w-0">
            {/* Context Breadcrumb - Adaptive Visibility */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/30 w-fit px-3 py-1 rounded-full border border-border/50">
                <span className="opacity-60">PRM</span>
                <ChevronRight className="h-3 w-3 opacity-30" />
                <span className="font-bold text-foreground">Registry</span>
                {viewState.subView !== 'explorer' && (
                  <>
                    <ChevronRight className="h-3 w-3 opacity-30" />
                    <span className="text-primary font-bold">
                      {viewState.subView === 'detail' ? 'Clinical Profile' : 'Onboarding'}
                    </span>
                  </>
                )}
              </div>
              {sizeClass === 'expanded' && viewState.subView !== 'explorer' && (
                <button 
                  onClick={() => setIsListOpen(!isListOpen)}
                  className="px-3 py-1.5 text-xs font-bold text-foreground bg-white border border-border rounded-md shadow-sm flex items-center gap-2 hover:bg-muted/50 transition-colors"
                >
                  {isListOpen ? <PanelLeftClose className="h-4 w-4 text-muted-foreground" /> : <PanelLeft className="h-4 w-4 text-muted-foreground" />}
                  {isListOpen ? 'Hide list' : 'Patient list'}
                </button>
              )}
            </div>

            <div className="flex-1 flex gap-6 min-h-0 relative">
              {/* List Pane - Always visible on Explorer view, conditionally on others */}
              <AnimatePresence mode="popLayout">
                {(viewState.subView === 'explorer' || !viewState.selectedPatientId || (isListOpen && sizeClass === 'expanded')) && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, width: 0, paddingRight: 0 }}
                    animate={{ 
                      opacity: 1, 
                      width: isSplitLayout ? '16.666667%' : '100%',
                      paddingRight: isSplitLayout ? 24 : 0
                    }}
                    exit={{ opacity: 0, width: 0, paddingRight: 0 }}
                    transition={transition.standard}
                    className={`flex flex-col min-w-0 transition-none overflow-hidden ${isSplitLayout ? 'border-r border-border' : ''}`}
                  >
                    <PatientExplorer 
                      onSelectPatient={selectPatient} 
                      onAddNew={startOnboarding} 
                      compact={isCompactList}
                      selectedId={viewState.selectedPatientId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Detail Pane - Logic based on viewState */}
              <AnimatePresence mode="wait">
                {viewState.subView === 'detail' && viewState.selectedPatientId && (
                  <motion.div 
                    key={`detail-${viewState.selectedPatientId}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={transition.entrance}
                    className="flex-1 min-w-0 overflow-hidden"
                  >
                    <ClinicalRecords 
                      patientId={viewState.selectedPatientId} 
                      onBack={() => setViewState({ subView: 'explorer', selectedPatientId: null })}
                      showBackButton={sizeClass !== 'expanded'}
                    />
                  </motion.div>
                )}

                {viewState.subView === 'onboarding' && (
                  <motion.div 
                    key="onboarding"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={transition.entrance}
                    className="flex-1 overflow-hidden"
                  >
                    <PatientIntake 
                      onComplete={(id) => setViewState({ subView: 'detail', selectedPatientId: id })}
                      onCancel={() => setViewState({ subView: 'explorer', selectedPatientId: null })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
        
        {currentModule === 'scheduling' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <AppointmentsDashboard />
          </div>
        )}

        {currentModule === 'roster' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SchedulingOperatorConsole />
          </div>
        )}

        {currentModule === 'messages' && (
          <div className="flex-1 min-h-0 overflow-hidden h-full">
            <MessagesModule />
          </div>
        )}

        {currentModule === 'health-record' && (
          <div className="flex-1 min-h-0 overflow-auto h-full">
            <ClinicalRecords 
              patientId={userProfile?.patientId || userProfile?.id || 'p-1'} 
              showBackButton={false} 
            />
          </div>
        )}

        {currentModule === 'care-network' && (
          <div className="flex-1 min-h-0 overflow-hidden h-full">
            <CareNetworkGraph />
          </div>
        )}

        {currentModule === 'billing' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <BillingDashboard />
          </div>
        )}

        {currentModule === 'care-team' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <NurseWorkflow />
          </div>
        )}

        {currentModule === 'frontdesk' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <FrontDeskConsole onRegisterPatient={() => {
              setCurrentModule('patients');
              startOnboarding();
            }} />
          </div>
        )}

        {currentModule === 'governance' && (
          <div className="flex-1 min-h-0 overflow-hidden h-full">
            <AdminGovernanceConsole />
          </div>
        )}

        {currentModule === 'settings' && (
          <div className="flex-1 min-h-0 overflow-auto h-full">
            <Settings />
          </div>
        )}

        {currentModule === 'profile' && userProfile && (
          <div className="flex-1 min-h-0 overflow-auto h-full">
            <ProfileEditor 
              initialProfile={userProfile} 
              onSave={async (updated) => {
                await saveUserProfile(userProfile.id, updated);
                // Also update local storage session to ensure sync
                const currentSession = localStorage.getItem('careplus_current_user');
                if (currentSession) {
                  const parsed = JSON.parse(currentSession);
                  localStorage.setItem('careplus_current_user', JSON.stringify({
                    ...parsed,
                    displayName: updated.displayName,
                    email: updated.email,
                    phone: updated.phone,
                    department: updated.department,
                    npiNumber: updated.npiNumber,
                    bio: updated.bio
                  }));
                }
                refreshProfile();
              }}
              onCancel={() => setCurrentModule('dashboard')}
            />
          </div>
        )}
      </Shell>
      </HIPAAMonitorProvider>
    </EventStoreProvider>
  );
}
