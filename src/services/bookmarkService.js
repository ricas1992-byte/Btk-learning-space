import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * שמירת/עדכון סימנייה
 * @param {string} userId - מזהה המשתמש
 * @param {object} bookmarkData - נתוני הסימנייה (lessonId, courseId, courseName, lessonTitle, position)
 * @returns {Promise<string>} - מזהה הסימנייה
 */
export async function saveBookmark(userId, bookmarkData) {
  try {
    console.log('🔖 Saving bookmark:', { userId, ...bookmarkData });

    // יצירת ID ייחודי: userId_lessonId (למנוע כפילויות)
    const bookmarkId = `${userId}_${bookmarkData.lessonId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);

    // הכנת הנתונים לשמירה
    const bookmarkToSave = {
      ...bookmarkData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // שמירה/עדכון (overwrite אם קיים)
    await setDoc(bookmarkRef, bookmarkToSave);

    console.log('✅ Bookmark saved successfully:', bookmarkId);
    return bookmarkId;
  } catch (error) {
    console.error('❌ Error saving bookmark:', error);
    throw new Error('שגיאה בשמירת הסימנייה: ' + (error.message || 'שגיאה לא ידועה'));
  }
}

/**
 * קבלת סימנייה ספציפית ליחידה
 * @param {string} userId - מזהה המשתמש
 * @param {string} lessonId - מזהה היחידה
 * @returns {Promise<object|null>} - נתוני הסימנייה או null
 */
export async function getBookmark(userId, lessonId) {
  try {
    console.log('🔍 Loading bookmark for lesson:', { userId, lessonId });

    // יצירת ID ייחודי
    const bookmarkId = `${userId}_${lessonId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);

    const bookmarkSnap = await getDoc(bookmarkRef);

    if (bookmarkSnap.exists()) {
      const bookmark = {
        id: bookmarkSnap.id,
        ...bookmarkSnap.data()
      };
      console.log('✅ Bookmark found:', bookmark);
      return bookmark;
    } else {
      console.log('ℹ️ No bookmark found for this lesson');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading bookmark:', error);
    throw new Error('שגיאה בטעינת הסימנייה: ' + (error.message || 'שגיאה לא ידועה'));
  }
}

/**
 * קבלת כל הסימניות של משתמש
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - מערך סימניות
 */
export async function getAllBookmarks(userId) {
  try {
    console.log('🔍 Loading all bookmarks for user:', userId);

    const bookmarksRef = collection(db, 'bookmarks');

    // שאילתה ללא orderBy (למנוע composite index)
    const q = query(
      bookmarksRef,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const bookmarks = [];

    querySnapshot.forEach((doc) => {
      bookmarks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // מיון בצד הלקוח לפי תאריך עדכון אחרון (מהחדש לישן)
    bookmarks.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    console.log(`✅ Found ${bookmarks.length} bookmarks`);
    return bookmarks;
  } catch (error) {
    console.error('❌ Error loading bookmarks:', error);
    throw new Error('שגיאה בטעינת הסימניות: ' + (error.message || 'שגיאה לא ידועה'));
  }
}

/**
 * מחיקת סימנייה
 * @param {string} bookmarkId - מזהה הסימנייה
 * @returns {Promise<void>}
 */
export async function deleteBookmark(bookmarkId) {
  try {
    console.log('🗑️ Deleting bookmark:', bookmarkId);

    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    await deleteDoc(bookmarkRef);

    console.log('✅ Bookmark deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting bookmark:', error);
    throw new Error('שגיאה במחיקת הסימנייה: ' + (error.message || 'שגיאה לא ידועה'));
  }
}
