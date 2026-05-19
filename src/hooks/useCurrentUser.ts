import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { authService, CurrentUser } from '../services/authService';
import { onSnapshot, doc } from 'firebase/firestore';

export function useCurrentUser() {
  const [userProfile, setUserProfile] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = () => {
    const demoUser = authService.getCurrentUser();
    if (demoUser) {
      setUserProfile(demoUser);
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Check local storage first
    refreshProfile();
    
    let unsubDoc: (() => void) | null = null;

    // Then listen to Firebase Auth for real logins
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // Cleanup previous doc listener if any
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (user) {
        // Listen to the real Firestore document for role and other synced data
        unsubDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({
              id: user.uid,
              ...docSnap.data()
            } as CurrentUser);
          } else {
            // Fallback to local storage if doc doesn't exist yet
            const demoUser = authService.getCurrentUser();
            if (demoUser) {
              setUserProfile(demoUser);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("User profile snapshot error (permission or network):", error);
          setLoading(false);
          // Fallback to local storage on error
          const demoUser = authService.getCurrentUser();
          if (demoUser) {
            setUserProfile(demoUser);
          }
        });
      } else {
        // If not logged into Firebase, refresh from local storage (demo)
        refreshProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return { userProfile, loading, authUser: auth.currentUser, refreshProfile };
}
