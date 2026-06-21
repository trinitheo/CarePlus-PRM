import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PatientDemographics } from '../types/patientDemographics';

export async function getDemographics(patientId: string): Promise<PatientDemographics | null> {
  try {
    const snap = await getDoc(doc(db, 'patients', patientId));
    return snap.exists() ? (snap.data() as PatientDemographics) : null;
  } catch (err) {
    console.error("Failed to get demographics", err);
    return null;
  }
}

export async function getClinicalRecords(patientId: string) {
  try {
    const q = query(
      collection(db, 'patients', patientId, 'clinical_records'),
      orderBy('timestamp', 'desc')
    );
    const sn = await getDocs(q);
    return sn.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Failed to get clinical records", err);
    return [];
  }
}
