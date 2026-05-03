import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'doctor' | 'nurse' | 'pt' | 'social_worker' | 'financial_counselor' | 'community_lead';
  displayName: string;
  specialty?: string;
}

export function useCurrentUser() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          // Default fallback for demo purposes if no profile exists yet
          // In a real app, this might redirect to profile setup
          setUserProfile({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Staff Member',
            role: 'doctor', // Default role
          });
        }
        setLoading(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  return { userProfile, loading };
}
