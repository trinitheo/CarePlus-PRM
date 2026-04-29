import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
    clinical_records: [],
    prescriptions: [],
    investigations: [],
    procedures: [],
    referrals: [],
    vitals: [],
    loading: true,
  });

  useEffect(() => {
    if (!patientId) return;

    let unsubscribers: (() => void)[] = [];

    // Wait for auth to be ready
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // Cleanup existing listeners if auth changes
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      if (!user) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const collections = [
        'clinical_records',
        'prescriptions',
        'investigations',
        'procedures',
        'referrals',
        'vitals',
      ];

      unsubscribers = collections.map((colName) => {
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
            handleFirestoreError(error, OperationType.GET, path);
            setData(prev => ({ ...prev, loading: false }));
          }
        );
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [patientId]);

  return data;
}
