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

export { db, auth };

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
    }), { merge: true });
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

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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
      updatedAt: serverTimestamp(),
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Messages
export async function sendMessage(data: { recipientId: string, recipientName: string, subject: string, body: string, patientId?: string, patientName?: string }) {
  const path = `messages`;
  try {
    await addDoc(collection(db, path), cleanData({
      ...data,
      senderId: auth.currentUser?.uid || 'anonymous-entry',
      senderName: auth.currentUser?.displayName || 'Clinical Staff',
      createdAt: serverTimestamp(),
      read: false
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Provisions a specific patient record for demo purposes: Sarah Mitchell
 */
export async function provisionDemoPatients() {
  const patients = [
    {
      id: 'p-1',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      name: 'Sarah Mitchell',
      dob: '1984-03-15',
      mrn: 'MRN-77291-SM',
      gender: 'Female',
      age: 42,
      email: 'sarah.mitchell@example.com',
      phone: '(555) 091-8827',
      address: '123 Pine St, Seattle, WA 98101',
      status: 'active',
      conditions: [
        'Diabetes Mellitus Type 2 (Newly Diagnosed)',
        'Obesity',
        'PCOS (Polycystic Ovary Syndrome)'
      ],
      lastVisit: new Date().toISOString(),
      tags: ['Health Connect', 'Android Wear', 'High Motivation'],
      updatedAt: serverTimestamp(),
    },
    {
      id: 'p-2',
      firstName: 'Marcus',
      lastName: 'Chen',
      name: 'Marcus Chen',
      dob: '1998-07-22',
      mrn: 'MRN-88102-MC',
      gender: 'Male',
      age: 28,
      email: 'm.chen@example.com',
      phone: '(555) 123-4567',
      address: '456 Oak Ave, Bellevue, WA 98004',
      status: 'active',
      conditions: [
        'Seasonal Allergies',
        'Mild Asthma'
      ],
      lastVisit: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      tags: ['Student', 'Scheduled'],
      updatedAt: serverTimestamp(),
    }
  ];

  for (const patientData of patients) {
    const patientId = patientData.id;
    // 1. Create Patient
    await setDoc(doc(db, 'patients', patientId), cleanData(patientData));

    // 2. Add health connect records (simulated) for Sarah
    if (patientId === 'p-1') {
      const recordsPath = `patients/${patientId}/health_records`;
      const now = Date.now();
      const records = [
        { source: 'health_connect', device: 'Android Wear', type: 'heart_rate', value: 72, timestamp: now - 3600000 },
        { source: 'health_connect', device: 'Android Wear', type: 'steps', value: 4200, timestamp: now - 86400000 },
        { source: 'health_connect', device: 'Android Wear', type: 'blood_glucose', value: 140, timestamp: now - 7200000 }
      ];

      for (const record of records) {
        await addDoc(collection(db, recordsPath), cleanData({
          ...record,
          patientId,
          createdAt: serverTimestamp()
        }));
      }

      // 3. Add Clinical Intake (Context)
      const intakePath = `patients/${patientId}/clinical_intakes`;
      await setDoc(doc(db, intakePath, 'initial-intake'), cleanData({
        patientId,
        chiefComplaint: 'Management of newly diagnosed Diabetes and PCOS symptoms',
        historyOfPresentIllness: 'Sarah is a 42-year-old female recently diagnosed with Type 2 Diabetes. She has a long-standing history of PCOS and obesity. Currently starting Metformin and continuing HRT for hormone management.',
        medicalHistory: 'PCOS, Obesity, Type 2 Diabetes (New)',
        medications: 'Metformin 500mg BID, HRT (Estrogen/Progesterone)',
        socialHistory: 'Active, uses wearable technology for health tracking (Android Wear).',
        authorId: auth.currentUser?.uid || 'system',
        timestamp: now
      }));
    }

    // 4. Add scheduled appointments
    const apptPath = `appointments`;
    const apptDate = new Date();
    if (patientId === 'p-1') {
      apptDate.setHours(apptDate.getHours() + 2);
    } else {
      apptDate.setHours(apptDate.getHours() + 4);
    }
    
    await addDoc(collection(db, apptPath), cleanData({
      patientId,
      time: apptDate.toISOString(),
      reason: patientId === 'p-1' ? 'Diabetes Management Review & PCOS Follow-up' : 'Routine Allergy Follow-up',
      visitType: 'in_clinic',
      status: 'scheduled',
      authorId: auth.currentUser?.uid || 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
  }

  return 'p-1';
}

export async function provisionSarahMitchell() {
  return provisionDemoPatients();
}

// Clinical Intake
export async function saveClinicalIntake(patientId: string, intakeId: string, data: any) {
  const path = `patients/${patientId}/clinical_intakes`;
  try {
    await setDoc(doc(db, path, intakeId), cleanData({
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      updatedAt: serverTimestamp(),
    }), { merge: true });

    // Sync chief complaint to patient record for visibility in registry
    if (data.chiefComplaint) {
      await updateDoc(doc(db, 'patients', patientId), {
        chiefComplaint: data.chiefComplaint,
        updatedAt: serverTimestamp()
      });
    }
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

export async function updateUserDashboardSettings(userId: string, settings: any) {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, path);
    await updateDoc(docRef, cleanData({
      dashboardSettings: settings,
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
