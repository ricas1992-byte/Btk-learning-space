import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * סימון יחידה כהושלמה
 * @param {string} userId - מזהה המשתמש
 * @param {string} courseId - מזהה הקורס
 * @param {string} lessonId - מזהה היחידה
 * @returns {Promise<void>}
 */
export async function markLessonComplete(userId, courseId, lessonId) {
  try {
    const progressId = `${userId}_${courseId}_${lessonId}`;
    const progressRef = doc(db, 'progress', progressId);

    await setDoc(progressRef, {
      userId,
      courseId,
      lessonId,
      completed: true,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Lesson marked as complete:', lessonId);
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
}

/**
 * סימון יחידה כלא הושלמה
 * @param {string} userId - מזהה המשתמש
 * @param {string} courseId - מזהה הקורס
 * @param {string} lessonId - מזהה היחידה
 * @returns {Promise<void>}
 */
export async function markLessonIncomplete(userId, courseId, lessonId) {
  try {
    const progressId = `${userId}_${courseId}_${lessonId}`;
    const progressRef = doc(db, 'progress', progressId);

    await setDoc(progressRef, {
      userId,
      courseId,
      lessonId,
      completed: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Lesson marked as incomplete:', lessonId);
  } catch (error) {
    console.error('Error marking lesson incomplete:', error);
    throw error;
  }
}

/**
 * בדיקה האם יחידה הושלמה
 * @param {string} userId - מזהה המשתמש
 * @param {string} courseId - מזהה הקורס
 * @param {string} lessonId - מזהה היחידה
 * @returns {Promise<boolean>}
 */
export async function isLessonComplete(userId, courseId, lessonId) {
  try {
    const progressId = `${userId}_${courseId}_${lessonId}`;
    const progressRef = doc(db, 'progress', progressId);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      return progressSnap.data().completed === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking lesson completion:', error);
    return false;
  }
}

/**
 * קבלת כל התקדמות הקורס
 * @param {string} userId - מזהה המשתמש
 * @param {string} courseId - מזהה הקורס
 * @returns {Promise<Array>} - מערך של התקדמות יחידות
 */
export async function getCourseProgress(userId, courseId) {
  try {
    const progressRef = collection(db, 'progress');
    const q = query(
      progressRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    const progress = [];

    querySnapshot.forEach((doc) => {
      progress.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return progress;
  } catch (error) {
    console.error('Error getting course progress:', error);
    throw error;
  }
}

/**
 * חישוב אחוז התקדמות בקורס
 * @param {string} userId - מזהה המשתמש
 * @param {string} courseId - מזהה הקורס
 * @param {number} totalLessons - סך כל היחידות בקורס
 * @returns {Promise<{completed: number, total: number, percentage: number}>}
 */
export async function calculateCourseProgress(userId, courseId, totalLessons) {
  try {
    const progress = await getCourseProgress(userId, courseId);
    const completedLessons = progress.filter(p => p.completed === true).length;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      completed: completedLessons,
      total: totalLessons,
      percentage
    };
  } catch (error) {
    console.error('Error calculating course progress:', error);
    return {
      completed: 0,
      total: totalLessons,
      percentage: 0
    };
  }
}

/**
 * קבלת סטטוס קורס
 * @param {number} completed - מספר יחידות שהושלמו
 * @param {number} total - סך כל היחידות
 * @returns {string} - 'טרם התחיל' | 'בתהליך' | 'הושלם'
 */
export function getCourseStatus(completed, total) {
  if (completed === 0) {
    return 'טרם התחיל';
  } else if (completed === total && total > 0) {
    return 'הושלם';
  } else {
    return 'בתהליך';
  }
}
