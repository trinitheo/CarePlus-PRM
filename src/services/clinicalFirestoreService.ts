import { mockClinicalService } from './mockClinicalService';
import { firestoreClinicalService } from './firestoreClinicalService';
import { ClinicalServiceType } from './clinicalServiceType';
import { db, auth } from '../lib/firebase';

// Determine backend state based on the environment flag
const USE_FIRESTORE = import.meta.env.VITE_USE_FIRESTORE === 'true';

export const clinicalService: ClinicalServiceType = USE_FIRESTORE 
  ? firestoreClinicalService 
  : mockClinicalService;

// Export Firestore db and auth for backward compatibility
export { db, auth };

// Named Exports representing the single entryway to the unified data operations
export const resetAppToNewInstall = () => clinicalService.resetAppToNewInstall();

export const getPatientById = (patientId: string) => clinicalService.getDoc('patients', patientId);

export const saveUserProfile = (userId: string, data: any) => clinicalService.saveUserProfile(userId, data);
export const getUserProfile = (userId: string) => clinicalService.getUserProfile(userId);

export const addToCareTeam = (patientId: string, userId: string, data: any) => clinicalService.addToCareTeam(patientId, userId, data);
export const removeFromCareTeam = (patientId: string, userId: string) => clinicalService.removeFromCareTeam(patientId, userId);

export const saveSOAPNote = (patientId: string, data: any) => clinicalService.saveSOAPNote(patientId, data);
export const updatePatientConditions = (patientId: string, conditions: string[]) => clinicalService.updatePatientConditions(patientId, conditions);
export const updateSOAPNote = (patientId: string, noteId: string, data: any) => clinicalService.updateSOAPNote(patientId, noteId, data);

export const savePrescription = (patientId: string, data: any) => clinicalService.savePrescription(patientId, data);
export const deletePrescription = (patientId: string, prescriptionId: string) => clinicalService.deletePrescription(patientId, prescriptionId);
export const updatePrescriptionStatus = (patientId: string, prescriptionId: string, status: string, reason?: string) => clinicalService.updatePrescriptionStatus(patientId, prescriptionId, status, reason);
export const updatePrescriptionAdherence = (patientId: string, prescriptionId: string, status: string, score: number) => clinicalService.updatePrescriptionAdherence(patientId, prescriptionId, status, score);

export const saveInvestigation = (patientId: string, data: any) => clinicalService.saveInvestigation(patientId, data);
export const updateInvestigation = (patientId: string, investigationId: string, data: any) => clinicalService.updateInvestigation(patientId, investigationId, data);

export const saveProcedure = (patientId: string, data: any) => clinicalService.saveProcedure(patientId, data);
export const saveReferral = (patientId: string, data: any) => clinicalService.saveReferral(patientId, data);

export const savePatient = (patientId: string, data: any) => clinicalService.savePatient(patientId, data);
export const updateAuthorizedUsers = (patientId: string, authorizedUserIds: string[]) => clinicalService.updateAuthorizedUsers(patientId, authorizedUserIds);
export const provisionMarcusEverett = () => clinicalService.provisionMarcusEverett();

export const saveClinicalIntake = (patientId: string, intakeId: string, data: any) => clinicalService.saveClinicalIntake(patientId, intakeId, data);
export const updatePatientVitals = (patientId: string, data: any) => clinicalService.updatePatientVitals(patientId, data);
export const updatePatientNudgeAndActionPlan = (patientId: string, activeNudge: any, actionPlan: any[]) => clinicalService.updatePatientNudgeAndActionPlan(patientId, activeNudge, actionPlan);

export const updatePatientHealthScore = (
  patientId: string, 
  score: number, 
  factors: any,
  source?: 'wearable' | 'manual'
) => clinicalService.updatePatientHealthScore(patientId, score, factors, source);

export const updatePatientStatus = (patientId: string, status: string) => clinicalService.updatePatientStatus(patientId, status);
export const saveInteraction = (patientId: string, data: any) => clinicalService.saveInteraction(patientId, data);

export const saveAppointment = (data: any) => clinicalService.saveAppointment(data);
export const updateAppointmentStatus = (appointmentId: string, status: string) => clinicalService.updateAppointmentStatus(appointmentId, status);
export const getUpcomingAppointments = () => clinicalService.getUpcomingAppointments();

export const subscribeToCollection = (path: string, callback: (data: any[]) => void, patientId?: string) => {
  return clinicalService.subscribeToCollection(path, callback, patientId);
};

export const subscribeToPatientData = (patientId: string, callback: (data: any) => void) => {
  return clinicalService.subscribeToPatientData(patientId, callback);
};

export const completeCourtesyCall = (taskId: string, notes: string) => clinicalService.completeCourtesyCall(taskId, notes);
export const markMessageRead = (messageId: string) => clinicalService.markMessageRead(messageId);
export const createMessage = (data: any) => clinicalService.createMessage(data);
export const createRefillRequest = (patientId: string, data: any) => clinicalService.createRefillRequest(patientId, data);
export const createReminder = (data: any) => clinicalService.createReminder(data);
export const completeReminder = (reminderId: string) => clinicalService.completeReminder(reminderId);
export const updateUserDashboardSettings = (userId: string, settings: any, field?: string) => clinicalService.updateUserDashboardSettings(userId, settings, field);


