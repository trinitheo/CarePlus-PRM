import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType } from '../services/clinicalFirestoreService';

export function usePatientClinicalData(patientId: string) {
  const [data, setData] = useState({
    clinical_records: [],
    prescriptions: [],
    investigations: [],
    procedures: [],
    referrals: [],
    loading: true,
  });

  useEffect(() => {
    if (!patientId) return;

    const collections = [
      'clinical_records',
      'prescriptions',
      'investigations',
      'procedures',
      'referrals',
    ];

    const unsubscribers = collections.map((colName) => {
      const q = query(
        collection(db, `patients/${patientId}/${colName}`),
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
          }));
        },
        (error) => {
          console.error(`Error fetching ${colName}:`, error);
        }
      );
    });

    setData((prev) => ({ ...prev, loading: false }));

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [patientId]);

  return data;
}
