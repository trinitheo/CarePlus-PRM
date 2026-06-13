
import { User, UserRole } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { mockDb } from '../lib/mockDatabase';

export interface CurrentUser extends User {
  patientId?: string;
}

const SESSION_KEY = 'careplus_current_user';

export const authService = {
  async getDemoUsers() {
    return this.getRegisteredUsers();
  },

  async getRegisteredUsers(): Promise<any[]> {
    try {
      const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true';
      if (useFirestore) {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        const qSnap = await getDocs(collection(db, 'registered_users'));
        if (!qSnap.empty) {
          return qSnap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch registered users from Firestore, using mock fallback list:", err);
    }

    // Fallback: return mockDb users
    return Object.values(mockDb.users).map(u => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      patientId: u.patientId,
      avatar: u.avatar || u.profilePhoto,
      phone: u.phone,
      status: 'Active',
      createdAt: u.createdAt
    }));
  },

  async registerUser(displayName: string, email: string, role: UserRole, avatar?: string): Promise<any> {
    try {
      const emailLower = email.toLowerCase().trim();
      const defaultAvatar = avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop`;
      
      const payload = {
        displayName,
        email: emailLower,
        role,
        avatar: defaultAvatar,
        status: 'Active',
        createdAt: new Date().toISOString()
      };

      const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true';
      if (useFirestore) {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        // Check if user already exists
        const q = query(collection(db, 'registered_users'), where('email', '==', emailLower));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          throw new Error("A profile with this email address already exists.");
        }

        const docRef = await addDoc(collection(db, 'registered_users'), payload);
        return { id: docRef.id, ...payload };
      } else {
        // Mock save
        const mockId = `uid-user-${Date.now()}`;
        const finalUser = { id: mockId, ...payload, patientId: role === 'patient' ? 'pat-marcus-001' : undefined };
        mockDb.users[mockId] = finalUser;
        mockDb.roles[mockId] = { userId: mockId, role, assignedBy: 'system' };
        return finalUser;
      }
    } catch (err: any) {
      console.error("Failed to register user:", err);
      throw err;
    }
  },

  async loginWithDemo(email: string): Promise<CurrentUser> {
    try {
      const emailLower = email.toLowerCase().trim();
      const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true';
      if (useFirestore) {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        const q = query(collection(db, 'registered_users'), where('email', '==', emailLower));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0];
          const userMatched = docSnap.data();

          const user: CurrentUser = {
            id: docSnap.id,
            displayName: userMatched.displayName,
            email: userMatched.email,
            role: userMatched.role as UserRole,
            avatar: userMatched.avatar,
            patientId: userMatched.patientId || (userMatched.role === 'patient' ? 'pat-marcus-001' : undefined),
            createdAt: userMatched.createdAt || new Date().toISOString()
          };

          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          return user;
        }
      }
    } catch (err: any) {
      console.warn("Login lookup failed, falling back to mock database:", err);
    }

    const emailLower = email.toLowerCase().trim();
    const mockUser = Object.values(mockDb.users).find(u => u.email.toLowerCase().trim() === emailLower);
    if (!mockUser) {
      throw new Error("No registered profile found matching this email. Please check your registry or register a new account.");
    }

    const user: CurrentUser = {
      id: mockUser.id,
      displayName: mockUser.displayName,
      email: mockUser.email,
      role: mockUser.role as UserRole,
      avatar: mockUser.avatar,
      patientId: mockUser.patientId,
      createdAt: mockUser.createdAt
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): CurrentUser | null {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};
