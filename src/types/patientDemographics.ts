export interface PatientDemographics {
  id: string;
  mrn?: string;
  firstName: string;
  lastName: string;
  name?: string;
  dob: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending';
  authorizedUserIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}
