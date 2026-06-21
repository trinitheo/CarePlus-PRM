export interface PatientFinancial {
  patientId: string;
  billingAccountId?: string;
  balance?: number;
  insurance?: {
    provider?: string;
    policyNumber?: string;
    status?: 'verified' | 'pending' | 'mismatched';
  };
  copayDue?: number;
}
