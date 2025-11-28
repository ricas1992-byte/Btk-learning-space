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
 * שמירת הערה חדשה
 * @param {string} userId - מזהה המשתמש
 * @param {object} noteData - נתוני ההערה
 * @returns {Promise<string>} - מזהה ההערה
 */
export async function saveNote(userId, noteData) {
  try {
    // יצירת מזהה ייחודי להערה
    const noteId = `${userId}_${noteData.courseId}_${noteData.lessonId}_${Date.now()}`;
    const noteRef = doc(db, 'notes', noteId);

    const noteToSave = {
      userId,
      courseId: noteData.courseId,
      lessonId: noteData.lessonId,
      content: noteData.content,
      context: noteData.context || '', // הטקסט שצמוד אליו
      paragraphIndex: noteData.paragraphIndex || 0,
      characterOffset: noteData.characterOffset || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(noteRef, noteToSave);
    console.log('✅ Note saved successfully:', noteId);
    return noteId;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
}

/**
 * קבלת כל ההערות של יחידה
 * @param {string} userId - מזהה המשתמש
 * @param {string} lessonId - מזהה היחידה
 * @returns {Promise<Array>} - מערך הערות
 */
export async function getLessonNotes(userId, lessonId) {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('userId', '==', userId),
      where('lessonId', '==', lessonId),
      orderBy('paragraphIndex', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const notes = [];

    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notes;
  } catch (error) {
    console.error('Error getting lesson notes:', error);
    throw error;
  }
}

/**
 * קבלת כל ההערות של קורס
 * @param {string} userId - מזהה המשתמש
 * @param {string} courseId - מזהה הקורס
 * @returns {Promise<Array>} - מערך הערות
 */
export async function getCourseNotes(userId, courseId) {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notes = [];

    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notes;
  } catch (error) {
    console.error('Error getting course notes:', error);
    throw error;
  }
}

/**
 * עדכון הערה קיימת
 * @param {string} noteId - מזהה ההערה
 * @param {object} updates - עדכונים
 * @returns {Promise<void>}
 */
export async function updateNote(noteId, updates) {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await setDoc(noteRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ Note updated successfully');
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * מחיקת הערה
 * @param {string} noteId - מזהה ההערה
 * @returns {Promise<void>}
 */
export async function deleteNote(noteId) {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
    console.log('✅ Note deleted successfully');
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}
