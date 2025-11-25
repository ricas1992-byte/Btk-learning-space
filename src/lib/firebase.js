import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPkGAFy9pgTLTaCNCRxVmhjA8MWPQDXqA",
  authDomain: "btk-learning.firebaseapp.com",
  projectId: "btk-learning",
  storageBucket: "btk-learning.firebasestorage.app",
  messagingSenderId: "878353739778",
  appId: "1:878353739778:web:f58d2c5456f057adea771b",
  measurementId: "G-SZDBCYHP0F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// הגדר persistence מפורש - שומר את ה-auth state גם אחרי סגירת הדפדפן
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('[Firebase] Auth persistence set to LOCAL - user will stay logged in');
  })
  .catch((error) => {
    console.error('[Firebase] Error setting persistence:', error);
  });

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// הגדר פרמטרים מותאמים אישית עבור Google Sign-In
// prompt: 'select_account' - מכריח את המשתמש לבחור חשבון בכל פעם
// (פותר בעיות של "כלום לא קורה" כשלוחצים על הכפתור)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

console.log('[Firebase] Google Auth Provider configured with custom parameters');

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
