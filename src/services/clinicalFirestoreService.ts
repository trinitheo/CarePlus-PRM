import { db, auth } from '../lib/firebase';
import { mockDbService, MockDb } from '../lib/mockDatabase';
export { db, auth };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export async function getPatientById(patientId: string) {
  return mockDbService.getDoc('patients', patientId);
}

// User Management
export async function saveUserProfile(userId: string, data: any) {
  return mockDbService.updateItem('users', userId, data);
}

export async function getUserProfile(userId: string) {
  return mockDbService.getDoc('users', userId);
}

// Care Team Management
export async function addToCareTeam(patientId: string, userId: string, data: any) {
  // Logic simplified for mock
  return mockDbService.addItem('care_teams' as any, { ...data, userId, patientId }, patientId);
}

export async function removeFromCareTeam(patientId: string, userId: string) {
  // Logic simplified for mock
}

// SOAP Notes
export async function saveSOAPNote(patientId: string, data: any) {
  return mockDbService.addItem('clinical_records', data, patientId);
}

export async function updatePatientConditions(patientId: string, conditions: string[]) {
  const patient = mockDbService.getDoc('patients', patientId);
  if (patient) {
    mockDbService.updateItem('patients', patientId, {
      conditions: Array.from(new Set([...(patient.conditions || []), ...conditions]))
    });
  }
}

export async function updateSOAPNote(patientId: string, noteId: string, data: any) {
  return mockDbService.updateItem('clinical_records', noteId, data, patientId);
}

// Prescriptions
export async function savePrescription(patientId: string, data: any) {
  return mockDbService.addItem('prescriptions', data, patientId);
}

export async function deletePrescription(patientId: string, prescriptionId: string) {
  // Logic simplified for mock
}

export async function updatePrescriptionStatus(patientId: string, prescriptionId: string, status: string, reason?: string) {
  return mockDbService.updateItem('prescriptions', prescriptionId, { status, reason }, patientId);
}

export async function updatePrescriptionAdherence(patientId: string, prescriptionId: string, status: string, score: number) {
  return mockDbService.updateItem('prescriptions', prescriptionId, { adherenceStatus: status, adherenceScore: score }, patientId);
}

// Investigations
export async function saveInvestigation(patientId: string, data: any) {
  return mockDbService.addItem('investigations', data, patientId);
}

export async function updateInvestigation(patientId: string, investigationId: string, data: any) {
  return mockDbService.updateItem('investigations', investigationId, data, patientId);
}

// Procedures
export async function saveProcedure(patientId: string, data: any) {
  return mockDbService.addItem('procedures', data, patientId);
}

// Referrals
export async function saveReferral(patientId: string, data: any) {
  return mockDbService.addItem('referrals', data, patientId);
}

// Patient Registration
export async function savePatient(patientId: string, data: any) {
  // Ensure we create a User record for the patient as requested
  const userExists = mockDbService.getDoc('users', patientId);
  if (!userExists) {
    await mockDbService.updateItem('users', patientId, {
      id: patientId,
      email: data.email || `${patientId}@patient.precisionhealth.care`,
      displayName: data.name || `${data.firstName} ${data.lastName}`,
      role: 'patient',
      createdAt: data.createdAt || new Date().toISOString()
    });
  }
  return mockDbService.updateItem('patients', patientId, data);
}

/**
 * Provisions a specific patient record for demo purposes: Sarah Mitchell
 * Already in mockDb, so just returns ID
 */
export async function provisionSarahMitchell() {
  return 'sarah-mitchell-42';
}

// Clinical Intake
export async function saveClinicalIntake(patientId: string, intakeId: string, data: any) {
  return mockDbService.updateItem('clinical_intakes', intakeId, data, patientId);
}

// Vitals
export async function updatePatientVitals(patientId: string, data: any) {
  return mockDbService.addItem('vitals', data, patientId);
}

export async function updatePatientStatus(patientId: string, status: string) {
  return mockDbService.updateItem('patients', patientId, { status });
}

// Interactions
export async function saveInteraction(patientId: string, data: any) {
  return mockDbService.addItem('interactions', data, patientId);
}

// Appointments
export async function saveAppointment(data: any) {
  return mockDbService.addItem('appointments', data);
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  return mockDbService.updateItem('appointments', appointmentId, { status });
}

export async function getUpcomingAppointments() {
  return mockDbService.getCollection('appointments');
}

export function subscribeToCollection(path: keyof MockDb, callback: (data: any[]) => void, patientId?: string) {
  // One-shot fetch for mock
  const data = mockDbService.getCollection(path, patientId);
  callback(data);
  
  // Simulation of "real-time" if needed, but for now simple sync
  return () => {};
}

// Dashboards & Operations
export async function completeCourtesyCall(taskId: string, notes: string) {
  // Mock logic
}

export async function markMessageRead(messageId: string) {
  // Mock logic
}

export async function createReminder(data: any) {
  return mockDbService.addItem('reminders' as any, data);
}

export async function completeReminder(reminderId: string) {
  // Mock logic
}

export async function updateUserDashboardSettings(userId: string, settings: any) {
  return mockDbService.updateItem('users', userId, { dashboardSettings: settings });
}
