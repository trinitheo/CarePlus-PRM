import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { authService, CurrentUser } from '../services/authService';
import { onSnapshot, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { saveUserProfile } from '../services/clinicalFirestoreService';
import { removeAllPatientsFromNurseProfiles, NEW_NURSE_PROFILE } from '../services/nurseService';

export function useCurrentUser() {
  const [userProfile, setUserProfile] = useState<CurrentUser | null>(() => {
    const active = authService.getCurrentUser();
    if (active && active.role === 'nurse') {
      removeAllPatientsFromNurseProfiles().catch(console.warn);
      // If active nurse is an old default nurse profile, upgrade to the newly added nurse profile
      if (active.id !== NEW_NURSE_PROFILE.id) {
        const freshNurse: CurrentUser = {
          id: NEW_NURSE_PROFILE.id,
          displayName: NEW_NURSE_PROFILE.displayName,
          email: NEW_NURSE_PROFILE.email,
          role: 'nurse',
          avatar: NEW_NURSE_PROFILE.avatar,
          createdAt: NEW_NURSE_PROFILE.createdAt
        };
        localStorage.setItem('careplus_current_user', JSON.stringify(freshNurse));
        return freshNurse;
      }
    }
    return active;
  });
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
            setLoading(false);
          } else {
            // Fallback to local storage if doc doesn't exist yet
            const demoUser = authService.getCurrentUser();
            if (demoUser) {
              setUserProfile(demoUser);
              setLoading(false); // Non-blocking: Allow user to interact immediately
              // CRITICAL: Auto-re-sync profile to real Firestore if it's missing in the cloud!
              saveUserProfile(user.uid, {
                ...demoUser,
                id: user.uid,
                originalId: demoUser.id
              }).catch(err => {
                console.warn("Failed to auto-resync user profile:", err);
              });
            } else {
              setLoading(false);
            }
          }
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
        // If not logged into Firebase, check if there is a local session to restore
        const demoUser = authService.getCurrentUser();
        if (demoUser) {
          setUserProfile(demoUser);
          setLoading(false); // Non-blocking: Allow user to interact immediately
          signInAnonymously(auth).then(async (cred) => {
            await saveUserProfile(cred.user.uid, {
              ...demoUser,
              id: cred.user.uid,
              originalId: demoUser.id
            });
          }).catch(err => {
            console.warn("Auto-signin on session load failed:", err);
          });
        } else {
          refreshProfile();
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return { userProfile, loading, authUser: auth.currentUser, refreshProfile };
}
