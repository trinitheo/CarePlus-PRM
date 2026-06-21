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
import { ClinicalServiceType } from './clinicalServiceType';

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = true) {
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
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

function sanitizeData(data: any): any {
  if (data === null || data === undefined) return null;
  if (data instanceof Date) return data.toISOString();
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(v => sanitizeData(v));
  
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

export const firestoreClinicalService: ClinicalServiceType = {
  db,
  auth,

  async resetAppToNewInstall() {
    const collectionsToWipe = ['users', 'roles', 'appointments', 'messages', 'audit_logs', 'clinical_records', 'registered_users'];
    
    for (const collName of collectionsToWipe) {
      try {
        const qSnap = await getDocs(collection(db, collName));
        const deletePromises = qSnap.docs.map(docSnap => deleteDoc(doc(db, collName, docSnap.id)));
        await Promise.all(deletePromises);
      } catch (e) {
        console.warn(`Could not wipe collection ${collName} in Firestore:`, e);
      }
    }

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

    localStorage.clear();
    sessionStorage.clear();
    try {
      await auth.signOut();
    } catch (err) {
      console.warn("Sign out during raw reset failed:", err);
    }
  },

  // Generic DB methods
  async getCollection(path: string, patientId?: string): Promise<any[]> {
    try {
      const ref = patientId 
        ? collection(db, 'patients', patientId, path) 
        : collection(db, path);
      const snap = await getDocs(ref);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getDoc(path: string, docId: string): Promise<any | null> {
    try {
      const docRef = doc(db, path, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${path}/${docId}`);
      return null;
    }
  },

  async addItem(path: string, data: any, patientId?: string): Promise<string> {
    try {
      const ref = patientId 
        ? collection(db, 'patients', patientId, path) 
        : collection(db, path);
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateItem(path: string, docId: string, data: any, patientId?: string): Promise<any> {
    try {
      const docRef = patientId 
        ? doc(db, 'patients', patientId, path, docId) 
        : doc(db, path, docId);
      const sanitized = sanitizeData(data);
      await setDoc(docRef, {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${docId}`);
    }
  },

  async deleteItem(path: string, docId: string, patientId?: string): Promise<void> {
    try {
      const docRef = patientId 
        ? doc(db, 'patients', patientId, path, docId) 
        : doc(db, path, docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${docId}`);
    }
  },

  subscribeToCollection(path: string, callback: (data: any[]) => void, patientId?: string): () => void {
    const ref = patientId 
      ? collection(db, 'patients', patientId, path) 
      : collection(db, path);
    
    return onSnapshot(ref, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, false);
    });
  },

  subscribeToPatientData(patientId: string, callback: (data: any) => void): () => void {
    const dataState: any = {
      patient: { conditions: [] },
      clinical_intakes: [],
      clinical_records: [],
      prescriptions: [],
      investigations: [],
      procedures: [],
      referrals: [],
      vitals: [],
      interactions: [],
      care_teams: [],
    };

    const collectionsList = [
      'clinical_intakes',
      'clinical_records',
      'prescriptions',
      'investigations',
      'procedures',
      'referrals',
      'vitals',
      'interactions',
      'care_teams'
    ] as const;

    const unsubscribes: (() => void)[] = [];
    const triggerCallback = () => {
      callback({ ...dataState });
    };

    try {
      const patientDocRef = doc(db, 'patients', patientId);
      const unsubPatient = onSnapshot(patientDocRef, (docSnap) => {
        if (docSnap.exists()) {
          dataState.patient = { id: docSnap.id, ...docSnap.data() };
          triggerCallback();
        }
      }, (error) => {
        console.warn("Firestore patient doc subscription error:", error);
      });
      unsubscribes.push(unsubPatient);

      collectionsList.forEach(colName => {
        const subColRef = collection(db, 'patients', patientId, colName);
        const unsubSubcol = onSnapshot(subColRef, (snap) => {
          dataState[colName] = snap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          triggerCallback();
        }, (error) => {
          console.warn(`Firestore subcollection '${colName}' subscription error:`, error);
        });
        unsubscribes.push(unsubSubcol);
      });
    } catch (error) {
      console.error("Failed to establish subscriptions:", error);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  },

  // Specific Domain methods
  async saveUserProfile(userId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      await setDoc(doc(db, 'users', userId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async getUserProfile(userId: string) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${userId}`);
      return null;
    }
  },

  async addToCareTeam(patientId: string, userId: string, data: any) {
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
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/care_teams/${userId}`);
    }
  },

  async removeFromCareTeam(patientId: string, userId: string) {
    try {
      await deleteDoc(doc(db, 'patients', patientId, 'care_teams', userId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `patients/${patientId}/care_teams/${userId}`);
    }
  },

  async saveSOAPNote(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const noteId = data.id || `soap-${Date.now()}`;
      await setDoc(doc(db, 'patients', patientId, 'clinical_records', noteId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      });
      return noteId;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/clinical_records`);
    }
  },

  async updatePatientConditions(patientId: string, conditions: string[]) {
    try {
      const docRef = doc(db, 'patients', patientId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentConditions = snap.data().conditions || [];
        const merged = Array.from(new Set([...currentConditions, ...conditions]));
        await setDoc(docRef, { conditions: merged, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}`);
    }
  },

  async updateSOAPNote(patientId: string, noteId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      await setDoc(doc(db, 'patients', patientId, 'clinical_records', noteId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}/clinical_records/${noteId}`);
    }
  },

  async savePrescription(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const rxId = data.id || `rx-${Date.now()}`;
      await setDoc(doc(db, 'patients', patientId, 'prescriptions', rxId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      });
      return rxId;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/prescriptions`);
    }
  },

  async deletePrescription(patientId: string, prescriptionId: string) {
    try {
      await deleteDoc(doc(db, 'patients', patientId, 'prescriptions', prescriptionId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `patients/${patientId}/prescriptions/${prescriptionId}`);
    }
  },

  async updatePrescriptionStatus(patientId: string, prescriptionId: string, status: string, reason?: string) {
    try {
      await setDoc(doc(db, 'patients', patientId, 'prescriptions', prescriptionId), {
        status,
        reason: reason || null,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}/prescriptions/${prescriptionId}`);
    }
  },

  async updatePrescriptionAdherence(patientId: string, prescriptionId: string, status: string, score: number) {
    try {
      await setDoc(doc(db, 'patients', patientId, 'prescriptions', prescriptionId), {
        adherenceStatus: status,
        adherenceScore: score,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}/prescriptions/${prescriptionId}`);
    }
  },

  async saveInvestigation(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const invId = data.id || `inv-${Date.now()}`;
      await setDoc(doc(db, 'patients', patientId, 'investigations', invId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      });
      return invId;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/investigations`);
    }
  },

  async updateInvestigation(patientId: string, investigationId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      await setDoc(doc(db, 'patients', patientId, 'investigations', investigationId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}/investigations/${investigationId}`);
    }
  },

  async saveProcedure(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const procId = data.id || `proc-${Date.now()}`;
      await setDoc(doc(db, 'patients', patientId, 'procedures', procId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      });
      return procId;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/procedures`);
    }
  },

  async saveReferral(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const refId = data.id || `ref-${Date.now()}`;
      await setDoc(doc(db, 'patients', patientId, 'referrals', refId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      });
      return refId;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/referrals`);
    }
  },

  async savePatient(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      await setDoc(doc(db, 'patients', patientId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}`);
    }
  },

  async updateAuthorizedUsers(patientId: string, authorizedUserIds: string[]) {
    try {
      await setDoc(doc(db, 'patients', patientId), {
        authorizedUserIds,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}`);
    }
  },

  async provisionMarcusEverett() {
    const patientId = 'pat-marcus-001';
    try {
      const existing = await getDoc(doc(db, 'patients', patientId));
      if (!existing.exists()) {
        await setDoc(doc(db, 'patients', patientId), {
          id: patientId,
          mrn: 'MRN-91283-ME',
          firstName: 'Marcus',
          lastName: 'Everett',
          name: 'Marcus Everett',
          dob: '1987-10-12',
          gender: 'Male',
          age: 39,
          email: 'marcus.everett@example.com',
          phone: '(555) 912-8344',
          status: 'active',
          conditions: [
            'Seropositive Rheumatoid Arthritis',
            'Symmetrical Polyarthritis'
          ],
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error('Failed to provision Marcus Everett:', e);
    }
    return patientId;
  },

  async saveClinicalIntake(patientId: string, intakeId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      await setDoc(doc(db, 'patients', patientId, 'clinical_intakes', intakeId), {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patients/${patientId}/clinical_intakes/${intakeId}`);
    }
  },

  async updatePatientVitals(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(collection(db, 'patients', patientId, 'vitals'), {
        ...sanitized,
        timestamp: data.timestamp || Date.now()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `patients/${patientId}/vitals`);
    }
  },

  async updatePatientNudgeAndActionPlan(patientId: string, activeNudge: any, actionPlan: any[]) {
    try {
      const sanitizedNudge = sanitizeData(activeNudge);
      const sanitizedPlan = sanitizeData(actionPlan);
      await setDoc(doc(db, 'patients', patientId), {
        activeNudge: sanitizedNudge,
        actionPlan: sanitizedPlan,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}`);
    }
  },

  async updatePatientHealthScore(
    patientId: string, 
    score: number, 
    factors: any,
    source?: 'wearable' | 'manual'
  ) {
    try {
      const docRef = doc(db, 'patients', patientId);
      const updateObj: any = {};
      const timestampNow = Date.now();

      if (source === 'wearable') {
        if (factors.sleepHours !== undefined) updateObj[`wearable.sleepHours`] = { value: Number(factors.sleepHours), lastUpdated: timestampNow };
        if (factors.dailySteps !== undefined) updateObj[`wearable.dailySteps`] = { value: Number(factors.dailySteps), lastUpdated: timestampNow };
        if (factors.bloodGlucose !== undefined) updateObj[`wearable.bloodGlucose`] = { value: Number(factors.bloodGlucose), lastUpdated: timestampNow };
      } else {
        if (factors.medsDays !== undefined) updateObj[`manual.medsDays`] = { value: Number(factors.medsDays), lastUpdated: timestampNow };
        if (factors.sleepHours !== undefined) updateObj[`manual.sleepHours`] = { value: Number(factors.sleepHours), lastUpdated: timestampNow };
        if (factors.dailySteps !== undefined) updateObj[`manual.dailySteps`] = { value: Number(factors.dailySteps), lastUpdated: timestampNow };
        if (factors.bloodGlucose !== undefined) updateObj[`manual.bloodGlucose`] = { value: Number(factors.bloodGlucose), lastUpdated: timestampNow };
        if (factors.aiGoalsCompleted !== undefined) updateObj[`manual.aiGoalsCompleted`] = { value: Boolean(factors.aiGoalsCompleted), lastUpdated: timestampNow };
        if (factors.willAttend !== undefined) updateObj[`manual.willAttend`] = { value: Boolean(factors.willAttend), lastUpdated: timestampNow };
      }

      await setDoc(docRef, { ...updateObj, updatedAt: serverTimestamp() }, { merge: true });
      return score;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}`);
      return score;
    }
  },

  async updatePatientStatus(patientId: string, status: string) {
    try {
      await setDoc(doc(db, 'patients', patientId), { status, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `patients/${patientId}`);
    }
  },

  async saveInteraction(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(collection(db, 'patients', patientId, 'interactions'), {
        ...sanitized,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `patients/${patientId}/interactions`);
    }
  },

  async saveAppointment(data: any) {
    try {
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...sanitized,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'appointments');
    }
  },

  async updateAppointmentStatus(appointmentId: string, status: string) {
    try {
      await setDoc(doc(db, 'appointments', appointmentId), { status, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `appointments/${appointmentId}`);
    }
  },

  async getUpcomingAppointments() {
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'appointments');
      return [];
    }
  },

  async completeCourtesyCall(taskId: string, notes: string) {
    try {
      await setDoc(doc(db, 'courtesy_calls', taskId), {
        status: 'completed',
        completionNotes: notes,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `courtesy_calls/${taskId}`);
    }
  },

  async markMessageRead(messageId: string) {
    try {
      await updateDoc(doc(db, 'messages', messageId), { read: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `messages/${messageId}`);
    }
  },

  async createMessage(data: any) {
    try {
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(collection(db, 'messages'), {
        ...sanitized,
        status: 'sent',
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...sanitized, status: 'sent' };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
  },

  async createRefillRequest(patientId: string, data: any) {
    try {
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(collection(db, 'messages'), {
        ...sanitized,
        patientId,
        type: 'refill_request',
        title: 'Medication Refill Request',
        status: 'sent',
        priority: 'medium',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
  },

  async createReminder(data: any) {
    try {
      const sanitized = sanitizeData(data);
      const docRef = await addDoc(collection(db, 'reminders'), {
        ...sanitized,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'reminders');
    }
  },

  async completeReminder(reminderId: string) {
    try {
      await setDoc(doc(db, 'reminders', reminderId), { status: 'completed', updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reminders/${reminderId}`);
    }
  },

  async updateUserDashboardSettings(userId: string, settings: any, field: string = 'dashboardSettings') {
    try {
      await setDoc(doc(db, 'users', userId), {
        [field]: settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  }
};
