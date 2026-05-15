import { mockDbService } from '../lib/mockDatabase';

export async function checkInPatient(patientId: string, appointmentId: string) {
  mockDbService.addItem('checkins', {
    patientId,
    appointmentId,
    arrivalTime: { seconds: Math.floor(Date.now() / 1000) },
    insuranceVerified: false,
    status: 'arrived'
  });

  mockDbService.updateItem('appointments', appointmentId, {
    status: 'checked_in'
  });
}

export async function signConsent(patientId: string, type: string, documentUrl?: string) {
  mockDbService.addItem('consents', {
    patientId,
    type,
    signedAt: { seconds: Math.floor(Date.now() / 1000) },
    documentUrl: documentUrl || ''
  });
}
