import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllQuotes,
  deleteQuote,
  getAllTags,
  getQuotesByTag,
  addTagToQuote,
  removeTagFromQuote
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
  const [allTags, setAllTags] = useState([]);           // כל התגיות עם ספירה
  const [selectedTag, setSelectedTag] = useState(null); // תגית מסוננת נוכחית
  const [newTagInput, setNewTagInput] = useState({});   // input עבור תגית חדשה לכל ציטוט

  // טעינה ראשונית
  useEffect(() => {
    loadQuotes();
    loadTags();
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

  // טעינת כל התגיות
  const loadTags = async () => {
    if (!user) {
      console.log('⚠️ [QuotesLibrary] loadTags: No user, skipping');
      return;
    }

    try {
      console.log('🔍 [QuotesLibrary] Loading tags...');
      const tags = await getAllTags(user.uid);
      console.log('✅ [QuotesLibrary] Loaded', tags.length, 'tags');
      setAllTags(tags);
    } catch (error) {
      console.error('❌ [QuotesLibrary] Error loading tags:', error);
      // לא מציג שגיאה למשתמש - זה לא קריטי
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

  // הוספת תגית לציטוט
  const handleAddTag = async (quoteId) => {
    const tagText = newTagInput[quoteId]?.trim();
    if (!tagText) {
      return;
    }

    try {
      console.log('🏷️ Adding tag:', tagText, 'to quote:', quoteId);
      await addTagToQuote(quoteId, tagText);
      setNewTagInput(prev => ({ ...prev, [quoteId]: '' })); // נקה input
      await loadQuotes(); // רענן ציטוטים
      await loadTags();   // רענן תגיות
      console.log('✅ Tag added successfully');
    } catch (error) {
      console.error('❌ Error adding tag:', error);
      alert('שגיאה בהוספת התגית');
    }
  };

  // הסרת תגית מציטוט
  const handleRemoveTag = async (quoteId, tag) => {
    try {
      console.log('🏷️ Removing tag:', tag, 'from quote:', quoteId);
      await removeTagFromQuote(quoteId, tag);
      await loadQuotes();
      await loadTags();
      console.log('✅ Tag removed successfully');
    } catch (error) {
      console.error('❌ Error removing tag:', error);
      alert('שגיאה בהסרת התגית');
    }
  };

  // סינון לפי תגית
  const handleFilterByTag = async (tag) => {
    setLoading(true);
    try {
      console.log('🔍 Filtering by tag:', tag);
      const filtered = await getQuotesByTag(user.uid, tag);
      setQuotes(filtered);
      setSelectedTag(tag);
      console.log('✅ Filtered', filtered.length, 'quotes');
    } catch (error) {
      console.error('❌ Error filtering by tag:', error);
      alert('שגיאה בטעינת ציטוטים לפי תגית');
    } finally {
      setLoading(false);
    }
  };

  // ביטול סינון - חזרה לכל הציטוטים
  const handleClearFilter = () => {
    console.log('🔍 Clearing tag filter');
    setSelectedTag(null);
    loadQuotes();
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
          {selectedTag ? (
            <span>
              מציג ציטוטים עם התגית <strong className="text-btk-gold">#{selectedTag}</strong>
              {' '}({quotes.length} {quotes.length === 1 ? 'ציטוט' : 'ציטוטים'})
            </span>
          ) : (
            <span>
              {quotes.length === 0
                ? 'אין ציטוטים שמורים'
                : `${quotes.length} ${quotes.length === 1 ? 'ציטוט' : 'ציטוטים'}`}
            </span>
          )}
        </p>
      </div>

      {/* אזור תגיות */}
      <div className="mb-6 bg-white border-2 border-btk-light-gray rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-btk-navy flex items-center gap-2">
            <span>🏷️</span>
            <span>תגיות</span>
          </h2>
        </div>

        {allTags.length === 0 ? (
          <p className="text-sm text-btk-dark-gray">אין תגיות עדיין</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => handleFilterByTag(tag.name)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedTag === tag.name
                    ? 'bg-btk-gold text-btk-navy border-2 border-btk-navy'
                    : 'bg-btk-gold text-btk-navy hover:bg-btk-bronze'
                }`}
              >
                <span>#{tag.name}</span>
                <span className="mr-2 text-sm opacity-75">({tag.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* כפתור חזרה לכל הציטוטים */}
        {selectedTag && (
          <div className="mt-3 pt-3 border-t border-btk-light-gray">
            <button
              onClick={handleClearFilter}
              className="text-sm text-btk-gold hover:text-btk-bronze font-medium flex items-center gap-1"
            >
              <span>←</span>
              <span>חזרה לכל הציטוטים</span>
            </button>
          </div>
        )}
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

              {/* תגיות */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {quote.tags && quote.tags.length > 0 && quote.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-btk-gold text-btk-navy text-sm font-medium rounded-full"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(quote.id, tag)}
                        className="text-btk-navy hover:text-red-600 font-bold transition"
                        title="הסר תגית"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* הוספת תגית חדשה */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newTagInput[quote.id] || ''}
                    onChange={(e) => setNewTagInput(prev => ({
                      ...prev,
                      [quote.id]: e.target.value
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(quote.id);
                      }
                    }}
                    placeholder="הוסף תגית..."
                    className="flex-1 px-3 py-1 text-sm border border-btk-light-gray rounded-lg focus:outline-none focus:border-btk-gold"
                  />
                  <button
                    onClick={() => handleAddTag(quote.id)}
                    className="px-3 py-1 bg-btk-gold hover:bg-btk-bronze text-btk-navy text-sm font-medium rounded-lg transition"
                  >
                    הוסף
                  </button>
                </div>
              </div>

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
