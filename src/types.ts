export type UserRole = 'clinician' | 'nurse' | 'allied_health' | 'admin' | 'billing' | 'patient' | 'manager' | 'front_desk' | 'pt' | 'read_only';

export type AlliedHealthSpecialty = 
  | 'Physiotherapist' 
  | 'Psychologist' 
  | 'Physical Therapist' 
  | 'Speech Therapist' 
  | 'Medical assistant' 
  | 'Nursing assistant' 
  | 'Dietitian' 
  | 'Nutritionist' 
  | 'Optometrist';

export interface Patient {
  id: string; // The app unique identifier (linked to User.id)
  mrn: string; // Medical Record Number (Unique clinical identifier)
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  conditions?: string[];
  lastVisit?: string;
  tags?: string[];
  chiefComplaint?: string;
  isDraft?: boolean;
  authorizedUserIds?: string[]; // Accounts/proxies authorized to access this chart
  createdAt: any;
}

export interface MedicalNode {
  id: string;
  type: 'identity' | 'narrative' | 'background' | 'screening' | 'objective' | 'synthesis' | 'disposition';
  position: { x: number; y: number };
  data: {
    label: string;
    details: string;
    status: 'normal' | 'abnormal' | 'critical' | 'pending';
    category?: string;
    dob?: string;
    icon?: any;
  };
}

export interface ClinicalHistoryMap {
  nodes: MedicalNode[];
  edges: { id: string; source: string; target: string; label?: string }[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  patientId?: string; // Point to connected Patient chart for patient role / proxies
  specialty?: string | AlliedHealthSpecialty;
  organizationId?: string;
  dashboardSettings?: Record<'compact' | 'medium' | 'expanded', {
    order: string[];
    visibility: Record<string, boolean>;
    sizes: Record<string, '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2'>;
  }>;
  createdAt: any;
}

export interface CareTeamMember {
  id: string;
  patientId: string;
  userId: string;
  userRole: string;
  userSpecialty: string;
  accessLevel: 'clinical_full' | 'clinical_limited' | 'administrative';
  status: 'active' | 'inactive';
  assignedAt: any;
  expiresAt?: any;
}

export interface MedicalRecordEntry {
  id: string;
  type: 'InitialEncounter' | 'FollowUp' | 'Prescription' | 'Referral' | 'Procedure' | 'AISummary' | 'ClinicalRecord' | 'Investigation';
  timestamp: number;
  data: {
    authorName?: string;
    content?: string;
    [key: string]: any;
  };
}

export type InvestigationStatus = 'ordered' | 'sample_collected' | 'resulted' | 'reviewed' | 'cancelled';

export interface Investigation {
  id: string;
  patientId: string;
  category: 'laboratory' | 'imaging' | 'functional';
  tests: { testName: string; result?: string; unit?: string; referenceRange?: string }[];
  priority: string;
  indication: string;
  instructions: string;
  status: InvestigationStatus;
  resultSummary?: string;
  resultDate?: number;
  authorId: string;
  createdAt: any;
  updatedAt?: any;
}
