import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * שמירת קורס ב-Firestore
 * @param {string} userId - מזהה המשתמש
 * @param {object} courseData - נתוני הקורס
 * @returns {Promise<string>} - מזהה הקורס
 */
export async function saveCourse(userId, courseData) {
  try {
    // יצירת מסמך עם ה-ID של הקורס
    const courseRef = doc(db, 'courses', courseData.id);

    // בדוק אם הקורס כבר קיים
    const existingCourse = await getDoc(courseRef);
    const isNewCourse = !existingCourse.exists();

    // הוספת מידע נוסף
    const courseToSave = {
      ...courseData,
      userId,
      updatedAt: serverTimestamp(),
      // הוסף createdAt רק אם זה קורס חדש
      ...(isNewCourse && { createdAt: serverTimestamp() })
    };

    await setDoc(courseRef, courseToSave);

    return courseData.id;
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
}

/**
 * קבלת כל הקורסים של משתמש
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - מערך קורסים
 */
export async function getCourses(userId) {
  try {
    const coursesRef = collection(db, 'courses');

    // נסה תחילה עם orderBy - אם יש index זה יעבוד
    let q;
    let querySnapshot;

    try {
      q = query(
        coursesRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      // אם אין index, פשוט קח את כל הקורסים של המשתמש בלי מיון
      console.log('No index found, fetching without orderBy:', indexError.message);
      q = query(
        coursesRef,
        where('userId', '==', userId)
      );
      querySnapshot = await getDocs(q);
    }

    const courses = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      courses.push({
        id: doc.id,
        ...data,
        // וודא שיש createdAt - אם לא, השתמש ב-updatedAt או תאריך נוכחי
        createdAt: data.createdAt || data.updatedAt || new Date().toISOString()
      });
    });

    // מיין את הקורסים בזיכרון לפי תאריך עדכון
    courses.sort((a, b) => {
      const dateA = a.updatedAt?.toMillis?.() || new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = b.updatedAt?.toMillis?.() || new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA; // מהחדש לישן
    });

    return courses;
  } catch (error) {
    console.error('Error getting courses:', error);
    throw error;
  }
}

/**
 * קבלת קורס ספציפי
 * @param {string} courseId - מזהה הקורס
 * @returns {Promise<object|null>} - נתוני הקורס או null
 */
export async function getCourse(courseId) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (courseSnap.exists()) {
      return {
        id: courseSnap.id,
        ...courseSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting course:', error);
    throw error;
  }
}

/**
 * מחיקת קורס
 * @param {string} courseId - מזהה הקורס
 * @returns {Promise<void>}
 */
export async function deleteCourse(courseId) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await deleteDoc(courseRef);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

/**
 * עדכון קורס קיים
 * @param {string} courseId - מזהה הקורס
 * @param {object} updates - עדכונים לבצע
 * @returns {Promise<void>}
 */
export async function updateCourse(courseId, updates) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await setDoc(courseRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}
