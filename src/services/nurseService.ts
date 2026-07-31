import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { authService, CurrentUser } from './authService';
import { mockDb } from '../lib/mockDatabase';
import { saveUserProfile } from './clinicalFirestoreService';

export const NEW_NURSE_PROFILE = {
  id: 'uid-nurse-alex-001',
  displayName: 'Nurse Alex Morgan, RN',
  email: 'alex.morgan@careplus.health',
  role: 'nurse' as const,
  phone: '(555) 890-1234',
  licenseNumber: 'RN-782910',
  department: 'Clinical Operations & Triage',
  avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop',
  status: 'Active',
  createdAt: new Date().toISOString()
};

export async function removeAllPatientsFromNurseProfiles() {
  console.log('Removing all patients from nurse profiles...');

  const knownNurseIds = ['uid-nurse-001', 'user-clinic-002', 'demo-staff-renee-castillo', 'uid-nurse-alex-001'];
  
  // Also include current user ID if role is nurse
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.role === 'nurse' && !knownNurseIds.includes(currentUser.id)) {
    knownNurseIds.push(currentUser.id);
  }

  // 1. Clear care team subcollections for nurses in Firestore
  try {
    const patientsSnap = await getDocs(collection(db, 'patients'));
    for (const patientDoc of patientsSnap.docs) {
      const patientId = patientDoc.id;
      for (const nurseId of knownNurseIds) {
        try {
          await deleteDoc(doc(db, 'patients', patientId, 'care_teams', nurseId));
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('Firestore patient care team clearance warning:', err);
  }

  // 2. Clear care team records in mockDb
  if (mockDb.care_teams) {
    for (const patientId of Object.keys(mockDb.care_teams)) {
      if (Array.isArray(mockDb.care_teams[patientId])) {
        mockDb.care_teams[patientId] = mockDb.care_teams[patientId].filter(
          (ct: any) => !knownNurseIds.includes(ct.userId) && ct.role !== 'case_manager'
        );
      }
    }
  }

  // 3. Clear/unassign tasks assigned to nurses in Firestore and mockDb
  try {
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    for (const taskDoc of tasksSnap.docs) {
      const data = taskDoc.data();
      if (data.assignedTo && knownNurseIds.includes(data.assignedTo)) {
        await deleteDoc(doc(db, 'tasks', taskDoc.id));
      }
    }
  } catch (err) {
    console.warn('Firestore tasks clearance warning:', err);
  }

  if (Array.isArray(mockDb.tasks)) {
    mockDb.tasks = mockDb.tasks.filter((t: any) => !knownNurseIds.includes(t.assignedTo));
  }

  import('../lib/mockDatabase').then(m => m.persistMockDb());
  console.log('Care team nurse assignments cleared.');
}

export async function beginAsNewlyAddedNurseProfile(): Promise<CurrentUser> {
  // Step 1: Remove all patients from nurse profiles
  await removeAllPatientsFromNurseProfiles();

  // Step 2: Create / Save new nursing profile in Firestore and mockDb
  const profile = { ...NEW_NURSE_PROFILE, createdAt: new Date().toISOString() };

  // Register in mockDb
  mockDb.users[profile.id] = profile;
  mockDb.roles[profile.id] = { userId: profile.id, role: 'nurse', assignedBy: 'system' };
  import('../lib/mockDatabase').then(m => m.persistMockDb());

  // Save in Firestore
  try {
    await saveUserProfile(profile.id, profile);
    await setDoc(doc(db, 'roles', profile.id), {
      userId: profile.id,
      role: 'nurse',
      assignedBy: 'system',
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Failed to write new nurse profile to Firestore:', e);
  }

  // Step 3: Switch active session to this newly added nursing profile
  const currentUserSession: CurrentUser = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.email,
    role: 'nurse',
    avatar: profile.avatar,
    createdAt: profile.createdAt
  };

  localStorage.setItem('careplus_current_user', JSON.stringify(currentUserSession));
  return currentUserSession;
}
