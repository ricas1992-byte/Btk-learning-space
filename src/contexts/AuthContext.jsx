import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[AuthContext] useEffect started - checking auth state');
    console.log('[AuthContext] Current auth object:', auth);
    console.log('[AuthContext] Current user from auth:', auth.currentUser?.email || 'null');

    // בדיקת localStorage ו-sessionStorage לדיבאג
    console.log('[AuthContext] Checking storage:');
    try {
      // Firebase שומר את ה-auth state תחת מפתחות ספציפיים
      const localStorageKeys = Object.keys(localStorage);
      console.log('[AuthContext] localStorage keys:', localStorageKeys);
      const firebaseKeys = localStorageKeys.filter(key => key.includes('firebase'));
      console.log('[AuthContext] Firebase related keys:', firebaseKeys);

      // הדפס את התוכן של כל מפתח Firebase
      firebaseKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`[AuthContext] localStorage['${key}']:`, value?.substring(0, 100) + '...');
      });
    } catch (e) {
      console.error('[AuthContext] Error checking localStorage:', e);
    }

    // בדיקת תוצאה מ-redirect (כשהמשתמש חוזר מגוגל)
    console.log('[AuthContext] Calling getRedirectResult...');
    getRedirectResult(auth)
      .then((result) => {
        console.log('[AuthContext] getRedirectResult completed');
        if (result && result.user) {
          // המשתמש התחבר בהצלחה דרך redirect
          console.log('[AuthContext] ✅ User signed in via redirect:', result.user.email);
          console.log('[AuthContext] User details:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
          });
          setUser(result.user);
          setLoading(false);
        } else {
          console.log('[AuthContext] No redirect result found (user did not just return from Google)');
          // אם אין redirect result, נבדק אם יש user קיים דרך onAuthStateChanged
        }
      })
      .catch((error) => {
        console.error('[AuthContext] ❌ Error getting redirect result:', error);
        console.error('[AuthContext] Error code:', error.code);
        console.error('[AuthContext] Error message:', error.message);
        setError(error.message);
        setLoading(false);
      });

    // מאזין לשינויים בסטטוס ההתחברות
    console.log('[AuthContext] Setting up onAuthStateChanged listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] 🔔 onAuthStateChanged triggered');
      if (user) {
        console.log('[AuthContext] ✅ User is logged in:', user.email);
        console.log('[AuthContext] User details:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        console.log('[AuthContext] ❌ No user logged in');
      }
      setUser(user);
      setLoading(false);
    });

    // ניקוי המאזין כשהקומפוננט נהרס
    return () => {
      console.log('[AuthContext] Cleaning up - unsubscribing from onAuthStateChanged');
      unsubscribe();
    };
  }, []);

  // התחברות עם Google
  const signInWithGoogle = async () => {
    try {
      console.log('[AuthContext] signInWithGoogle called - redirecting to Google...');
      setError(null);
      await signInWithRedirect(auth, googleProvider);
      // הפונקציה לא תחזיר דבר כי הדפדפן יעבור לגוגל
      // התוצאה תטופל ב-useEffect עם getRedirectResult
    } catch (error) {
      console.error('[AuthContext] Error signing in with Google:', error);
      setError(error.message);
      throw error;
    }
  };

  // התנתקות
  const signOut = async () => {
    try {
      console.log('[AuthContext] signOut called');
      setError(null);
      await firebaseSignOut(auth);
      console.log('[AuthContext] User signed out successfully');
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
