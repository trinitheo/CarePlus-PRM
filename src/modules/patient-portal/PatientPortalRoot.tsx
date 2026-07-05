import { HealthBoard } from './views/HealthBoard';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { useQueryModel } from '../../store/eventStore';

export function PatientPortalRoot() {
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
            className="py-5 text-sm font-extrabold tracking-wide border-b-4 border-[#7A9876] text-slate-900 cursor-default"
          >
            My Health Board
          </button>
        </div>
      </div>

      {/* Scrollable Isolated View Container */}
      <div className="flex-1 overflow-y-auto p-6 w-full">
        <HealthBoard 
          patientData={patientData} 
          appointments={Object.values(appointments)} 
          onNavigateTab={() => {}} 
        />
      </div>
    </div>
  );
}

export default PatientPortalRoot;
