import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { mockDbService, MockDb } from '../lib/mockDatabase';

export { db, auth };

export async function resetAppToNewInstall() {
  const collectionsToWipe = ['users', 'roles', 'appointments', 'messages', 'audit_logs', 'clinical_records', 'registered_users'];
  
  // Wipe standard collections
  for (const collName of collectionsToWipe) {
    try {
      const qSnap = await getDocs(collection(db, collName));
      const deletePromises = qSnap.docs.map(docSnap => deleteDoc(doc(db, collName, docSnap.id)));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn(`Could not wipe collection ${collName} in Firestore:`, e);
    }
  }

  // Wipe patients & their nested subcollections
  try {
    const patientsSnap = await getDocs(collection(db, 'patients'));
    for (const pDoc of patientsSnap.docs) {
      const subColls = ['care_teams', 'clinical_records', 'prescriptions', 'investigations', 'procedures'];
      for (const sub of subColls) {
        try {
          const subSnap = await getDocs(collection(db, 'patients', pDoc.id, sub));
          const subPromises = subSnap.docs.map(subDoc => deleteDoc(doc(db, 'patients', pDoc.id, sub, subDoc.id)));
          await Promise.all(subPromises);
        } catch (_) {}
      }
      await deleteDoc(doc(db, 'patients', pDoc.id));
    }
  } catch (e) {
    console.warn("Could not wipe patients collection or subcollections in Firestore:", e);
  }

  // Clear system sessions
  localStorage.clear();
  sessionStorage.clear();

  // Sign out from Firebase Auth
  try {
    await auth.signOut();
  } catch (err) {
    console.warn("Sign out during raw reset failed:", err);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getPatientById(patientId: string) {
  return mockDbService.getDoc('patients', patientId);
}

/**
 * Sanitizes data for Firestore by removing undefined values and ensuring nested objects are handled.
 */
function sanitizeData(data: any): any {
  if (data === null || data === undefined) return null;
  
  // Handle Date objects explicitly if they are used
  if (data instanceof Date) return data.toISOString();
  
  if (typeof data !== 'object') return data;
  
  if (Array.isArray(data)) return data.map(v => sanitizeData(v));
  
  // Handle plain objects
  const sanitized: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        const sanitizedValue = sanitizeData(value);
        if (sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      }
    }
  }
  return sanitized;
}

// User Management
export async function saveUserProfile(userId: string, data: any) {
  // Sync to real Firestore so security rules can see the user's role
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'users', userId), {
      ...sanitized,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Failed to sync user profile to Firestore:', e);
  }
  return mockDbService.updateItem('users', userId, data);
}

export async function getUserProfile(userId: string) {
  return mockDbService.getDoc('users', userId);
}

// Care Team Management
export async function addToCareTeam(patientId: string, userId: string, data: any) {
  // Sync to real Firestore to enable isCareTeamMember rules
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'patients', patientId, 'care_teams', userId), {
      ...sanitized,
      userId,
      patientId,
      status: 'active',
      joinedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to sync care team member to Firestore:', e);
  }
  return mockDbService.addItem('care_teams' as any, { ...data, userId, patientId }, patientId);
}

export async function removeFromCareTeam(patientId: string, userId: string) {
  // Logic simplified for mock
}

// SOAP Notes
export async function saveSOAPNote(patientId: string, data: any) {
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'patients', patientId, 'clinical_records', data.id || `soap-${Date.now()}`), {
      ...sanitized,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to sync SOAP note:', e);
  }
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
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'patients', patientId, 'prescriptions', data.id || `rx-${Date.now()}`), {
      ...sanitized,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to sync prescription:', e);
  }
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
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'patients', patientId, 'investigations', data.id || `inv-${Date.now()}`), {
      ...sanitized,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to sync investigation:', e);
  }
  return mockDbService.addItem('investigations', data, patientId);
}

export async function updateInvestigation(patientId: string, investigationId: string, data: any) {
  return mockDbService.updateItem('investigations', investigationId, data, patientId);
}

