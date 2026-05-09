import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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

/**
 * Utility to strip undefined values from data before writing to Firestore
 */
function cleanData(data: any) {
  if (data === null || typeof data !== 'object' || data instanceof Date) return data;
  
  // Don't recurse into Firestore special objects (FieldValue, Timestamp, etc.)
  // These usually have a constructor name other than 'Object' or 'Array'
  const constructorName = data.constructor?.name;
  if (constructorName && !['Object', 'Array'].includes(constructorName)) {
    return data;
  }

  const cleaned: any = Array.isArray(data) ? [] : {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      cleaned[key] = (typeof value === 'object' && value !== null) 
        ? cleanData(value) 
        : value;
    }
  });
  
  return cleaned;
}

// User Management
export async function saveUserProfile(userId: string, data: any) {
  const path = `users`;
  try {
    await setDoc(doc(db, path, userId), cleanData({
      ...data,
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(userId: string) {
  const path = `users`;
  try {
    const docSnap = await getDoc(doc(db, path, userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Care Team Management
export async function addToCareTeam(patientId: string, userId: string, data: { accessLevel: string, userRole: string, userSpecialty?: string }) {
  const path = `patients/${patientId}/care_teams`;
  try {
    await setDoc(doc(db, path, userId), cleanData({
      ...data,
      patientId,
      userId,
      status: 'active',
      assignedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeFromCareTeam(patientId: string, userId: string) {
  const path = `patients/${patientId}/care_teams`;
  try {
    await updateDoc(doc(db, path, userId), cleanData({
      status: 'inactive',
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// SOAP Notes
export async function saveSOAPNote(patientId: string, data: any) {
  const path = `patients/${patientId}/clinical_records`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      authorName: data.authorName || auth.currentUser?.displayName || 'Clinical Provider',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));

    // 2. Automatically sync codes/diagnoses to Ongoing Conditions
    const conditionsToSync = [
      ...(data.icd10Codes || []),
      ...(data.workingDiagnoses || [])
    ];
    
    if (conditionsToSync.length > 0) {
      await updatePatientConditions(patientId, conditionsToSync);
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Sync conditions to master patient record
export async function updatePatientConditions(patientId: string, conditions: string[]) {
  const path = `patients`;
  try {
    const patientRef = doc(db, path, patientId);
    await updateDoc(patientRef, cleanData({
      conditions: arrayUnion(...conditions),
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSOAPNote(patientId: string, noteId: string, data: any) {
  const path = `patients/${patientId}/clinical_records`;
  try {
    const docRef = doc(db, path, noteId);
    await updateDoc(docRef, cleanData({
      ...data,
      updatedAt: serverTimestamp(),
    }));

    // Automatically sync codes/diagnoses to Ongoing Conditions
    const conditionsToSync = [
      ...(data.icd10Codes || []),
      ...(data.workingDiagnoses || [])
    ];
    
    if (conditionsToSync.length > 0) {
      await updatePatientConditions(patientId, conditionsToSync);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Prescriptions
export async function savePrescription(patientId: string, data: any) {
  const path = `patients/${patientId}/prescriptions`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      authorName: data.authorName || auth.currentUser?.displayName || 'Clinical Provider',
      createdAt: serverTimestamp(),
      status: 'active'
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePrescription(patientId: string, prescriptionId: string) {
  const path = `patients/${patientId}/prescriptions`;
  try {
    const docRef = doc(db, path, prescriptionId);
    // Physically delete from record for this demo/requirement
    // In production, soft-delete is usually preferred via updatePrescriptionStatus
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updatePrescriptionStatus(patientId: string, prescriptionId: string, status: 'active' | 'discontinued', reason?: string) {
  const path = `patients/${patientId}/prescriptions`;
  try {
    const docRef = doc(db, path, prescriptionId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'discontinued') {
      updateData.discontinuationReason = reason || 'Provider discontinued';
      updateData.discontinuedAt = serverTimestamp();
      updateData.discontinuedBy = auth.currentUser?.displayName || 'Clinical Provider';
    }

    await updateDoc(docRef, cleanData(updateData));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updatePrescriptionAdherence(patientId: string, prescriptionId: string, status: 'optimal' | 'partial' | 'poor' | 'uncertain', score: number) {
  const path = `patients/${patientId}/prescriptions`;
  try {
    const docRef = doc(db, path, prescriptionId);
    await updateDoc(docRef, cleanData({
      adherenceStatus: status,
      adherenceScore: score,
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Investigations
export async function saveInvestigation(patientId: string, data: any) {
  const path = `patients/${patientId}/investigations`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      authorName: data.authorName || auth.currentUser?.displayName || 'Clinical Provider',
      createdAt: serverTimestamp(),
      status: 'ordered'
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInvestigation(patientId: string, investigationId: string, data: any) {
  const path = `patients/${patientId}/investigations`;
  try {
    const docRef = doc(db, path, investigationId);
    await updateDoc(docRef, cleanData({
      ...data,
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Procedures
export async function saveProcedure(patientId: string, data: any) {
  const path = `patients/${patientId}/procedures`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      authorName: data.authorName || auth.currentUser?.displayName || 'Clinical Provider',
      createdAt: serverTimestamp(),
      status: 'scheduled'
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Referrals
export async function saveReferral(patientId: string, data: any) {
  const path = `patients/${patientId}/referrals`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      authorName: data.authorName || auth.currentUser?.displayName || 'Clinical Provider',
      createdAt: serverTimestamp(),
      status: 'pending'
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Patient Registration
export async function savePatient(patientId: string, data: any) {
  const path = `patients`;
  try {
    await setDoc(doc(db, path, patientId), cleanData({
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Clinical Intake
export async function saveClinicalIntake(patientId: string, intakeId: string, data: any) {
  const path = `patients/${patientId}/clinical_intakes`;
  try {
    await setDoc(doc(db, path, intakeId), cleanData({
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Vitals
export async function updatePatientVitals(patientId: string, data: any) {
  const path = `patients/${patientId}/vitals`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      authorName: data.authorName || auth.currentUser?.displayName || 'Clinical Provider',
      createdAt: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updatePatientStatus(patientId: string, status: string) {
  const path = `patients/${patientId}`;
  try {
    await updateDoc(doc(db, 'patients', patientId), cleanData({
      status,
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Interactions
export async function saveInteraction(patientId: string, data: any) {
  const path = `patients/${patientId}/interactions`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Appointments
export async function saveAppointment(data: any) {
  const path = `appointments`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      status: data.status || 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const path = `appointments`;
  try {
    const docRef = doc(db, path, appointmentId);
    await updateDoc(docRef, cleanData({
      status,
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUpcomingAppointments() {
  const path = `appointments`;
  try {
    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // We fetch all from today onwards, but in a real app we might limit
    const q = query(
      collection(db, path),
      orderBy('time', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Dashboards & Operations
export async function completeCourtesyCall(taskId: string, notes: string) {
  const path = `courtesy_calls`;
  try {
    const docRef = doc(db, path, taskId);
    await updateDoc(docRef, cleanData({
      status: 'completed',
      completionNotes: notes,
      completedAt: serverTimestamp(),
      completedBy: auth.currentUser?.uid
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markMessageRead(messageId: string) {
  const path = `messages`;
  try {
    const docRef = doc(db, path, messageId);
    await updateDoc(docRef, cleanData({
      read: true,
      readAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createReminder(data: any) {
  const path = `reminders`;
  try {
    const docRef = await addDoc(collection(db, path), cleanData({
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function completeReminder(reminderId: string) {
  const path = `reminders`;
  try {
    const docRef = doc(db, path, reminderId);
    await updateDoc(docRef, cleanData({
      status: 'completed',
      completedAt: serverTimestamp(),
      completedBy: auth.currentUser?.uid,
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
