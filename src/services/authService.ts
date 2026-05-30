
import { User, UserRole } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const qSnap = await getDocs(collection(db, 'registered_users'));
      return qSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (err) {
      console.warn("Failed to fetch registered users from Firestore:", err);
      return [];
    }
  },

  async registerUser(displayName: string, email: string, role: UserRole, avatar?: string): Promise<any> {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
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

      // Check if user already exists
      const q = query(collection(db, 'registered_users'), where('email', '==', emailLower));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        throw new Error("A profile with this email address already exists.");
      }

      const docRef = await addDoc(collection(db, 'registered_users'), payload);
      return { id: docRef.id, ...payload };
    } catch (err: any) {
      console.error("Failed to register user in Firestore:", err);
      throw err;
    }
  },

  async loginWithDemo(email: string): Promise<CurrentUser> {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
      const emailLower = email.toLowerCase().trim();
      const q = query(collection(db, 'registered_users'), where('email', '==', emailLower));
      const qSnap = await getDocs(q);
      
      if (qSnap.empty) {
        throw new Error("No registered profile found matching this email. Please check your registry or register a new account.");
      }

      const docSnap = qSnap.docs[0];
      const userMatched = docSnap.data();

      const user: CurrentUser = {
        id: docSnap.id,
        displayName: userMatched.displayName,
        email: userMatched.email,
        role: userMatched.role as UserRole,
        avatar: userMatched.avatar,
        patientId: userMatched.patientId || (userMatched.role === 'patient' ? `p-${docSnap.id}` : undefined),
        createdAt: userMatched.createdAt || new Date().toISOString()
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (err: any) {
      console.error("Login lookup failed:", err);
      throw err;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): CurrentUser | null {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};
