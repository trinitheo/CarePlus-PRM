export interface PatientClinical {
  patientId: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  clinicalSummary?: string;
  lastVisit?: number;
  chiefComplaint?: string;
  healthScore?: number;
  tags?: string[];
}
