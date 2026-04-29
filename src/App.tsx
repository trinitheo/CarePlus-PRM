import { useState, useMemo, useEffect } from 'react';
import { EventStoreProvider } from './store/eventStore';
import { Shell } from './components/Layout';
import { ClinicalRecords } from './domains/clinical-records/ClinicalRecords';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { PatientExplorer } from './domains/patient-management/PatientExplorer';
import { PatientIntake } from './domains/patient-intake/PatientIntake';
import { Activity, ChevronRight, User } from 'lucide-react';
import { useWindowSizeClass } from './hooks/useAdaptiveWidth';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const sizeClass = useWindowSizeClass();
  const [currentModule, setCurrentModule] = useState('patients');

  useEffect(() => {
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

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
    if (module === 'patients') {
      setViewState({ subView: 'explorer', selectedPatientId: null });
    }
  };

  const selectPatient = (id: string) => {
    setViewState({ subView: 'detail', selectedPatientId: id });
  };

  const startOnboarding = () => {
    setViewState({ subView: 'onboarding', selectedPatientId: null });
  };

  // Adaptive logic: On Expanded screens, we use a split layout in the Patients module IF a sub-view is active
  const isDetailOrOnboarding = viewState.subView === 'detail' || viewState.subView === 'onboarding';
  const isSplitLayout = sizeClass === 'expanded' && currentModule === 'patients' && isDetailOrOnboarding;
  const isCompactList = isSplitLayout;

  return (
    <EventStoreProvider>
      <Shell currentModule={currentModule} onNavigate={handleNavigate}>
        {currentModule === 'patients' && (
          <div className="h-full flex flex-col min-w-0">
            {/* Context Breadcrumb - Adaptive Visibility */}
            <div className="flex items-center gap-2 mb-6 text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/30 w-fit px-3 py-1 rounded-full border border-border/50">
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

            <div className="flex-1 flex gap-6 min-h-0">
              {/* List Pane - Always visible on Expanded, or visible on Explorer view for others */}
              {(sizeClass === 'expanded' || viewState.subView === 'explorer') && (
                <motion.div 
                  layout
                  className={`flex flex-col min-w-0 transition-all duration-500 ${isSplitLayout ? 'w-1/5 border-r border-border pr-6' : 'w-full'}`}
                >
                  <PatientExplorer 
                    onSelectPatient={selectPatient} 
                    onAddNew={startOnboarding} 
                    compact={isCompactList}
                    selectedId={viewState.selectedPatientId}
                  />
                </motion.div>
              )}

              {/* Detail Pane - Logic based on viewState */}
              <AnimatePresence mode="wait">
                {viewState.subView === 'detail' && viewState.selectedPatientId && (
                  <motion.div 
                    key={`detail-${viewState.selectedPatientId}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
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
    </EventStoreProvider>
  );
}
