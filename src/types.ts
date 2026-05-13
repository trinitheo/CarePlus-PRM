export type UserRole = 
  | 'clinician' 
  | 'nurse' 
  | 'allied_health' 
  | 'admin' 
  | 'manager' 
  | 'billing' 
  | 'front_desk' 
  | 'patient';

export type RoleCategory = 'Healthcare Staff' | 'Non-Healthcare Staff' | 'Admin Team';

export const ROLE_GROUPS: Record<RoleCategory, UserRole[]> = {
  'Healthcare Staff': ['clinician', 'nurse', 'allied_health'],
  'Non-Healthcare Staff': ['manager', 'billing', 'front_desk'],
  'Admin Team': ['admin', 'manager']
};

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

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
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
