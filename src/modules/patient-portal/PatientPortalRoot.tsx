import { useState } from 'react';
import { HealthBoard } from './views/HealthBoard';
import { MyHealthScore } from './views/MyHealthScore';
import { WellnessClasses } from './views/WellnessClasses';
import { MyConsultations } from './views/MyConsultations';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { useQueryModel } from '../../store/eventStore';

type PortalView = 'board' | 'health-score' | 'classes' | 'consultations';

export function PatientPortalRoot() {
  const [activeTab, setActiveTab ] = useState<PortalView>('board');
  const { userProfile } = useCurrentUser();
  const patientId = userProfile?.patientId || (userProfile?.role === 'patient' && userProfile?.patientId) || 'pat-marcus-001';
  const patientData = usePatientClinicalData(patientId);
  const { appointments } = useQueryModel();

  return (
    <div className="flex flex-col h-full bg-[#FAFCFB] overflow-hidden">
      
      {/* Sticky Tab Navigation Array */}
      <div className="shrink-0 border-b border-[#EBEFEA] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex gap-8">
          <button 
            onClick={() => setActiveTab('board')}
            className={`py-5 text-sm font-bold tracking-wide transition-colors border-b-4 cursor-pointer ${activeTab === 'board' ? 'border-[#7A9876] text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            My Health Board
          </button>
          <button 
            onClick={() => setActiveTab('health-score')}
            className={`py-5 text-sm font-bold tracking-wide transition-colors border-b-4 cursor-pointer ${activeTab === 'health-score' ? 'border-[#7A9876] text-[#2C3E2D] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            My Health Score
          </button>
          <button 
            onClick={() => setActiveTab('consultations')}
            className={`py-5 text-sm font-bold tracking-wide transition-colors border-b-4 cursor-pointer ${activeTab === 'consultations' ? 'border-[#7A9876] text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            My Consultation Notes
          </button>
          <button 
            onClick={() => setActiveTab('classes')}
            className={`py-5 text-sm font-bold tracking-wide transition-colors border-b-4 cursor-pointer ${activeTab === 'classes' ? 'border-[#7A9876] text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Classes & Wellness
          </button>
        </div>
      </div>

      {/* Scrollable Isolated View Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'board' && (
          <HealthBoard 
            patientData={patientData} 
            appointments={Object.values(appointments)} 
            onNavigateTab={(tab) => {
              if (tab === 'simulator') {
                setActiveTab('health-score');
              } else {
                setActiveTab(tab as PortalView);
              }
            }} 
          />
        )}
        {activeTab === 'health-score' && <MyHealthScore patientData={patientData} />}
        {activeTab === 'consultations' && <MyConsultations patientData={patientData} />}
        {activeTab === 'classes' && <WellnessClasses />}
      </div>
    </div>
  );
}

export default PatientPortalRoot;
