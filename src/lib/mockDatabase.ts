
import { AppRole } from '../services/rbacService';

export interface MockDb {
  users: Record<string, any>;
  roles: Record<string, any>;
  patients: Record<string, any>;
  clinical_records: Record<string, any[]>;
  prescriptions: Record<string, any[]>;
  investigations: Record<string, any[]>;
  procedures: Record<string, any[]>;
  vitals: Record<string, any[]>;
  interactions: Record<string, any[]>;
  appointments: any[];
  clinical_intakes: Record<string, any[]>;
  rooms: any[];
  inventory: any[];
  tasks: any[];
  reminders: any[];
  messages: any[];
  audit_logs: any[];
  sops: any[];
  charges: any[];
  invoices: any[];
  checkins: any[];
  consents: any[];
  clinical_templates: any[];
  results: any[];
  referrals: Record<string, any[]>;
  care_teams: Record<string, any[]>;
}

const INITIAL_DB: MockDb = {
  users: {
    'admin-user-1': {
      id: 'admin-user-1',
      email: 'admin@careplus.com',
      displayName: 'System Admin',
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    'clinician-user-1': {
      id: 'clinician-user-1',
      email: 'clinician@careplus.com',
      displayName: 'Dr. James Wilson',
      role: 'clinician',
      specialty: 'Internal Medicine',
      createdAt: new Date().toISOString()
    },
    'nurse-user-1': {
      id: 'nurse-user-1',
      email: 'nurse@careplus.com',
      displayName: 'Nurse Jackie',
      role: 'nurse',
      createdAt: new Date().toISOString()
    },
    'allied-health-user-1': {
      id: 'allied-health-user-1',
      email: 'dietitian@careplus.com',
      displayName: 'Jane Doe',
      role: 'allied_health',
      specialty: 'Dietitian',
      createdAt: new Date().toISOString()
    },
    'billing-user-1': {
      id: 'billing-user-1',
      email: 'billing@careplus.com',
      displayName: 'Billie Billing',
      role: 'billing',
      createdAt: new Date().toISOString()
    },
    'sarah-mitchell-42': {
      id: 'sarah-mitchell-42',
      email: 'sarah.mitchell@example.com',
      displayName: 'Sarah Mitchell',
      role: 'patient',
      createdAt: new Date().toISOString()
    }
  },
  roles: {
    'admin-user-1': { userId: 'admin-user-1', role: 'admin', assignedBy: 'system' },
    'clinician-user-1': { userId: 'clinician-user-1', role: 'clinician', assignedBy: 'admin-user-1' },
    'nurse-user-1': { userId: 'nurse-user-1', role: 'nurse', assignedBy: 'admin-user-1' },
    'allied-health-user-1': { userId: 'allied-health-user-1', role: 'allied_health', assignedBy: 'admin-user-1' },
    'billing-user-1': { userId: 'billing-user-1', role: 'billing', assignedBy: 'admin-user-1' },
    'sarah-mitchell-42': { userId: 'sarah-mitchell-42', role: 'patient', assignedBy: 'system' }
  },
  patients: {
    'sarah-mitchell-42': {
      id: 'sarah-mitchell-42', // Linked to User.id
      mrn: 'MRN-77291-SM', // Unique clinical record identifier
      firstName: 'Sarah',
      lastName: 'Mitchell',
      name: 'Sarah Mitchell',
      dob: '1984-03-15',
      gender: 'Female',
      age: 42,
      email: 'sarah.mitchell@example.com',
      phone: '(555) 091-8827',
      status: 'active',
      conditions: [
        'Diabetes Mellitus Type 2 (Newly Diagnosed)',
        'Obesity',
        'PCOS (Polycystic Ovary Syndrome)'
      ],
      lastVisit: new Date().toISOString(),
      tags: ['Health Connect', 'Android Wear'],
      chiefComplaint: 'Management of newly diagnosed Diabetes and PCOS symptoms'
    }
  },
  clinical_records: {
    'sarah-mitchell-42': [
      {
        id: 'note-1',
        title: 'Initial Consultation',
        authorName: 'Dr. James Wilson',
        specialty: 'Internal Medicine',
        content: 'Patient presents for initial diabetes management plan.',
        status: 'signed',
        priority: 'routine',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 2 }
      }
    ]
  },
  prescriptions: {
    'sarah-mitchell-42': [
      { id: 'rx-1', medicationName: 'Metformin', dosage: '500mg', frequency: 'Twice daily', status: 'active', condition: 'Type 2 Diabetes', createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 2 } },
      { id: 'rx-2', medicationName: 'HRT (Combined)', dosage: 'Varies', frequency: 'Daily', status: 'active', condition: 'PCOS / Hormone Replacement', createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 5 } }
    ]
  },
  investigations: {
    'sarah-mitchell-42': []
  },
  procedures: {
    'sarah-mitchell-42': []
  },
  vitals: {
    'sarah-mitchell-42': [
      { id: 'v-1', type: 'blood_glucose', value: 140, createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 } }
    ]
  },
  interactions: {
    'sarah-mitchell-42': []
  },
  appointments: [],
  clinical_intakes: {
    'sarah-mitchell-42': [
      {
        id: 'initial-intake',
        patientId: 'sarah-mitchell-42',
        chiefComplaint: 'Management of newly diagnosed Diabetes and PCOS symptoms',
        historyOfPresentIllness: 'Sarah is a 42-year-old female recently diagnosed with Type 2 Diabetes. She has a long-standing history of PCOS and obesity.',
        medicalHistory: 'PCOS, Obesity, Type 2 Diabetes (New)',
        medications: 'Metformin 500mg BID, HRT (Estrogen/Progesterone)',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 3 }
      }
    ]
  },
  rooms: [],
  inventory: [],
  tasks: [],
  reminders: [],
  messages: [],
  audit_logs: [],
  sops: [],
  charges: [],
  invoices: [],
  checkins: [],
  consents: [],
  clinical_templates: [],
  results: [],
  referrals: {},
  care_teams: {}
};

