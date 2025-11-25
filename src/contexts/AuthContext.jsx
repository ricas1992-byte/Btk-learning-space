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
    console.log('[AuthContext] useEffect started');

    // בדיקת תוצאה מ-redirect (כשהמשתמש חוזר מגוגל)
    getRedirectResult(auth)
      .then((result) => {
        console.log('[AuthContext] getRedirectResult result:', result);
        if (result && result.user) {
          // המשתמש התחבר בהצלחה
          console.log('[AuthContext] User signed in successfully:', result.user.email);
          setUser(result.user);
          setLoading(false); // חשוב! עדכון loading ל-false
        }
      })
      .catch((error) => {
        console.error('[AuthContext] Error getting redirect result:', error);
        setError(error.message);
        setLoading(false); // גם במקרה של שגיאה, עצור את ה-loading
      });

    // מאזין לשינויים בסטטוס ההתחברות
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] onAuthStateChanged triggered, user:', user?.email || 'null');
      setUser(user);
      setLoading(false);
    });

    // ניקוי המאזין כשהקומפוננט נהרס
    return unsubscribe;
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
