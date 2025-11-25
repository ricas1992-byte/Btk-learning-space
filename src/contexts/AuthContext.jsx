import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

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
    console.log('[AuthContext] Setting up auth state listener');

    // הגדר מאזין לשינויים בסטטוס ההתחברות
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] Auth state changed:', user?.email || 'null');
      setUser(user);
      setLoading(false);
    });

    // ניקוי המאזין כשהקומפוננט נהרס
    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // התחברות עם אימייל וסיסמא
  const signIn = async (email, password) => {
    try {
      console.log('[AuthContext] Signing in with email:', email);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] Sign in successful:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('[AuthContext] Error signing in:', error);
      setError(error.message);
      throw error;
    }
  };

  // רישום משתמש חדש עם אימייל וסיסמא
  const signUp = async (email, password) => {
    try {
      console.log('[AuthContext] Creating new user with email:', email);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] User created successfully:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('[AuthContext] Error creating user:', error);
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
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
