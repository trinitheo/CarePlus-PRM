import { useState } from 'react';
import { HealthBoard } from './views/HealthBoard';
import Home2 from './views/Home2';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { useQueryModel } from '../../store/eventStore';

type PortalView = 'board' | 'home2';

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
        <div className="w-full px-6 flex gap-8">
          <button 
            onClick={() => setActiveTab('board')}
            className={`py-5 text-sm font-bold tracking-wide transition-colors border-b-4 cursor-pointer ${activeTab === 'board' ? 'border-[#7A9876] text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            My Health Board
          </button>
          <button 
            onClick={() => setActiveTab('home2')}
            className={`py-5 text-sm font-bold tracking-wide transition-colors border-b-4 cursor-pointer ${activeTab === 'home2' ? 'border-[#7A9876] text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Home 2
          </button>
        </div>
      </div>

      {/* Scrollable Isolated View Container */}
      <div className="flex-1 overflow-y-auto p-6 w-full">
        {activeTab === 'board' && (
          <HealthBoard 
            patientData={patientData} 
            appointments={Object.values(appointments)} 
            onNavigateTab={(tab) => {
              if (tab !== 'simulator' && (tab === 'board' || tab === 'home2')) {
                setActiveTab(tab as PortalView);
              }
            }} 
          />
        )}
        {activeTab === 'home2' && <Home2 />}
      </div>
    </div>
  );
}

export default PatientPortalRoot;
