import { mockDbService, mockDb, MockDb } from '../lib/mockDatabase';
import { auth } from '../lib/firebase';
import { ClinicalServiceType } from './clinicalServiceType';

// Light-weight in-memory real-time observation hub
const listeners = new Set<() => void>();

export function notifyListeners() {
  listeners.forEach(l => l());
}

export const mockClinicalService: ClinicalServiceType = {
  db: null,
  auth,

  async resetAppToNewInstall() {
    // Clear the mockDb keys in place to reset the application state
    Object.keys(mockDb).forEach(key => {
      const k = key as keyof MockDb;
      if (Array.isArray(mockDb[k])) {
        (mockDb[k] as any[]).length = 0;
      } else {
        const obj = mockDb[k] as Record<string, any>;
        for (const prop in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            delete obj[prop];
          }
        }
      }
    });
    import('../lib/mockDatabase').then(m => m.persistMockDb());

    localStorage.clear();
    sessionStorage.clear();
    try {
      await auth.signOut();
    } catch (_) {}
  },

  // Generic DB methods
  async getCollection(path: string, patientId?: string): Promise<any[]> {
    return mockDbService.getCollection(path as keyof MockDb, patientId);
  },

  async getDoc(path: string, docId: string): Promise<any | null> {
    return mockDbService.getDoc(path as keyof MockDb, docId) || null;
  },

  async addItem(path: string, data: any, patientId?: string): Promise<string> {
    const id = mockDbService.addItem(path as keyof MockDb, data, patientId);
    notifyListeners();
    return id;
  },

  async updateItem(path: string, docId: string, data: any, patientId?: string): Promise<any> {
    const result = mockDbService.updateItem(path as keyof MockDb, docId, data, patientId);
    notifyListeners();
    return result;
  },

  async deleteItem(path: string, docId: string, patientId?: string): Promise<void> {
    if (patientId) {
      const items = (mockDb[path as keyof MockDb] as Record<string, any[]>)[patientId] || [];
      const filtered = items.filter(i => i.id !== docId);
      (mockDb[path as keyof MockDb] as Record<string, any[]>)[patientId] = filtered;
    } else if (Array.isArray(mockDb[path as keyof MockDb])) {
      const items = mockDb[path as keyof MockDb] as any[];
      const filtered = items.filter((i: any) => i.id !== docId);
      (mockDb[path as keyof MockDb] as any) = filtered;
    }
    notifyListeners();
  },

  subscribeToCollection(path: string, callback: (data: any[]) => void, patientId?: string): () => void {
    const update = () => {
      callback(mockDbService.getCollection(path as keyof MockDb, patientId) || []);
    };
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  },

  subscribeToPatientData(patientId: string, callback: (data: any) => void): () => void {
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

    const update = () => {
      const patientDoc = mockDbService.getDoc('patients', patientId) || { conditions: [] };
      const colData: any = {};
      collectionsList.forEach(col => {
        colData[col] = mockDbService.getCollection(col as any, patientId) || [];
      });
      callback({
        patient: patientDoc,
        ...colData
      });
    };

    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  },

  // Specific Domain methods
  async saveUserProfile(userId: string, data: any) {
    const result = mockDbService.updateItem('users', userId, data);
    notifyListeners();
    return result;
  },

  async getUserProfile(userId: string) {
    return mockDbService.getDoc('users', userId) || null;
  },

  async addToCareTeam(patientId: string, userId: string, data: any) {
    const result = mockDbService.addItem('care_teams' as any, { ...data, userId, patientId }, patientId);
    notifyListeners();
    return result;
  },

  async removeFromCareTeam(patientId: string, userId: string) {
    const items = mockDb.care_teams[patientId] || [];
    mockDb.care_teams[patientId] = items.filter(i => i.userId !== userId);
    notifyListeners();
  },

  async saveSOAPNote(patientId: string, data: any) {
    const result = mockDbService.addItem('clinical_records', data, patientId);
    notifyListeners();
    return result;
  },

  async updatePatientConditions(patientId: string, conditions: string[]) {
    const patient = mockDbService.getDoc('patients', patientId);
    if (patient) {
      mockDbService.updateItem('patients', patientId, {
        conditions: Array.from(new Set([...(patient.conditions || []), ...conditions]))
      });
      notifyListeners();
    }
  },

  async updateSOAPNote(patientId: string, noteId: string, data: any) {
    const result = mockDbService.updateItem('clinical_records', noteId, data, patientId);
    notifyListeners();
    return result;
  },

  async savePrescription(patientId: string, data: any) {
    const result = mockDbService.addItem('prescriptions', data, patientId);
    notifyListeners();
    return result;
  },

  async deletePrescription(patientId: string, prescriptionId: string) {
    const items = mockDb.prescriptions[patientId] || [];
    mockDb.prescriptions[patientId] = items.filter(i => i.id !== prescriptionId);
    notifyListeners();
  },

  async updatePrescriptionStatus(patientId: string, prescriptionId: string, status: string, reason?: string) {
    const result = mockDbService.updateItem('prescriptions', prescriptionId, { status, reason }, patientId);
    notifyListeners();
    return result;
  },

  async updatePrescriptionAdherence(patientId: string, prescriptionId: string, status: string, score: number) {
    const result = mockDbService.updateItem('prescriptions', prescriptionId, { adherenceStatus: status, adherenceScore: score }, patientId);
    notifyListeners();
    return result;
  },

  async saveInvestigation(patientId: string, data: any) {
    const result = mockDbService.addItem('investigations', data, patientId);
    notifyListeners();
    return result;
  },

  async updateInvestigation(patientId: string, investigationId: string, data: any) {
    const result = mockDbService.updateItem('investigations', investigationId, data, patientId);
    notifyListeners();
    return result;
  },

  async saveProcedure(patientId: string, data: any) {
    const result = mockDbService.addItem('procedures', data, patientId);
    notifyListeners();
    return result;
  },

  async saveReferral(patientId: string, data: any) {
    const result = mockDbService.addItem('referrals', data, patientId);
    notifyListeners();
    return result;
  },

  async savePatient(patientId: string, data: any) {
    const userExists = mockDbService.getDoc('users', patientId);
    if (!userExists) {
      mockDbService.updateItem('users', patientId, {
        id: patientId,
        email: data.email || `${patientId}@patient.precisionhealth.care`,
        displayName: data.name || `${data.firstName} ${data.lastName}`,
        role: 'patient',
        createdAt: data.createdAt || new Date().toISOString()
      });
    }
    const result = mockDbService.updateItem('patients', patientId, data);
    notifyListeners();
    return result;
  },

  async updateAuthorizedUsers(patientId: string, authorizedUserIds: string[]) {
    const result = mockDbService.updateItem('patients', patientId, { authorizedUserIds });
    notifyListeners();
    return result;
  },

  async provisionMarcusEverett() {
    const patientDoc = mockDbService.getDoc('patients', 'pat-marcus-001');
    if (!patientDoc) {
      mockDbService.updateItem('patients', 'pat-marcus-001', {
        id: 'pat-marcus-001',
        patientId: 'pat-marcus-001',
        firstName: 'Marcus',
        lastName: 'Everett',
        name: 'Marcus Everett',
        email: 'm.everett@personal.com',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      notifyListeners();
    }
    return 'pat-marcus-001';
  },

  async saveClinicalIntake(patientId: string, intakeId: string, data: any) {
    const result = mockDbService.updateItem('clinical_intakes', intakeId, data, patientId);
    notifyListeners();
    return result;
  },

  async updatePatientVitals(patientId: string, data: any) {
    const result = mockDbService.addItem('vitals', data, patientId);
    notifyListeners();
    return result;
  },

  async updatePatientNudgeAndActionPlan(patientId: string, activeNudge: any, actionPlan: any[]) {
    const result = mockDbService.updateItem('patients', patientId, { activeNudge, actionPlan });
    notifyListeners();
    return result;
  },

  async updatePatientHealthScore(
    patientId: string, 
    score: number, 
    factors: any,
    source?: 'wearable' | 'manual'
  ) {
    const patientDoc = mockDbService.getDoc('patients', patientId);
    const timestampNow = Date.now();
    const updateObj: any = {};

    if (source === 'wearable') {
      if (factors.sleepHours !== undefined) {
        updateObj[`wearable.sleepHours`] = { value: Number(factors.sleepHours), lastUpdated: timestampNow };
      }
      if (factors.dailySteps !== undefined) {
        updateObj[`wearable.dailySteps`] = { value: Number(factors.dailySteps), lastUpdated: timestampNow };
      }
      if (factors.bloodGlucose !== undefined) {
        updateObj[`wearable.bloodGlucose`] = { value: Number(factors.bloodGlucose), lastUpdated: timestampNow };
      }
    } else {
      if (factors.medsDays !== undefined) updateObj[`manual.medsDays`] = { value: Number(factors.medsDays), lastUpdated: timestampNow };
      if (factors.sleepHours !== undefined) updateObj[`manual.sleepHours`] = { value: Number(factors.sleepHours), lastUpdated: timestampNow };
      if (factors.dailySteps !== undefined) updateObj[`manual.dailySteps`] = { value: Number(factors.dailySteps), lastUpdated: timestampNow };
      if (factors.bloodGlucose !== undefined) updateObj[`manual.bloodGlucose`] = { value: Number(factors.bloodGlucose), lastUpdated: timestampNow };
      if (factors.aiGoalsCompleted !== undefined) updateObj[`manual.aiGoalsCompleted`] = { value: Boolean(factors.aiGoalsCompleted), lastUpdated: timestampNow };
      if (factors.willAttend !== undefined) updateObj[`manual.willAttend`] = { value: Boolean(factors.willAttend), lastUpdated: timestampNow };
    }

    // Since mockDb doesn't perfectly nested-update dynamic keys like "manual.medsDays" natively,
    // let's do standard shallow merging for mock update items
    const manualObj = { ...(patientDoc?.manual || {}) };
    const wearableObj = { ...(patientDoc?.wearable || {}) };

    if (source === 'wearable') {
      if (factors.sleepHours !== undefined) wearableObj.sleepHours = { value: Number(factors.sleepHours), lastUpdated: timestampNow };
      if (factors.dailySteps !== undefined) wearableObj.dailySteps = { value: Number(factors.dailySteps), lastUpdated: timestampNow };
      if (factors.bloodGlucose !== undefined) wearableObj.bloodGlucose = { value: Number(factors.bloodGlucose), lastUpdated: timestampNow };
    } else {
      if (factors.medsDays !== undefined) manualObj.medsDays = { value: Number(factors.medsDays), lastUpdated: timestampNow };
      if (factors.sleepHours !== undefined) manualObj.sleepHours = { value: Number(factors.sleepHours), lastUpdated: timestampNow };
      if (factors.dailySteps !== undefined) manualObj.dailySteps = { value: Number(factors.dailySteps), lastUpdated: timestampNow };
      if (factors.bloodGlucose !== undefined) manualObj.bloodGlucose = { value: Number(factors.bloodGlucose), lastUpdated: timestampNow };
      if (factors.aiGoalsCompleted !== undefined) manualObj.aiGoalsCompleted = { value: Boolean(factors.aiGoalsCompleted), lastUpdated: timestampNow };
      if (factors.willAttend !== undefined) manualObj.willAttend = { value: Boolean(factors.willAttend), lastUpdated: timestampNow };
    }

    mockDbService.updateItem('patients', patientId, {
      ...factors,
      healthScore: score,
      manual: manualObj,
      wearable: wearableObj
    });
    notifyListeners();
    return score;
  },

  async updatePatientStatus(patientId: string, status: string) {
    const result = mockDbService.updateItem('patients', patientId, { status });
    notifyListeners();
    return result;
  },

  async saveInteraction(patientId: string, data: any) {
    const result = mockDbService.addItem('interactions', data, patientId);
    notifyListeners();
    return result;
  },

  async saveAppointment(data: any) {
    const result = mockDbService.addItem('appointments', data);
    notifyListeners();
    return result;
  },

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const result = mockDbService.updateItem('appointments', appointmentId, { status });
    notifyListeners();
    return result;
  },

  async getUpcomingAppointments() {
    return mockDbService.getCollection('appointments');
  },

  async completeCourtesyCall(taskId: string, notes: string) {
    const result = mockDbService.updateItem('courtesy_calls' as any, taskId, { status: 'completed', completionNotes: notes });
    notifyListeners();
    return result;
  },

  async markMessageRead(messageId: string) {
    mockDbService.updateItem('messages', messageId, { read: true });
    notifyListeners();
  },

  async createMessage(data: any) {
    const payload = {
      ...data,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    const result = mockDbService.addItem('messages', payload);
    notifyListeners();
    return result;
  },

  async createRefillRequest(patientId: string, data: any) {
    const result = mockDbService.addItem('messages', {
      ...data,
      patientId,
      type: 'refill_request',
      title: 'Medication Refill Request',
      createdAt: new Date().toISOString(),
      status: 'sent',
      priority: 'medium'
    });
    notifyListeners();
    return result;
  },

  async createReminder(data: any) {
    const result = mockDbService.addItem('reminders', data);
    notifyListeners();
    return result;
  },

  async completeReminder(reminderId: string) {
    mockDbService.updateItem('reminders', reminderId, { status: 'completed' });
    notifyListeners();
  },

  async updateUserDashboardSettings(userId: string, settings: any, field: string = 'dashboardSettings') {
    const result = mockDbService.updateItem('users', userId, { [field]: settings });
    notifyListeners();
    return result;
  }
};
