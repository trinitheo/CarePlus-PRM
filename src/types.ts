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
