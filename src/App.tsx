import { useState, useMemo, useEffect } from 'react';
import { EventStoreProvider } from './store/eventStore';
import { HIPAAMonitorProvider } from './hooks/useHIPAAMonitor';
import { Shell } from './components/Layout';
import { ClinicalRecords } from './domains/clinical-records/ClinicalRecords';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { PatientExplorer } from './domains/patient-management/PatientExplorer';
import { PatientIntake } from './domains/patient-intake/PatientIntake';
import { Activity, ChevronRight, User, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useWindowSizeClass } from './hooks/useAdaptiveWidth';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from './lib/motion';

export default function App() {
  const sizeClass = useWindowSizeClass();
  const [currentModule, setCurrentModule] = useState('patients');
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Ensure user is signed in for Firestore operations if possible
    const login = async () => {
      try {
        if (!auth.currentUser) {
          // Check if anonymous auth is likely available (not usually possible via JS, so we just try/catch)
          await signInAnonymously(auth);
          console.log('Signed in anonymously');
        }
      } catch (error: any) {
        // If anonymous auth is disabled in console, we'll see admin-restricted-operation
        if (error?.code === 'auth/admin-restricted-operation') {
          console.warn('Anonymous Auth is disabled in Firebase Console. Please enable it under Auth > Sign-in Method to track specific authored records.');
        } else {
          console.error('Auth error:', error);
        }
      } finally {
        setIsAuthReady(true);
      }
    };
    login();

    async function testFirestoreConnection() {
      try {
        await getDocFromServer(doc(db, '_diagnostics', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firebase is offline. Check configuration.");
        }
      }
    }
    testFirestoreConnection();
  }, []);
  const [viewState, setViewState] = useState<{
    subView: 'explorer' | 'detail' | 'onboarding';
    selectedPatientId: string | null;
  }>({
    subView: 'explorer',
    selectedPatientId: null
  });

  const [isListOpen, setIsListOpen] = useState(true);

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
    if (module === 'patients') {
      setViewState({ subView: 'explorer', selectedPatientId: null });
      setIsListOpen(true);
    }
  };

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
                {(viewState.subView === 'explorer' || (isListOpen && sizeClass === 'expanded')) && (
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
        
        {/* Module Sandbox Placeholder */}
        {['scheduling', 'billing', 'care-team'].includes(currentModule) && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-8">
              <Activity className="h-12 w-12 text-primary/20" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Module Sandbox</h2>
            <p className="text-sm mt-2 max-w-sm text-center opacity-60 leading-relaxed">
              The <span className="font-bold text-foreground">{currentModule.replace('-', ' ')}</span> module is part of the next development phase in the Precision Health roadmap.
            </p>
          </div>
        )}
      </Shell>
      </HIPAAMonitorProvider>
    </EventStoreProvider>
  );
}
