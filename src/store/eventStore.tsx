import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// --- Domain Events ---
export type DomainEvent =
  | { type: 'PATIENT_REGISTERED'; payload: Patient }
  | { type: 'VITALS_RECORDED'; payload: { patientId: string; hr: number; bp: string; temp: number; timestamp: number } }
  | { type: 'APPOINTMENT_SCHEDULED'; payload: { id: string; patientId: string; providerId: string; time: string; reason: string } }
  | { type: 'HEALTH_DATA_INGESTED'; payload: { id: string; patientId: string; source: 'watch' | 'medication_log' | 'diet' | 'health_connect'; type: string; value: any; timestamp: number } }
  | { type: 'CLINICAL_INTAKE_RECORDED'; payload: ClinicalIntake };

// --- State Model ---
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
  name: string;
  dob: string;
  mrn: string;
  gender?: string;
  sex?: string;
  bloodType?: string;
  age?: number;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'pending' | 'discharged';
  conditions?: string[];
  lastVisit?: string;
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

export interface HealthRecord {
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
  reason: string;
}

export interface AppState {
  patients: Record<string, Patient>;
  vitals: Record<string, Vitals[]>;
  healthRecords: Record<string, HealthRecord[]>;
  clinicalIntakes: Record<string, ClinicalIntake | undefined>;
  appointments: Record<string, Appointment>;
  eventLog: DomainEvent[];
}

const initialState: AppState = {
  patients: {
    'p-1': { 
      id: 'p-1', 
      name: 'Eleanor Vance', 
      dob: '1982-04-12', 
      mrn: 'MRN-78234-A', 
      status: 'active', 
      email: 'e.vance@example.com',
      sex: 'Female',
      age: 42,
      bloodType: 'A+',
      gender: 'Woman',
      conditions: ['Hypertensive disease', 'Inflammatory Bowel Disease', 'Diabetes mellitus type 2'],
      lastVisit: '2024-06-12'
    },
    'p-2': { 
      id: 'p-2', 
      name: 'Marcus Brody', 
      dob: '1975-11-03', 
      mrn: 'MRN-19230-B', 
      status: 'active', 
      email: 'm.brody@museum.org',
      sex: 'Male',
      age: 50,
      bloodType: 'O-',
      gender: 'Man',
      conditions: ['Arthritis', 'Hyperlipidemia'],
      lastVisit: '2024-05-10'
    },
  },
  vitals: {
    'p-1': [{ patientId: 'p-1', hr: 72, bp: '120/80', temp: 98.6, timestamp: Date.now() - 3600000 }],
  },
  healthRecords: {
    'p-1': [],
  },
  clinicalIntakes: {
    'p-1': {
      id: 'intake-1',
      patientId: 'p-1',
      chiefComplaint: 'Occasional chest pain',
      historyOfPresentIllness: 'Chest pain exacerbated by exercise',
      medicalHistory: 'Hypertension',
      familyHistory: 'Father with early MI',
      socialHistory: 'Non-smoker',
      surgicalHistory: 'Appendectomy (2005)',
      immunizations: 'Up to date with COVID and Flu',
      hospitalizations: 'None in last 5 years',
      reviewOfSystems: 'Negative for weight loss, positive for dyspnea',
      medications: 'Lisinopril',
      allergies: 'Penicillin',
      timestamp: Date.now() - 86400000
    }
  },
  appointments: {
    'appt-1': { id: 'appt-1', patientId: 'p-1', providerId: 'prov-1', time: '2026-04-26T09:00:00Z', reason: 'Follow-up' },
  },
  eventLog: [],
};

// --- Reducer (The Projection Engine) ---
function eventReducer(state: AppState, event: DomainEvent): AppState {
  // In a real CQRS system, these would happen on the read-model projection layer.
  switch (event.type) {
    case 'PATIENT_REGISTERED':
      return {
        ...state,
        patients: { ...state.patients, [event.payload.id]: event.payload },
        eventLog: [...state.eventLog, event],
      };
    case 'VITALS_RECORDED':
      return {
        ...state,
        vitals: {
          ...state.vitals,
          [event.payload.patientId]: [...(state.vitals[event.payload.patientId] || []), event.payload],
        },
        eventLog: [...state.eventLog, event],
      };
    case 'HEALTH_DATA_INGESTED':
      return {
        ...state,
        healthRecords: {
          ...state.healthRecords,
          [event.payload.patientId]: [...(state.healthRecords[event.payload.patientId] || []), event.payload],
        },
        eventLog: [...state.eventLog, event],
      };
    case 'CLINICAL_INTAKE_RECORDED':
      return {
        ...state,
        clinicalIntakes: {
          ...state.clinicalIntakes,
          [event.payload.patientId]: event.payload,
        },
        eventLog: [...state.eventLog, event],
      };
    case 'APPOINTMENT_SCHEDULED':
      return {
        ...state,
        appointments: { ...state.appointments, [event.payload.id]: event.payload },
        eventLog: [...state.eventLog, event],
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

  // Simulate SSE/WebSocket incoming events
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate an external background event
      if (Math.random() > 0.8) {
        dispatch({
          type: 'VITALS_RECORDED',
          payload: {
            patientId: 'p-1',
            hr: 70 + Math.floor(Math.random() * 15),
            bp: `120/${75 + Math.floor(Math.random() * 10)}`,
            temp: 98.6 + (Math.random() * 0.4 - 0.2),
            timestamp: Date.now(),
          },
        });
      }
    }, 15000); // Every 15 seconds, a random update might occur
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
