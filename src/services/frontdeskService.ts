import { clinicalService } from './clinicalFirestoreService';

export async function checkInPatient(patientId: string, appointmentId: string) {
  await clinicalService.addItem('checkins', {
    patientId,
    appointmentId,
    arrivalTime: { seconds: Math.floor(Date.now() / 1000) },
    insuranceVerified: false,
    status: 'arrived'
  });

  await clinicalService.updateItem('appointments', appointmentId, {
    status: 'checked_in'
  });
}

export async function signConsent(patientId: string, type: string, documentUrl?: string) {
  await clinicalService.addItem('consents', {
    patientId,
    type,
    signedAt: { seconds: Math.floor(Date.now() / 1000) },
    documentUrl: documentUrl || ''
  });
}

