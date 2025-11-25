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

    // משתנה עבור cleanup
    let unsubscribe;

    // פונקציה אסינכרונית לטיפול ב-redirect ואז ב-auth state
    const initAuth = async () => {
      try {
        // שלב 1: בדוק אם יש redirect result (כשהמשתמש חוזר מגוגל)
        console.log('[AuthContext] ⏳ Calling getRedirectResult...');
        const result = await getRedirectResult(auth);

        if (result && result.user) {
          // המשתמש התחבר בהצלחה דרך redirect
          console.log('[AuthContext] ✅ User signed in via redirect:', result.user.email);
          console.log('[AuthContext] User details:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
          });
          // עדכן את ה-state מיד
          setUser(result.user);
          setLoading(false);
        } else {
          console.log('[AuthContext] No redirect result found (user did not just return from Google)');
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Error getting redirect result:', error);
        console.error('[AuthContext] Error code:', error.code);
        console.error('[AuthContext] Error message:', error.message);
        setError(error.message);
      }

      // שלב 2: הגדר מאזין לשינויים בסטטוס ההתחברות
      // זה ירוץ רק אחרי ש-getRedirectResult סיים
      console.log('[AuthContext] Setting up onAuthStateChanged listener...');
      unsubscribe = onAuthStateChanged(auth, (user) => {
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
    };

    // הרץ את האתחול
    initAuth();

    // ניקוי המאזין כשהקומפוננט נהרס
    return () => {
      console.log('[AuthContext] Cleaning up - unsubscribing from onAuthStateChanged');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // התחברות עם Google
  const signInWithGoogle = async () => {
    try {
      console.log('[AuthContext] 🚀 signInWithGoogle called - starting redirect process...');
      console.log('[AuthContext] Auth object:', auth);
      console.log('[AuthContext] Google Provider:', googleProvider);
      setError(null);

      console.log('[AuthContext] ⏳ Calling signInWithRedirect...');
      await signInWithRedirect(auth, googleProvider);
      console.log('[AuthContext] ✅ signInWithRedirect completed - browser should redirect now');
      // הפונקציה לא תחזיר דבר כי הדפדפן יעבור לגוגל
      // התוצאה תטופל ב-useEffect עם getRedirectResult
    } catch (error) {
      console.error('[AuthContext] ❌ Error signing in with Google:', error);
      console.error('[AuthContext] Error code:', error.code);
      console.error('[AuthContext] Error message:', error.message);
      console.error('[AuthContext] Full error object:', error);
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
