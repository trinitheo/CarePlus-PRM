import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { mockDbService } from '../lib/mockDatabase';
import { User } from '../types';

export function useCurrentUser() {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        // Fallback for development if no user is signed in
        const mockUser = mockDbService.getDoc('users', 'system');
        if (mockUser) {
          setUserProfile({ id: 'system', ...mockUser } as User);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
        return;
      }

      const profile = mockDbService.getDoc('users', user.uid);
      if (profile) {
        setUserProfile({ id: user.uid, ...profile } as User);
      } else {
        // Create basic profile if missing in mock
        const basicProfile = {
          email: user.email,
          displayName: user.displayName,
          role: 'admin' // Default to admin for mock/poc
        };
        mockDbService.updateItem('users', user.uid, basicProfile);
        setUserProfile({ id: user.uid, ...basicProfile } as User);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  return { userProfile, loading, authUser: auth.currentUser };
}