// Direct, pure utility operations exported for backwards compatibility and formatting
export function resolveActiveMetrics(patient: any) {
  const getActiveValue = (
    channel: 'sleepHours' | 'dailySteps' | 'bloodGlucose',
    defaultVal: number
  ) => {
    const wearable = patient?.wearable?.[channel];
    const manual = patient?.manual?.[channel];

    const wearableVal = wearable?.value;
    let wearableTime = 0;
    if (wearable?.lastUpdated) {
      if (typeof wearable.lastUpdated === 'object' && typeof wearable.lastUpdated.toMillis === 'function') {
        wearableTime = wearable.lastUpdated.toMillis();
      } else {
        wearableTime = new Date(wearable.lastUpdated).getTime() || Number(wearable.lastUpdated) || 0;
      }
    }

    const manualVal = manual?.value;
    let manualTime = 0;
    if (manual?.lastUpdated) {
      if (typeof manual.lastUpdated === 'object' && typeof manual.lastUpdated.toMillis === 'function') {
        manualTime = manual.lastUpdated.toMillis();
      } else {
        manualTime = new Date(manual.lastUpdated).getTime() || Number(manual.lastUpdated) || 0;
      }
    }

    if (wearableVal !== undefined && wearableTime > manualTime) {
      return { value: Number(wearableVal), source: 'wearable', lastUpdated: wearableTime };
    }
    if (manualVal !== undefined) {
      return { value: Number(manualVal), source: 'manual', lastUpdated: manualTime };
    }
    
    const flatVal = patient?.[channel];
    return {
      value: typeof flatVal === 'number' ? flatVal : defaultVal,
      source: 'fallback',
      lastUpdated: 0
    };
  };

  const activeSleep = getActiveValue('sleepHours', 7.6);
  const activeSteps = getActiveValue('dailySteps', 8420);
  const activeGlucose = getActiveValue('bloodGlucose', 104);

  const medsDays = patient?.manual?.medsDays?.value !== undefined
    ? Number(patient.manual.medsDays.value)
    : (typeof patient?.medsDays === 'number' ? patient.medsDays : 5);

  const aiGoalsCompleted = patient?.manual?.aiGoalsCompleted?.value !== undefined
    ? Boolean(patient.manual.aiGoalsCompleted.value)
    : (typeof patient?.aiGoalsCompleted === 'boolean' ? patient.aiGoalsCompleted : true);

  const willAttend = patient?.manual?.willAttend?.value !== undefined
    ? Boolean(patient.manual.willAttend.value)
    : (typeof patient?.willAttend === 'boolean' ? patient.willAttend : true);

  return {
    sleepHours: activeSleep.value,
    sleepSource: activeSleep.source,
    sleepLastUpdated: activeSleep.lastUpdated,

    dailySteps: activeSteps.value,
    stepsSource: activeSteps.source,
    stepsLastUpdated: activeSteps.lastUpdated,

    bloodGlucose: activeGlucose.value,
    glucoseSource: activeGlucose.source,
    glucoseLastUpdated: activeGlucose.lastUpdated,

    medsDays,
    aiGoalsCompleted,
    willAttend
  };
}

export function computeHealthScore(factors: {
  medsDays?: number;
  sleepHours?: number;
  dailySteps?: number;
  bloodGlucose?: number;
  aiGoalsCompleted?: boolean;
  willAttend?: boolean;
  conditionsCount?: number;
}) {
  const baseScore = 75;
  let medsContribution = 0;
  let sleepContribution = 0;
  let stepsContribution = 0;
  let glucoseContribution = 0;
  let aiContribution = 0;
  let appointmentContribution = 0;
  let conditionsPenalty = 0;

  const medsDays = typeof factors.medsDays === 'number' ? factors.medsDays : 5;
  const sleepHours = typeof factors.sleepHours === 'number' ? factors.sleepHours : 7.6;
  const dailySteps = typeof factors.dailySteps === 'number' ? factors.dailySteps : 8420;
  const bloodGlucose = typeof factors.bloodGlucose === 'number' ? factors.bloodGlucose : 104;
  const aiGoalsCompleted = typeof factors.aiGoalsCompleted === 'boolean' ? factors.aiGoalsCompleted : true;
  const willAttend = typeof factors.willAttend === 'boolean' ? factors.willAttend : true;
  const conditionsCount = typeof factors.conditionsCount === 'number' ? factors.conditionsCount : 2;

  if (medsDays === 7) medsContribution = 8;
  else if (medsDays >= 5) medsContribution = 5;
  else if (medsDays >= 3) medsContribution = 1;
  else medsContribution = -4;

  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepContribution = 6;
  } else if (sleepHours >= 6 && sleepHours < 7) {
    sleepContribution = 2;
  } else if (sleepHours > 9) {
    sleepContribution = 3;
  } else {
    sleepContribution = -3;
  }

  if (dailySteps >= 9000) stepsContribution = 8;
  else if (dailySteps >= 8000) stepsContribution = 7;
  else if (dailySteps >= 7000) stepsContribution = 6;
  else if (dailySteps >= 5000) stepsContribution = 3;
  else if (dailySteps >= 3000) stepsContribution = 1;
  else stepsContribution = -2;

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

  if (aiGoalsCompleted) {
    aiContribution = 10;
  } else {
    aiContribution = -2;
  }

  if (!willAttend) {
    appointmentContribution = -5;
  } else {
    appointmentContribution = 2;
  }

  if (conditionsCount > 3) {
    conditionsPenalty = -4;
  } else if (conditionsCount > 1) {
    conditionsPenalty = -2;
  } else if (conditionsCount === 1) {
    conditionsPenalty = -1;
  }

  const totalMod = 
    medsContribution + 
    sleepContribution + 
    stepsContribution + 
    glucoseContribution + 
    aiContribution + 
    appointmentContribution +
    conditionsPenalty;

  return Math.min(Math.max(baseScore + totalMod, 0), 100);
}