// Procedures
export async function saveProcedure(patientId: string, data: any) {
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'patients', patientId, 'procedures', data.id || `proc-${Date.now()}`), {
      ...sanitized,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to sync procedure:', e);
  }
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
  
  // Sync to real Firestore
  try {
    const sanitized = sanitizeData(data);
    await setDoc(doc(db, 'patients', patientId), {
      ...sanitized,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Patient sync error:', e);
  }
  
  return mockDbService.updateItem('patients', patientId, data);
}

export async function updateAuthorizedUsers(patientId: string, authorizedUserIds: string[]) {
  try {
    const patientRef = doc(db, 'patients', patientId);
    await setDoc(patientRef, {
      authorizedUserIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Failed to sync authorized users to Firestore:', e);
  }
  return mockDbService.updateItem('patients', patientId, { authorizedUserIds });
}

/**
 * Provisions a specific patient record for demo purposes: Sarah Mitchell
 * Already in mockDb, so just returns ID
 */
export async function provisionSarahMitchell() {
  const patientId = 'sarah-mitchell-42';
  try {
    const existing = await getDoc(doc(db, 'patients', patientId));
    if (!existing.exists()) {
      const patientData = mockDbService.getDoc('patients', patientId);
      if (patientData) {
        const sanitized = sanitizeData(patientData);
        await setDoc(doc(db, 'patients', patientId), {
          ...sanitized,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (e) {
    console.error('Failed to provision Sarah Mitchell in Firestore:', e);
  }
  return patientId;
}

// Clinical Intake
export async function saveClinicalIntake(patientId: string, intakeId: string, data: any) {
  return mockDbService.updateItem('clinical_intakes', intakeId, data, patientId);
}

// Vitals
export async function updatePatientVitals(patientId: string, data: any) {
  try {
    const sanitized = sanitizeData(data);
    await addDoc(collection(db, 'patients', patientId, 'vitals'), {
      ...sanitized,
      timestamp: data.timestamp || Date.now()
    });
  } catch (e) {
    console.error('Failed to write vitals to Firestore:', e);
  }
  return mockDbService.addItem('vitals', data, patientId);
}

export async function updatePatientNudgeAndActionPlan(patientId: string, activeNudge: any, actionPlan: any[]) {
  try {
    const sanitizedNudge = sanitizeData(activeNudge);
    const sanitizedPlan = sanitizeData(actionPlan);
    await setDoc(doc(db, 'patients', patientId), {
      activeNudge: sanitizedNudge,
      actionPlan: sanitizedPlan,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Failed to update patient activeNudge and actionPlan in Firestore:', e);
  }
  return mockDbService.updateItem('patients', patientId, { activeNudge, actionPlan });
}

export function computeHealthScore(factors: {
  medsDays?: number;
  sleepHours?: number;
  dailySteps?: number;
  bloodGlucose?: number;
  aiGoalsCompleted?: boolean;
  willAttend?: boolean;
}) {
  const baseScore = 72;
  let medsContribution = 0;
  let sleepContribution = 0;
  let stepsContribution = 0;
  let glucoseContribution = 0;
  let aiContribution = 0;
  let appointmentContribution = 0;

  const medsDays = typeof factors.medsDays === 'number' ? factors.medsDays : 5;
  const sleepHours = typeof factors.sleepHours === 'number' ? factors.sleepHours : 7.6;
  const dailySteps = typeof factors.dailySteps === 'number' ? factors.dailySteps : 8420;
  const bloodGlucose = typeof factors.bloodGlucose === 'number' ? factors.bloodGlucose : 104;
  const aiGoalsCompleted = typeof factors.aiGoalsCompleted === 'boolean' ? factors.aiGoalsCompleted : true;
  const willAttend = typeof factors.willAttend === 'boolean' ? factors.willAttend : true;

  // 1. Medication compliance (Max +8, or -4 below 4 days)
  if (medsDays === 7) medsContribution = 8;
  else if (medsDays >= 5) medsContribution = 5;
  else if (medsDays >= 3) medsContribution = 1;
  else medsContribution = -4;

  // 2. Sleep duration (Max +6 for 7-9 hours, penalty drops below 6.5)
  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepContribution = 6;
  } else if (sleepHours >= 6 && sleepHours < 7) {
    sleepContribution = 2;
  } else if (sleepHours > 9) {
    sleepContribution = 3;
  } else {
    sleepContribution = -3;
  }

  // 3. Daily Steps (Max +8 for >= 8000 steps, step counts below 4000 get 0 or negative)
  if (dailySteps >= 9000) stepsContribution = 8;
  else if (dailySteps >= 8000) stepsContribution = 7;
  else if (dailySteps >= 7000) stepsContribution = 6;
  else if (dailySteps >= 5000) stepsContribution = 3;
  else if (dailySteps >= 3000) stepsContribution = 1;
  else stepsContribution = -2;

  // 4. Blood Glucose level (Target is 75 to 125 mg/dL for +8, severe penalty high/low)
  if (bloodGlucose >= 75 && bloodGlucose <= 125) {
    glucoseContribution = 8;
  } else if (bloodGlucose >= 126 && bloodGlucose <= 150) {
    glucoseContribution = 3;
  } else if (bloodGlucose > 150) {
    glucoseContribution = -5;
  } else if (bloodGlucose < 70) {
    glucoseContribution = -6;
  } else {
    glucoseContribution = 1;
  }

  // 5. Completion of dynamic AI JITAI Micro-Goals (+10 pts)
  if (aiGoalsCompleted) {
    aiContribution = 10;
  } else {
    aiContribution = -2;
  }

  // 6. Clinical Appointment confirmation stability
  if (!willAttend) {
    appointmentContribution = -5;
  } else {
    appointmentContribution = 2;
  }

  const totalMod = 
    medsContribution + 
    sleepContribution + 
    stepsContribution + 
    glucoseContribution + 
    aiContribution + 
    appointmentContribution;

  return Math.min(Math.max(baseScore + totalMod, 0), 100);
}

export async function updatePatientHealthScore(
  patientId: string, 
  score: number, 
  factors: {
    medsDays?: number;
    sleepHours?: number;
    dailySteps?: number;
    bloodGlucose?: number;
    aiGoalsCompleted?: boolean;
    willAttend?: boolean;
  }
) {
  try {
    const sanitizedFactors = sanitizeData(factors);
    await setDoc(doc(db, 'patients', patientId), {
      healthScore: score,
      ...sanitizedFactors,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Failed to update patient health score in Firestore:', e);
  }
  return mockDbService.updateItem('patients', patientId, { 
    healthScore: score,
    ...factors 
  });
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
  return mockDbService.updateItem('courtesy_calls' as any, taskId, { status: 'completed', completionNotes: notes });
}

export async function markMessageRead(messageId: string) {
  mockDbService.updateItem('messages' as any, messageId, { read: true });
  try {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.warn("Firestore markMessageRead fallback:", error);
  }
}

export async function createMessage(data: any) {
  const payload = {
    ...data,
    createdAt: new Date().toISOString(),
    status: 'sent'
  };
  const mockResult = mockDbService.addItem('messages' as any, payload);
  try {
    const docRef = await addDoc(collection(db, 'messages'), payload);
    return { ...payload, id: docRef.id };
  } catch (error) {
    console.warn("Firestore createMessage fallback:", error);
    return mockResult;
  }
}

export async function createRefillRequest(patientId: string, data: any) {
  return mockDbService.addItem('messages' as any, {
    ...data,
    patientId,
    type: 'refill_request',
    title: 'Medication Refill Request',
    createdAt: new Date().toISOString(),
    status: 'sent',
    priority: 'medium'
  });
}

export async function createReminder(data: any) {
  return mockDbService.addItem('reminders' as any, data);
}

export async function completeReminder(reminderId: string) {
  // Mock logic
}

export async function updateUserDashboardSettings(userId: string, settings: any, field: string = 'dashboardSettings') {
  try {
    const userRef = doc(db, 'users', userId);
    // Use setDoc with merge: true to ensure the document exists
    await setDoc(userRef, {
      [field]: settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Failed to update ${field} in Firestore:`, error);
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
  return mockDbService.updateItem('users', userId, { [field]: settings });
}
