import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { UserRole } from '../types';

// --- Domain Events ---
type DomainEvent =
  | { type: 'PATIENT_REGISTERED'; payload: Patient }
  | { type: 'VITALS_RECORDED'; payload: Vitals }
  | { type: 'APPOINTMENT_SCHEDULED'; payload: Appointment }
  | { type: 'HEALTH_DATA_INGESTED'; payload: { id: string; patientId: string; source: 'watch' | 'medication_log' | 'diet' | 'health_connect'; type: string; value: any; timestamp: number } }
  | { type: 'CLINICAL_INTAKE_RECORDED'; payload: ClinicalIntake }
  | { type: 'INTERACTION_RECORDED'; payload: Interaction };

// --- State Model ---
interface Interaction {
  id: string;
  patientId: string;
  authorId: string;
  authorRole: UserRole;
  type: 'clinical' | 'nursing' | 'pt' | 'social_care' | 'financial' | 'support_group';
  content: string;
  category?: string;
  timestamp: number;
}

export interface ClinicalIntake {
  id: string;
  patientId: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  medicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  surgicalHistory: string;
  immunizations: string;
  hospitalizations: string;
  reviewOfSystems: string;
  medications: string;
  allergies: string;
  timestamp: number;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Combined name for UI
  dob: string;
  mrn: string;
  gender?: string;
  sex?: string;
  bloodType?: string;
  age?: number;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'pending' | 'discharged' | 'triage';
  conditions?: string[];
  lastVisit?: string;
  chiefComplaint?: string;
  tags?: string[];
}

export interface Vitals {
  patientId: string;
  hr: number;
  bp: string;
  temp: number;
  rr?: number;
  spo2?: number;
  glucose?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  hba1c?: number;
  gcs?: string;
  gcs_e?: number;
  gcs_v?: number;
  gcs_m?: number;
  avpu?: string;
  timestamp: number;
}

