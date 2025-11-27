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
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * שמירת ציטוט חדש ב-Firestore
 * @param {string} userId - מזהה המשתמש
 * @param {object} quoteData - נתוני הציטוט
 * @returns {Promise<string>} - מזהה הציטוט
 */
export async function saveQuote(userId, quoteData) {
  try {
    // יצירת מסמך חדש עם ID אוטומטי
    const quotesRef = collection(db, 'quotes');
    const newQuoteRef = doc(quotesRef);

    // הוספת מידע נוסף
    const quoteToSave = {
      ...quoteData,
      userId,
      tags: quoteData.tags || [], // ודא שיש מערך ריק אם לא הועברו תגיות
      createdAt: serverTimestamp(),
    };

    await setDoc(newQuoteRef, quoteToSave);

    console.log('✅ Quote saved successfully:', newQuoteRef.id);
    return newQuoteRef.id;
  } catch (error) {
    console.error('❌ Error saving quote:', error);
    throw error;
  }
}

/**
 * קבלת כל הציטוטים של משתמש
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - מערך ציטוטים
 */
export async function getAllQuotes(userId) {
  try {
    console.log('🔍 [getAllQuotes] START - Loading all quotes for user:', userId);

    const quotesRef = collection(db, 'quotes');
    console.log('🔍 [getAllQuotes] Creating query with where + orderBy...');

    const q = query(
      quotesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    console.log('🔍 [getAllQuotes] Executing getDocs...');
    const querySnapshot = await getDocs(q);
    console.log('✅ [getAllQuotes] getDocs completed, processing documents...');

    const quotes = [];

    querySnapshot.forEach((doc) => {
      quotes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ [getAllQuotes] DONE - Successfully loaded ${quotes.length} quotes`);
    return quotes;
  } catch (error) {
    console.error('❌ [getAllQuotes] ERROR:', error);
    console.error('❌ [getAllQuotes] Error code:', error.code);
    console.error('❌ [getAllQuotes] Error message:', error.message);
    console.error('❌ [getAllQuotes] Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * קבלת ציטוטים לפי אוסף
 * @param {string} userId - מזהה המשתמש
 * @param {string} collectionName - שם האוסף
 * @returns {Promise<Array>} - מערך ציטוטים
 */
export async function getQuotesByCollection(userId, collectionName) {
  try {
    console.log('🔍 Loading quotes for collection:', collectionName);

    const quotesRef = collection(db, 'quotes');
    const q = query(
      quotesRef,
      where('userId', '==', userId),
      where('collectionName', '==', collectionName),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const quotes = [];

    querySnapshot.forEach((doc) => {
      quotes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${quotes.length} quotes in collection "${collectionName}"`);
    return quotes;
  } catch (error) {
    console.error('❌ Error getting quotes by collection:', error);
    throw error;
  }
}

/**
 * קבלת רשימת כל שמות האוספים (ייחודיים)
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - מערך שמות אוספים עם ספירה
 */
export async function getAllCollections(userId) {
  try {
    console.log('🔍 [getAllCollections] START - Loading all collections for user:', userId);

    // קבל את כל הציטוטים
    console.log('🔍 [getAllCollections] Calling getAllQuotes...');
    const quotes = await getAllQuotes(userId);
    console.log('✅ [getAllCollections] getAllQuotes returned:', quotes.length, 'quotes');

    // צור מפה של אוספים עם ספירה
    console.log('🔍 [getAllCollections] Building collections map...');
    const collectionsMap = {};

    quotes.forEach(quote => {
      const collectionName = quote.collectionName;
      if (collectionName) {
        if (!collectionsMap[collectionName]) {
          collectionsMap[collectionName] = {
            name: collectionName,
            count: 0,
            lastUpdated: quote.createdAt
          };
        }
        collectionsMap[collectionName].count++;

        // עדכן לתאריך האחרון
        if (quote.createdAt > collectionsMap[collectionName].lastUpdated) {
          collectionsMap[collectionName].lastUpdated = quote.createdAt;
        }
      }
    });

    console.log('🔍 [getAllCollections] Collections map built:', Object.keys(collectionsMap));

    // המר למערך וממיין לפי תאריך עדכון אחרון
    const collections = Object.values(collectionsMap).sort((a, b) => {
      return b.lastUpdated - a.lastUpdated;
    });

    console.log(`✅ [getAllCollections] DONE - Found ${collections.length} collections:`, collections.map(c => c.name));
    return collections;
  } catch (error) {
    console.error('❌ [getAllCollections] ERROR:', error);
    console.error('❌ [getAllCollections] Error code:', error.code);
    console.error('❌ [getAllCollections] Error message:', error.message);
    throw error;
  }
}

/**
 * מחיקת ציטוט
 * @param {string} quoteId - מזהה הציטוט
 * @returns {Promise<void>}
 */
export async function deleteQuote(quoteId) {
  try {
    console.log('🗑️ Deleting quote:', quoteId);
    const quoteRef = doc(db, 'quotes', quoteId);
    await deleteDoc(quoteRef);
    console.log('✅ Quote deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting quote:', error);
    throw error;
  }
}

/**
 * הוספת תגית לציטוט
 * @param {string} quoteId - מזהה הציטוט
 * @param {string} tag - התגית להוספה
 * @returns {Promise<void>}
 */
export async function addTagToQuote(quoteId, tag) {
  try {
    console.log('🏷️ Adding tag to quote:', { quoteId, tag });

    const quoteRef = doc(db, 'quotes', quoteId);
    await updateDoc(quoteRef, {
      tags: arrayUnion(tag.trim())
    });

    console.log('✅ Tag added successfully');
  } catch (error) {
    console.error('❌ Error adding tag:', error);
    throw error;
  }
}

/**
 * הסרת תגית מציטוט
 * @param {string} quoteId - מזהה הציטוט
 * @param {string} tag - התגית להסרה
 * @returns {Promise<void>}
 */
export async function removeTagFromQuote(quoteId, tag) {
  try {
    console.log('🏷️ Removing tag from quote:', { quoteId, tag });

    const quoteRef = doc(db, 'quotes', quoteId);
    await updateDoc(quoteRef, {
      tags: arrayRemove(tag)
    });

    console.log('✅ Tag removed successfully');
  } catch (error) {
    console.error('❌ Error removing tag:', error);
    throw error;
  }
}

/**
 * קבלת כל התגיות הייחודיות עם ספירה
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - מערך תגיות עם ספירה
 */
export async function getAllTags(userId) {
  try {
    console.log('🔍 Loading all tags for user:', userId);

    // קבל את כל הציטוטים
    const quotes = await getAllQuotes(userId);

    // צור מפה של תגיות עם ספירה
    const tagsMap = {};

    quotes.forEach(quote => {
      if (quote.tags && Array.isArray(quote.tags)) {
        quote.tags.forEach(tag => {
          if (tag) {
            if (!tagsMap[tag]) {
              tagsMap[tag] = {
                name: tag,
                count: 0
              };
            }
            tagsMap[tag].count++;
          }
        });
      }
    });

    // המר למערך וממיין לפי ספירה (הפופולריות ביותר)
    const tags = Object.values(tagsMap).sort((a, b) => {
      return b.count - a.count;
    });

    console.log(`✅ Found ${tags.length} unique tags`);
    return tags;
  } catch (error) {
    console.error('❌ Error getting tags:', error);
    throw error;
  }
}

/**
 * קבלת ציטוטים לפי תגית
 * @param {string} userId - מזהה המשתמש
 * @param {string} tag - התגית לחיפוש
 * @returns {Promise<Array>} - מערך ציטוטים
 */
export async function getQuotesByTag(userId, tag) {
  try {
    console.log('🔍 Loading quotes with tag:', tag);

    const quotesRef = collection(db, 'quotes');
    const q = query(
      quotesRef,
      where('userId', '==', userId),
      where('tags', 'array-contains', tag),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const quotes = [];

    querySnapshot.forEach((doc) => {
      quotes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${quotes.length} quotes with tag "${tag}"`);
    return quotes;
  } catch (error) {
    console.error('❌ Error getting quotes by tag:', error);
    throw error;
  }
}

/**
 * קבלת ציטוט ספציפי
 * @param {string} quoteId - מזהה הציטוט
 * @returns {Promise<object|null>} - נתוני הציטוט או null
 */
export async function getQuote(quoteId) {
  try {
    const quoteRef = doc(db, 'quotes', quoteId);
    const quoteSnap = await getDoc(quoteRef);

    if (quoteSnap.exists()) {
      return {
        id: quoteSnap.id,
        ...quoteSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting quote:', error);
    throw error;
  }
}
