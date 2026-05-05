import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
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

// SOAP Notes
export async function saveSOAPNote(patientId: string, data: any) {
  const path = `patients/${patientId}/clinical_records`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

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
    await updateDoc(patientRef, {
      conditions: arrayUnion(...conditions),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSOAPNote(patientId: string, noteId: string, data: any) {
  const path = `patients/${patientId}/clinical_records`;
  try {
    const docRef = doc(db, path, noteId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

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
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Investigations
export async function saveInvestigation(patientId: string, data: any) {
  const path = `patients/${patientId}/investigations`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      status: 'ordered'
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInvestigation(patientId: string, investigationId: string, data: any) {
  const path = `patients/${patientId}/investigations`;
  try {
    const docRef = doc(db, path, investigationId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Procedures
export async function saveProcedure(patientId: string, data: any) {
  const path = `patients/${patientId}/procedures`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      status: 'scheduled'
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Referrals
export async function saveReferral(patientId: string, data: any) {
  const path = `patients/${patientId}/referrals`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      status: 'pending'
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Patient Registration
export async function savePatient(patientId: string, data: any) {
  const path = `patients`;
  try {
    await setDoc(doc(db, path, patientId), {
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Clinical Intake
export async function saveClinicalIntake(patientId: string, intakeId: string, data: any) {
  const path = `patients/${patientId}/clinical_intakes`;
  try {
    await setDoc(doc(db, path, intakeId), {
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Vitals
export async function updatePatientVitals(patientId: string, data: any) {
  const path = `patients/${patientId}/vitals`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updatePatientStatus(patientId: string, status: string) {
  const path = `patients/${patientId}`;
  try {
    await updateDoc(doc(db, 'patients', patientId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Interactions
export async function saveInteraction(patientId: string, data: any) {
  const path = `patients/${patientId}/interactions`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid || 'anonymous-entry',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
