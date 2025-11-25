import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
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

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
