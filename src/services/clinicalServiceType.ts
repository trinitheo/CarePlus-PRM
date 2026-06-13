export interface ClinicalServiceType {
  // Expose Firestore instance and Auth for components requiring direct reference if any (and keeping typing happy)
  db: any;
  auth: any;

  // App lifecycle reset behavior
  resetAppToNewInstall(): Promise<void>;

  // Basic Generic Database/Resource Accessors (which replace mockDbService/direct Firestore elsewhere)
  getCollection(path: string, patientId?: string): Promise<any[]>;
  getDoc(path: string, docId: string): Promise<any | null>;
  addItem(path: string, data: any, patientId?: string): Promise<string>;
  updateItem(path: string, docId: string, data: any, patientId?: string): Promise<any>;
  deleteItem(path: string, docId: string, patientId?: string): Promise<void>;

  subscribeToCollection(path: string, callback: (data: any[]) => void, patientId?: string): () => void;
  subscribeToPatientData(patientId: string, callback: (data: any) => void): () => void;

  // Domain-specific operations currently delegated within clinicalFirestoreService
  saveUserProfile(userId: string, data: any): Promise<any>;
  getUserProfile(userId: string): Promise<any | null>;
  
  addToCareTeam(patientId: string, userId: string, data: any): Promise<any>;
  removeFromCareTeam(patientId: string, userId: string): Promise<void>;
  
  saveSOAPNote(patientId: string, data: any): Promise<any>;
  updatePatientConditions(patientId: string, conditions: string[]): Promise<void>;
  updateSOAPNote(patientId: string, noteId: string, data: any): Promise<any>;
  
  savePrescription(patientId: string, data: any): Promise<any>;
  deletePrescription(patientId: string, prescriptionId: string): Promise<void>;
  updatePrescriptionStatus(patientId: string, prescriptionId: string, status: string, reason?: string): Promise<any>;
  updatePrescriptionAdherence(patientId: string, prescriptionId: string, status: string, score: number): Promise<any>;
  
  saveInvestigation(patientId: string, data: any): Promise<any>;
  updateInvestigation(patientId: string, investigationId: string, data: any): Promise<any>;
  
  saveProcedure(patientId: string, data: any): Promise<any>;
  saveReferral(patientId: string, data: any): Promise<any>;
  
  savePatient(patientId: string, data: any): Promise<any>;
  updateAuthorizedUsers(patientId: string, authorizedUserIds: string[]): Promise<any>;
  provisionSarahMitchell(): Promise<string>;
  
  saveClinicalIntake(patientId: string, intakeId: string, data: any): Promise<any>;
  updatePatientVitals(patientId: string, data: any): Promise<any>;
  updatePatientNudgeAndActionPlan(patientId: string, activeNudge: any, actionPlan: any[]): Promise<any>;
  
  updatePatientHealthScore(
    patientId: string, 
    score: number, 
    factors: {
      medsDays?: number;
      sleepHours?: number;
      dailySteps?: number;
      bloodGlucose?: number;
      aiGoalsCompleted?: boolean;
      willAttend?: boolean;
    },
    source?: 'wearable' | 'manual'
  ): Promise<number>;
  
  updatePatientStatus(patientId: string, status: string): Promise<any>;
  saveInteraction(patientId: string, data: any): Promise<any>;
  
  saveAppointment(data: any): Promise<any>;
  updateAppointmentStatus(appointmentId: string, status: string): Promise<any>;
  getUpcomingAppointments(): Promise<any[]>;
  
  completeCourtesyCall(taskId: string, notes: string): Promise<any>;
  markMessageRead(messageId: string): Promise<void>;
  createMessage(data: any): Promise<any>;
  createRefillRequest(patientId: string, data: any): Promise<any>;
  createReminder(data: any): Promise<any>;
  completeReminder(reminderId: string): Promise<void>;
  updateUserDashboardSettings(userId: string, settings: any, field?: string): Promise<any>;
}
