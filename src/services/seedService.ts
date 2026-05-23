import { faker } from '@faker-js/faker';
import { savePatient, saveUserProfile, addToCareTeam, saveClinicalIntake, updatePatientVitals } from './clinicalFirestoreService';
import { AppRole } from './rbacService';

export interface SeedProgress {
  step: string;
  count: number;
  total: number;
}

export type SeedCallback = (progress: SeedProgress) => void;

/**
 * SeedService implements a graph-ready clinical data generation engine.
 * It follows the logic provided in the user's Go script example but adapted for TypeScript/Firebase.
 */
export const SeedService = {
  /**
   * Seeds the application with a "Care Network Graph" consisting of providers,
   * patients, and clinical relationships.
   */
  async seedCareNetwork(onProgress?: SeedCallback) {
    console.log('Seeding Graph Network...');
    
    // --- 1. CREATE PROVIDER NODES ---
    const providerCount = 3;
    const providerIds: string[] = [];
    const specialties = ['Neurosurgery', 'Neurology', 'Critical Care'];

    for (let i = 0; i < providerCount; i++) {
      const id = `prov-${faker.string.uuid().slice(0, 8)}`;
      const name = i === 0 ? 'Dr. James Wilson' : `Dr. ${faker.person.fullName()}`; // Keep James Wilson as primary anchor
      const specialty = specialties[i] || 'Neurosurgery';
      
      const providerData = {
        id,
        displayName: name,
        email: faker.internet.email().toLowerCase(),
        role: 'clinician' as AppRole,
        specialty,
        bio: `${specialty} specialist with focus on clinical precision.`,
        createdAt: new Date().toISOString()
      };

      await saveUserProfile(id, providerData);
      providerIds.push(id);
      
      onProgress?.({ step: 'Creating Providers', count: i + 1, total: providerCount });
    }

    // --- 2. CREATE PATIENT NODES ---
    const patientCount = 10;
    const conditions = ['Subdural Hematoma', 'Glioblastoma', 'Trigeminal Neuralgia', 'Spinal Stenosis', 'Hydrocephalus'];
    const patientIds: string[] = [];

    for (let i = 0; i < patientCount; i++) {
      const id = `pt-${faker.string.uuid().slice(0, 8)}`;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const condition = conditions[faker.number.int({ min: 0, max: conditions.length - 1 })];
      const birthDate = faker.date.birthdate({ min: 18, max: 90, mode: 'age' });

      const patientData = {
        id,
        mrn: `MRN-${faker.number.int({ min: 10000, max: 99999 })}-${firstName[0]}${lastName[0]}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        gender: faker.person.sexType() === 'female' ? 'Female' : 'Male',
        dob: birthDate.toISOString().split('T')[0],
        phone: faker.phone.number(),
        status: 'active',
        conditions: [condition],
        chiefComplaint: `Referred for evaluation of ${condition}.`,
        createdAt: new Date().toISOString()
      };

      await savePatient(id, patientData);
      patientIds.push(id);
      
      // Seed initial vitals for graph density
      await updatePatientVitals(id, {
        hr: faker.number.int({ min: 60, max: 100 }),
        bp: `${faker.number.int({ min: 110, max: 140 })}/${faker.number.int({ min: 70, max: 90 })}`,
        temp: faker.number.float({ min: 36.5, max: 37.8, multipleOf: 0.1 }),
        rr: faker.number.int({ min: 12, max: 20 }),
        spo2: faker.number.int({ min: 96, max: 99 }),
        timestamp: Date.now()
      });

      onProgress?.({ step: 'Creating Patients', count: i + 1, total: patientCount });
    }

    // --- 3. DRAW EDGES (Relationships) ---
    console.log('Drawing Edges [:TREATED_BY]...');
    for (const [index, patientId] of patientIds.entries()) {
      // Assign each patient to a random provider
      const providerId = providerIds[faker.number.int({ min: 0, max: providerIds.length - 1 })];
      
      // Relationship Edge Meta
      const edgeData = {
        role: 'primary_clinician',
        assignedBy: 'system',
        priority: 'high',
        careNetwork: 'Neurosurgery-Specialized'
      };

      await addToCareTeam(patientId, providerId, edgeData);
      
      // Create an intake record to bind the relationship clinically
      const intakeId = `intake-${faker.string.uuid().slice(0, 8)}`;
      await saveClinicalIntake(patientId, intakeId, {
        id: intakeId,
        patientId,
        providerId,
        chiefComplaint: `Clinical evaluation for Graph Projection.`,
        historyOfPresentIllness: `Patient establishing care within the Graph Network.`,
        timestamp: Date.now()
      });

      onProgress?.({ step: 'Drawing Relationships', count: index + 1, total: patientCount });
    }

    console.log('Seeding Complete. Knowledge Graph updated.');
  }
};
