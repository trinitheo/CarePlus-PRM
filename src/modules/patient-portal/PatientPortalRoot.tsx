import { HealthBoard } from './views/HealthBoard';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePatientClinicalData } from '../../hooks/usePatientClinicalData';
import { useQueryModel } from '../../store/eventStore';

interface PatientPortalRootProps {
  onNavigateTab?: (tab: string) => void;
}

export function PatientPortalRoot({ onNavigateTab }: PatientPortalRootProps) {
  const { userProfile } = useCurrentUser();
  const patientId = userProfile?.patientId || (userProfile?.role === 'patient' && userProfile?.patientId) || 'pat-marcus-001';
  const patientData = usePatientClinicalData(patientId);
  const { appointments } = useQueryModel();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#EBF5FF] via-[#F5F9FD] to-[#FFFFFF] overflow-y-auto">
      <div 
        className="flex-1 mx-auto pb-28" 
        style={{ 
          width: '1100px', 
          maxWidth: '100%',
          paddingLeft: '5px', 
          paddingRight: '5px', 
          paddingTop: '24px', 
          paddingBottom: '20px' 
        }}
      >
        <HealthBoard 
          patientData={patientData} 
          appointments={Object.values(appointments)} 
          onNavigateTab={onNavigateTab} 
        />
      </div>
    </div>
  );
}

export default PatientPortalRoot;