interface HealthRecord {
  id: string;
  patientId: string;
  source: 'watch' | 'medication_log' | 'diet' | 'health_connect';
  type: string;
  value: any;
  timestamp: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  time: string;
  duration?: number;
  reason: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  visitType?: 'in_clinic' | 'telehealth';
  priority?: 'immediate' | 'urgent' | 'routine';
  priorityColor?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface AppState {
  patients: Record<string, Patient>;
  vitals: Record<string, Vitals[]>;
  healthRecords: Record<string, HealthRecord[]>;
  clinicalIntakes: Record<string, ClinicalIntake | undefined>;
  appointments: Record<string, Appointment>;
  interactions: Record<string, Interaction[]>;
}

const initialState: AppState = {
  patients: {}, // Will be populated by Firestore
  vitals: {
    'p-1': [{ patientId: 'p-1', hr: 87, bp: '145/92', temp: 98.6, timestamp: Date.now() - 3600000 }],
  },
  healthRecords: {
    'p-1': [
      { id: 'hr-init-1', patientId: 'p-1', source: 'health_connect', type: 'heart_rate', value: 85, timestamp: Date.now() - 3600000 },
      { id: 'hr-init-2', patientId: 'p-1', source: 'health_connect', type: 'heart_rate', value: 88, timestamp: Date.now() - 7200000 },
    ],
  },
  clinicalIntakes: {
    'p-1': {
      id: 'intake-1',
      patientId: 'p-1',
      chiefComplaint: 'New onset Diabetes management & PCOS follow-up',
      historyOfPresentIllness: 'Sarah is a 42-year-old female with a known history of PCOS and obesity. Recently diagnosed with Diabetes Mellitus Type 2. Currently starting Metformin and continuing HRT (Estrogen/Progesterone).',
      medicalHistory: 'PCOS, Obesity, Type 2 Diabetes (New)',
      familyHistory: 'Father with early MI',
      socialHistory: 'Active, uses Android Wear and Health Connect',
      surgicalHistory: 'Appendectomy',
      immunizations: 'Up to date with COVID and Flu',
      hospitalizations: 'None in last 5 years',
      reviewOfSystems: 'Negative for weight loss, positive for irregular cycles',
      medications: 'Metformin 500mg BID, HRT (Combined)',
      allergies: 'Penicillin',
      timestamp: Date.now() - 86400000
    }
  },
  appointments: {
    'appt-1': { 
      id: 'appt-1', 
      patientId: 'p-1', 
      providerId: 'prov-1', 
      time: new Date().toISOString(), // Make it today for visibility
      reason: 'Diabetes Management Review & PCOS Follow-up',
      status: 'scheduled',
      visitType: 'in_clinic'
    },
    'appt-2': { 
      id: 'appt-2', 
      patientId: 'p-2', 
      providerId: 'prov-1', 
      time: new Date(Date.now() + 3600000).toISOString(),
      reason: 'Severe Abdominal Pain and fever',
      status: 'scheduled',
      visitType: 'in_clinic'
    },
  },
  interactions: {
    'p-1': [
      {
        id: 'i-1',
        patientId: 'p-1',
        authorId: 'sw-1',
        authorRole: 'allied_health',
        type: 'social_care',
        content: 'Counseled patient on community resources for alcohol reduction programs.',
        timestamp: Date.now() - 172800000
      },
      {
        id: 'i-2',
        patientId: 'p-1',
        authorId: 'pt-1',
        authorRole: 'allied_health',
        type: 'pt',
        content: 'Routine mobility check. No major issues noted.',
        timestamp: Date.now() - 86400000
      }
    ]
  },
};

// --- Reducer (The Projection Engine) ---
function eventReducer(state: AppState, event: DomainEvent): AppState {
  // In a real CQRS system, these would happen on the read-model projection layer.
  switch (event.type) {
    case 'PATIENT_REGISTERED':
      return {
        ...state,
        patients: { ...state.patients, [event.payload.id]: event.payload },
      };
    case 'VITALS_RECORDED':
      return {
        ...state,
        vitals: {
          ...state.vitals,
          [event.payload.patientId]: [...(state.vitals[event.payload.patientId] || []), event.payload],
        },
      };
    case 'HEALTH_DATA_INGESTED':
      return {
        ...state,
        healthRecords: {
          ...state.healthRecords,
          [event.payload.patientId]: [...(state.healthRecords[event.payload.patientId] || []), event.payload],
        },
      };
    case 'CLINICAL_INTAKE_RECORDED':
      return {
        ...state,
        clinicalIntakes: {
          ...state.clinicalIntakes,
          [event.payload.patientId]: event.payload,
        },
      };
    case 'APPOINTMENT_SCHEDULED':
      return {
        ...state,
        appointments: { ...state.appointments, [event.payload.id]: event.payload },
      };
    case 'INTERACTION_RECORDED':
      return {
        ...state,
        interactions: {
          ...state.interactions,
          [event.payload.patientId]: [...(state.interactions[event.payload.patientId] || []), event.payload]
        },
      };
    default:
      return state;
  }
}

// --- Context ---
const EventContext = createContext<{
  state: AppState;
  dispatch: (event: DomainEvent) => void;
}>({ state: initialState, dispatch: () => {} });

export const EventStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // Firestore Listener for Patients
  useEffect(() => {
    const q = query(
      collection(db, 'patients')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const patient = { 
            id: change.doc.id, 
            ...data,
            name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
          } as Patient;
          
          dispatch({
            type: 'PATIENT_REGISTERED',
            payload: patient
          });
        }
      });
    }, (error) => {
      console.error("Patient sync error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Listener for Appointments (Point 2)
  useEffect(() => {
    const q = query(
      collection(db, 'appointments'),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const appt = { id: change.doc.id, ...change.doc.data() } as Appointment;
          dispatch({
            type: 'APPOINTMENT_SCHEDULED',
            payload: appt
          });
        }
      });
    }, (error) => {
      console.error("Schedule sync error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Simulate SSE/WebSocket incoming events (Health Connect updates every 5 mins)
  useEffect(() => {
    const timer = setInterval(() => {
      // Health Connect Ingestion
      dispatch({
        type: 'VITALS_RECORDED',
        payload: {
          patientId: 'p-1',
          hr: 82 + Math.floor(Math.random() * 10), // Focused around 87
          bp: `140/${85 + Math.floor(Math.random() * 10)}`, // Reflecting hypertension
          temp: 98.6 + (Math.random() * 0.4 - 0.2),
          rr: 12 + Math.floor(Math.random() * 4),
          spo2: 96 + Math.floor(Math.random() * 4),
          timestamp: Date.now(),
        },
      });

      // Also dispatch a health data ingestion event for records
      dispatch({
        type: 'HEALTH_DATA_INGESTED',
        payload: {
          id: `hr-${Date.now()}`,
          patientId: 'p-1',
          source: 'health_connect',
          type: 'heart_rate_update',
          value: 82 + Math.floor(Math.random() * 10),
          timestamp: Date.now()
        }
      });
    }, 300000); // 5 minutes in ms
    return () => clearInterval(timer);
  }, []);

  return <EventContext.Provider value={{ state, dispatch }}>{children}</EventContext.Provider>;
};

export const useQueryModel = () => {
  const { state } = useContext(EventContext);
  return state;
};

export const useCommandDispatcher = () => {
  const { dispatch } = useContext(EventContext);
  return dispatch;
};
