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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#EBF5FF] via-[#F5F9FD] to-[#FFFFFF] overflow-y-auto">
      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto pb-28">
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
