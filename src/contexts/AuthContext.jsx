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
    // בדיקת תוצאה מ-redirect (כשהמשתמש חוזר מגוגל)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // המשתמש התחבר בהצלחה
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result:', error);
        setError(error.message);
      });

    // מאזין לשינויים בסטטוס ההתחברות
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // ניקוי המאזין כשהקומפוננט נהרס
    return unsubscribe;
  }, []);

  // התחברות עם Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithRedirect(auth, googleProvider);
      // הפונקציה לא תחזיר דבר כי הדפדפן יעבור לגוגל
      // התוצאה תטופל ב-useEffect עם getRedirectResult
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
      throw error;
    }
  };

  // התנתקות
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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
