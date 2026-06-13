import { useState, useEffect } from 'react';
import { subscribeToPatientData } from '../services/clinicalFirestoreService';

export function usePatientClinicalData(patientId: string) {
  const [data, setData] = useState({
    patient: { conditions: [] } as any,
    clinical_intakes: [],
    clinical_records: [],
    prescriptions: [],
    investigations: [],
    procedures: [],
    referrals: [],
    vitals: [],
    interactions: [],
    care_teams: [],
    loading: true,
  });

  useEffect(() => {
    if (!patientId) return;

    // Call the single, unified implementation-agnostic subscription endpoint
    const unsub = subscribeToPatientData(patientId, (updatedDocs) => {
      setData({
        patient: updatedDocs.patient || { conditions: [] },
        clinical_intakes: updatedDocs.clinical_intakes || [],
        clinical_records: updatedDocs.clinical_records || [],
        prescriptions: updatedDocs.prescriptions || [],
        investigations: updatedDocs.investigations || [],
        procedures: updatedDocs.procedures || [],
        referrals: updatedDocs.referrals || [],
        vitals: updatedDocs.vitals || [],
        interactions: updatedDocs.interactions || [],
        care_teams: updatedDocs.care_teams || [],
        loading: false
      });
    });

    return () => {
      unsub();
    };
  }, [patientId]);

  return data;
}

