import { useState, useEffect } from 'react';
import { mockDb, mockDbService } from '../lib/mockDatabase';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';

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

    // 1. Instantly populate using the local mock database for rapid visual feedback
    const collectionsList = [
      'clinical_intakes',
      'clinical_records',
      'prescriptions',
      'investigations',
      'procedures',
      'referrals',
      'vitals',
      'interactions',
      'care_teams'
    ] as const;

    const initialPatientDoc = mockDbService.getDoc('patients', patientId);
    const initialColData: any = {};
    collectionsList.forEach(col => {
      initialColData[col] = mockDbService.getCollection(col as any, patientId);
    });

    setData(prev => ({
      ...prev,
      patient: initialPatientDoc || prev.patient,
      ...initialColData,
      loading: false
    }));

    // 2. Establish real-time Firestore listeners to synchronize with any writes
    const unsubscribes: (() => void)[] = [];

    // Real-time listener for the Patient details
    const patientDocRef = doc(db, 'patients', patientId);
    const unsubPatient = onSnapshot(patientDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const firestorePatientData = { id: docSnap.id, ...docSnap.data() };
        setData(prev => ({
          ...prev,
          patient: {
            ...prev.patient,
            ...firestorePatientData
          }
        }));
      }
    }, (error) => {
      console.warn("Firestore patient record query error, using offline database:", error);
    });
    unsubscribes.push(unsubPatient);

    // Set up real-time subcollectors for all clinical domains
    collectionsList.forEach(colName => {
      const subColRef = collection(db, 'patients', patientId, colName);
      const unsubSubcol = onSnapshot(subColRef, (snap) => {
        const items = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        setData(prev => {
          const offlineItems = mockDbService.getCollection(colName as any, patientId) || [];
          
          // Merge items, giving live Firestore precedence on matching IDs
          const liveIds = new Set(items.map(i => i.id));
          const uniqueOffline = offlineItems.filter(i => !liveIds.has(i.id));
          const combined = [...items, ...uniqueOffline];

          return {
            ...prev,
            [colName]: combined
          };
        });
      }, (error) => {
        console.warn(`Firestore subcollection '${colName}' snapshot fallback to offline cache:`, error);
      });
      unsubscribes.push(unsubSubcol);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [patientId]);

  return data;
}