// Global singleton for the mock DB in development
const globalForMock = globalThis as unknown as { mockDb: MockDb };
export const mockDb = globalForMock.mockDb || INITIAL_DB;
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb;

export const mockDbService = {
  getCollection: (path: keyof MockDb, patientId?: string): any[] => {
    if (patientId) {
      return (mockDb[path] as Record<string, any[]>)[patientId] || [];
    }
    const val = mockDb[path];
    if (Array.isArray(val)) return val;
    return [];
  },
  
  addItem: (path: keyof MockDb, data: any, patientId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const item = { ...data, id, createdAt: { seconds: Math.floor(Date.now() / 1000) } };
    
    if (patientId) {
      if (!(mockDb[path] as Record<string, any[]>)[patientId]) {
        (mockDb[path] as Record<string, any[]>)[patientId] = [];
      }
      (mockDb[path] as Record<string, any[]>)[patientId].unshift(item);
    } else if (Array.isArray(mockDb[path])) {
      (mockDb[path] as any[]).unshift(item);
    }
    
    return id;
  },

  updateItem: (path: keyof MockDb, id: string, data: any, patientId?: string) => {
    if (patientId) {
      const items = (mockDb[path] as Record<string, any[]>)[patientId] || [];
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: { seconds: Math.floor(Date.now() / 1000) } };
      }
    } else if (Array.isArray(mockDb[path])) {
      const items = mockDb[path] as any[];
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: { seconds: Math.floor(Date.now() / 1000) } };
      }
    } else if (mockDb[path] && typeof mockDb[path] === 'object' && !Array.isArray(mockDb[path])) {
      (mockDb[path] as Record<string, any>)[id] = { ...(mockDb[path] as Record<string, any>)[id], ...data };
    }
  },

  getDoc: (path: keyof MockDb, id: string) => {
    return (mockDb[path] as Record<string, any>)[id];
  }
};
