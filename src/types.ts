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
