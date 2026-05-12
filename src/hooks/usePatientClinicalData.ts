import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OperationType } from '../services/clinicalFirestoreService';

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't necessarily want to throw here as it's a hook, but we log it correctly for the system
}

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

    let unsubscribers: (() => void)[] = [];

    const setupListeners = () => {
      // Cleanup existing listeners
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      // 1. Listen to the patient document itself for attributes like "conditions"
      const patientDocRef = doc(db, 'patients', patientId);
      const unsubPatient = onSnapshot(patientDocRef, (doc) => {
        if (doc.exists()) {
          setData(prev => ({
            ...prev,
            patient: { id: doc.id, ...doc.data() } as any
          }));
        }
      });
      unsubscribers.push(unsubPatient);

      const collections = [
        'clinical_intakes',
        'clinical_records',
        'prescriptions',
        'investigations',
        'procedures',
        'referrals',
        'vitals',
        'interactions',
        'care_teams',
      ];

      const collectionUnsubs = collections.map((colName) => {
        const path = `patients/${patientId}/${colName}`;
        const q = query(
          collection(db, path),
          orderBy('createdAt', 'desc')
        );

        return onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setData((prev) => ({
              ...prev,
              [colName]: items,
              loading: false,
            }));
          },
          (error) => {
            // Silently handle permission errors for restricted sub-collections
            // The UI will handle the !isAuthorized state based on care_teams data
            setData((prev) => ({
              ...prev,
              [colName]: [],
              loading: false,
            }));
            
            // Still log for debugging if it's not a permission error
            if (!error.message.includes('permissions')) {
              handleFirestoreError(error, OperationType.GET, path);
            }
          }
        );
      });
      unsubscribers.push(...collectionUnsubs);
    };

    // Initialize listeners immediately
    setupListeners();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [patientId]);

  return data;
}
