
import { User, UserRole } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CurrentUser extends User {
  patientId?: string;
}

const mockUsers: Array<{
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'Active' | 'Inactive';
}> = [
  { id: 'admin-1', displayName: 'Dr. Evelyn Chen', email: 'e.chen@careplus.ai', role: 'admin', avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop', status: 'Active' },
  { id: 'clinician-1', displayName: 'Dr. David Smith', email: 'd.smith@careplus.ai', role: 'clinician', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da60710?q=80&w=200&auto=format&fit=crop', status: 'Active' },
  { id: 'nurse-1', displayName: 'Robert Johnson', email: 'r.johnson@careplus.ai', role: 'nurse', avatar: 'https://images.unsplash.com/photo-1537368910025-7003507965b6?q=80&w=200&auto=format&fit=crop', status: 'Active' },
  { id: 'manager-1', displayName: 'Alicia Rodriguez', email: 'a.rodriguez@careplus.ai', role: 'manager', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop', status: 'Active' },
  { id: 'billing-1', displayName: 'Sandra Dee', email: 's.dee@careplus.ai', role: 'billing', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop', status: 'Active' },
  { id: 'allied-1', displayName: 'Michael Lee', email: 'm.lee@careplus.ai', role: 'allied_health', avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=200&auto=format&fit=crop', status: 'Active' },
  { id: 'patient-1', displayName: 'Benjamin Carter', email: 'b.carter@personal.com', role: 'patient', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop', status: 'Active' },
];

const SESSION_KEY = 'careplus_current_user';

export const authService = {
  async getDemoUsers() {
    return mockUsers;
  },

  async loginWithDemo(email: string): Promise<CurrentUser> {
    const userMatched = mockUsers.find(u => u.email === email);
    if (!userMatched) throw new Error("User not found");

    const user: CurrentUser = {
      id: userMatched.id,
      displayName: userMatched.displayName,
      email: userMatched.email,
      role: userMatched.role,
      avatar: userMatched.avatar,
      patientId: userMatched.role === 'patient' ? `p-1` : undefined,
      createdAt: new Date().toISOString()
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
