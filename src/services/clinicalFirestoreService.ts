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
  orderBy
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
      authorId: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Prescriptions
export async function savePrescription(patientId: string, data: any) {
  const path = `patients/${patientId}/prescriptions`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid,
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
      authorId: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
      status: 'ordered'
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Procedures
export async function saveProcedure(patientId: string, data: any) {
  const path = `patients/${patientId}/procedures`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      patientId,
      authorId: auth.currentUser?.uid,
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
      authorId: auth.currentUser?.uid,
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
      authorId: auth.currentUser?.uid,
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
      authorId: auth.currentUser?.uid,
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
      authorId: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
