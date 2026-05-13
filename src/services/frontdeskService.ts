import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './clinicalFirestoreService';

export async function checkInPatient(patientId: string, appointmentId: string) {
  // 1. Create check-in record
  await addDoc(collection(db, 'checkins'), {
    patientId,
    appointmentId,
    arrivalTime: serverTimestamp(),
    insuranceVerified: false,
    status: 'arrived',
    createdAt: serverTimestamp()
  });

  // 2. Update appointment status
  const apptRef = doc(db, 'appointments', appointmentId);
  await updateDoc(apptRef, {
    status: 'checked_in',
    updatedAt: serverTimestamp()
  });
}

export async function signConsent(patientId: string, type: string, documentUrl?: string) {
  await addDoc(collection(db, 'consents'), {
    patientId,
    type,
    signedAt: serverTimestamp(),
    documentUrl: documentUrl || '',
    createdAt: serverTimestamp()
  });
}
