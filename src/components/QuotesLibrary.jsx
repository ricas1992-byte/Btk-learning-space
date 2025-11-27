import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllQuotes,
  deleteQuote,
} from '../services/quoteService';

/**
 * QuotesLibrary - ספריית ציטוטים
 * מציג את כל הציטוטים עם אפשרות ניווט חזרה למקור
 */
export default function QuotesLibrary({ onNavigateToCourse }) {
  const { user } = useAuth();

  // State
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // טעינה ראשונית
  useEffect(() => {
    loadQuotes();
  }, [user]);

  // טעינת כל הציטוטים
  const loadQuotes = async () => {
    if (!user) {
      console.log('⚠️ [QuotesLibrary] loadQuotes: No user, skipping');
      return;
    }

    console.log('🔍 [QuotesLibrary] loadQuotes START for user:', user.uid);
    setLoading(true);
    setError('');
    try {
      console.log('🔍 [QuotesLibrary] Calling getAllQuotes...');
      const userQuotes = await getAllQuotes(user.uid);
      console.log('✅ [QuotesLibrary] getAllQuotes returned:', userQuotes.length, 'quotes');
      setQuotes(userQuotes);
    } catch (error) {
      console.error('❌ [QuotesLibrary] ERROR loading quotes:', error);
      console.error('❌ [QuotesLibrary] Error code:', error.code);
      console.error('❌ [QuotesLibrary] Error message:', error.message);
      setError('שגיאה בטעינת הציטוטים: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setLoading(false);
      console.log('🔍 [QuotesLibrary] loadQuotes DONE');
    }
  };

  // מחיקת ציטוט
  const handleDeleteQuote = async (quoteId) => {
    if (!confirm('האם למחוק ציטוט זה?')) return;

    try {
      await deleteQuote(quoteId);
      // רענן את הציטוטים
      loadQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('שגיאה במחיקת הציטוט');
    }
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
            loadQuotes();
          }}
          className="mt-4 px-4 py-2 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-medium rounded-lg transition"
        >
          נסה שנית
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-btk-navy flex items-center gap-2">
          <span>💬</span>
          <span>ספריית הציטוטים</span>
        </h1>
        <p className="text-btk-dark-gray mt-2">
          {quotes.length === 0
            ? 'אין ציטוטים שמורים'
            : `${quotes.length} ${quotes.length === 1 ? 'ציטוט' : 'ציטוטים'}`}
        </p>
      </div>

      {/* רשימת ציטוטים */}
      {quotes.length === 0 ? (
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

              {/* תגיות (אם יש) */}
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

              {/* אוסף (אם יש) */}
              {quote.collectionName && (
                <div className="mb-3 text-sm text-btk-dark-gray">
                  <span className="font-medium">אוסף:</span> {quote.collectionName}
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
  );
}
