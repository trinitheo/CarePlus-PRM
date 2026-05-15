import { useState, useEffect } from 'react';
import { mockDb, mockDbService } from '../lib/mockDatabase';

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

    // Simulate loading
    const timer = setTimeout(() => {
      const collections = [
        'clinical_intakes',
        'clinical_records',
        'prescriptions',
        'investigations',
        'procedures',
        'referrals',
        'vitals',
        'interactions',
      ];

      const patient = mockDbService.getDoc('patients', patientId);
      
      const colData: any = {};
      collections.forEach(col => {
        colData[col] = mockDbService.getCollection(col as any, patientId);
      });

      setData({
        patient: patient || { conditions: [] },
        ...colData,
        care_teams: [], // Mock as empty or add to mockDb if needed
        loading: false,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [patientId]);

  return data;
}
