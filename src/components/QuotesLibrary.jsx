import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllCollections,
  getQuotesByCollection,
  deleteQuote,
} from '../services/quoteService';

/**
 * QuotesLibrary - ספריית ציטוטים
 * מציג אוספים וציטוטים עם אפשרות ניווט חזרה למקור
 */
export default function QuotesLibrary({ onNavigateToCourse }) {
  const { user } = useAuth();

  // State ראשי
  const [view, setView] = useState('collections'); // 'collections' | 'quotes'
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // טעינה ראשונית
  useEffect(() => {
    loadCollections();
  }, []);

  // טעינת אוספים
  const loadCollections = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      const userCollections = await getAllCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
      setError('שגיאה בטעינת האוספים');
    } finally {
      setLoading(false);
    }
  };

  // טעינת ציטוטים באוסף
  const loadQuotesInCollection = async (collectionName) => {
    setLoading(true);
    setError('');
    try {
      const collectionQuotes = await getQuotesByCollection(user.uid, collectionName);
      setQuotes(collectionQuotes);
      setSelectedCollection(collectionName);
      setView('quotes');
    } catch (error) {
      console.error('Error loading quotes:', error);
      setError('שגיאה בטעינת הציטוטים');
    } finally {
      setLoading(false);
    }
  };

  // מחיקת ציטוט
  const handleDeleteQuote = async (quoteId) => {
    if (!confirm('האם למחוק ציטוט זה?')) return;

    try {
      await deleteQuote(quoteId);
      // רענן את הציטוטים
      loadQuotesInCollection(selectedCollection);
      // רענן את מספר הציטוטים באוסף
      loadCollections();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('שגיאה במחיקת הציטוט');
    }
  };

  // חזרה לרשימת אוספים
  const handleBackToCollections = () => {
    setView('collections');
    setSelectedCollection(null);
    setQuotes([]);
    loadCollections(); // רענן את הספירה
  };

  // ניווט לקורס מקור
  const handleGoToSource = (quote) => {
    if (onNavigateToCourse) {
      onNavigateToCourse(quote.courseId, quote.lessonId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-btk-gold mb-4"></div>
        <p className="text-btk-dark-gray">טוען...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
        <button
          onClick={() => {
            setError('');
            loadCollections();
          }}
          className="mt-4 px-4 py-2 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-medium rounded-lg transition"
        >
          נסה שנית
        </button>
      </div>
    );
  }

  return (
    <>
      {/* תצוגת אוספים */}
      {view === 'collections' && (
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-btk-navy flex items-center gap-2">
              <span>💬</span>
              <span>אוסף הציטוטים</span>
            </h1>
            <p className="text-btk-dark-gray mt-2">
              {collections.length === 0
                ? 'אין אוספים עדיין'
                : `${collections.length} ${collections.length === 1 ? 'אוסף' : 'אוספים'}`}
            </p>
          </div>

          {/* רשימת אוספים */}
          {collections.length === 0 ? (
            <div className="bg-btk-light-gray rounded-lg p-8 text-center">
              <span className="text-6xl mb-4 block">📖</span>
              <p className="text-btk-dark-gray text-lg font-medium mb-2">
                עדיין לא שמרת ציטוטים
              </p>
              <p className="text-sm text-btk-dark-gray">
                בחר טקסט בזמן קריאת יחידה ושמור אותו כציטוט.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <div
                  key={collection.name}
                  onClick={() => loadQuotesInCollection(collection.name)}
                  className="bg-white border-2 border-btk-light-gray rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-btk-gold transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-btk-navy flex-1">
                      {collection.name}
                    </h3>
                    <span className="text-2xl">📚</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-btk-dark-gray">
                      {collection.count} {collection.count === 1 ? 'ציטוט' : 'ציטוטים'}
                    </span>
                    <span className="text-btk-gold font-bold">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* תצוגת ציטוטים */}
      {view === 'quotes' && (
        <div className="max-w-4xl mx-auto p-6">
          {/* Header עם כפתור חזרה */}
          <div className="mb-6">
            <button
              onClick={handleBackToCollections}
              className="mb-4 text-btk-gold hover:text-btk-bronze flex items-center gap-2 font-medium transition"
            >
              <span>←</span>
              <span>חזרה לאוספים</span>
            </button>

            <h1 className="text-3xl font-bold text-btk-navy flex items-center gap-2">
              <span>📚</span>
              <span>{selectedCollection}</span>
            </h1>
            <p className="text-btk-dark-gray mt-2">
              {quotes.length === 0
                ? 'אין ציטוטים באוסף זה'
                : `${quotes.length} ${quotes.length === 1 ? 'ציטוט' : 'ציטוטים'}`}
            </p>
          </div>

          {/* רשימת ציטוטים */}
          {quotes.length === 0 ? (
            <div className="bg-btk-light-gray rounded-lg p-8 text-center">
              <p className="text-btk-dark-gray">
                אין ציטוטים באוסף זה
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-white border-2 border-btk-light-gray rounded-lg p-6 hover:shadow-md transition-all"
                >
                  {/* טקסט הציטוט */}
                  <blockquote className="text-btk-dark-gray text-lg mb-4 border-r-4 border-btk-gold pr-4 leading-relaxed">
                    <span className="text-btk-gold text-2xl">"</span>
                    <span className="italic">{quote.text}</span>
                    <span className="text-btk-gold text-2xl">"</span>
                  </blockquote>

                  {/* מקור */}
                  <div className="mb-3">
                    <button
                      onClick={() => handleGoToSource(quote)}
                      className="text-sm text-btk-gold hover:text-btk-bronze font-medium flex items-center gap-1 hover:underline transition"
                    >
                      <span>📖</span>
                      <span>
                        {quote.courseName} › {quote.lessonTitle}
                      </span>
                    </button>
                  </div>

                  {/* תגיות (אם יש - הכנה לשלב 2) */}
                  {quote.tags && quote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {quote.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-btk-light-gray text-btk-dark-gray text-xs font-medium rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* כפתור מחיקה */}
                  <div className="flex justify-end pt-3 border-t border-btk-light-gray">
                    <button
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition"
                    >
                      <span>🗑️</span>
                      <span>מחק ציטוט</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
