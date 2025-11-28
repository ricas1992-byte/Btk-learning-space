import { useState, useEffect } from 'react';
import FloatingTTSBar from './FloatingTTSBar';
import NotesPanel from './NotesPanel';
import { useAuth } from '../contexts/AuthContext';
import { saveQuote, getAllCollections } from '../services/quoteService';
import { saveBookmark, getBookmark } from '../services/bookmarkService';
import { saveNote, getLessonNotes } from '../services/noteService';
import { markLessonComplete, markLessonIncomplete, isLessonComplete } from '../services/progressService';

/**
 * LessonPlayer - נגן יחידת לימוד
 */
export default function LessonPlayer({ course, lessonId, ttsEngine, onBack }) {
  const { user } = useAuth();

  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonIndex, setLessonIndex] = useState(-1);

  // State לניהול ציטוטים
  const [selectedText, setSelectedText] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [saving, setSaving] = useState(false);

  // State לניהול סימניות
  const [bookmark, setBookmark] = useState(null);
  const [hasScrolledToBookmark, setHasScrolledToBookmark] = useState(false);

  // State לניהול הערות
  const [notes, setNotes] = useState([]);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteContext, setNoteContext] = useState('');

  // State למעקב התקדמות
  const [lessonCompleted, setLessonCompleted] = useState(false);

  useEffect(() => {
    if (course && course.lessons) {
      const index = course.lessons.findIndex(l => l.id === lessonId);
      setLessonIndex(index);
      if (index >= 0) {
        setCurrentLesson(course.lessons[index]);
      }
    }
  }, [course, lessonId]);

  // טעינת אוספים קיימים
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    if (!user) return;
    try {
      const userCollections = await getAllCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  // טעינת סימנייה
  const loadBookmark = async () => {
    if (!currentLesson || !user) return;

    try {
      console.log('🔖 Loading bookmark for lesson:', currentLesson.id);
      const savedBookmark = await getBookmark(user.uid, currentLesson.id);
      setBookmark(savedBookmark);
      setHasScrolledToBookmark(false); // אפס את דגל הגלילה
    } catch (error) {
      console.error('Error loading bookmark:', error);
      // לא מציג שגיאה למשתמש - זה לא קריטי
    }
  };

  // טעינת סימנייה כשהיחידה משתנה
  useEffect(() => {
    loadBookmark();
  }, [currentLesson, user]);

  // טעינת הערות כשהיחידה משתנה
  useEffect(() => {
    loadNotes();
  }, [currentLesson, user]);

  // בדיקת סטטוס השלמה כשהיחידה משתנה
  useEffect(() => {
    checkLessonCompletion();
  }, [currentLesson, user]);

  const loadNotes = async () => {
    if (!currentLesson || !user) return;

    try {
      const lessonNotes = await getLessonNotes(user.uid, currentLesson.id);
      setNotes(lessonNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const checkLessonCompletion = async () => {
    if (!currentLesson || !user || !course) return;

    try {
      const completed = await isLessonComplete(user.uid, course.id, currentLesson.id);
      setLessonCompleted(completed);
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  };

  // גלילה אוטומטית לסימנייה
  useEffect(() => {
    if (bookmark && !hasScrolledToBookmark && currentLesson) {
      console.log('🔖 Auto-scrolling to bookmark position:', bookmark.position);

      // המתן שהעמוד יטען לחלוטין
      setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPosition = bookmark.position * scrollHeight;

        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });

        setHasScrolledToBookmark(true);
        console.log('✅ Scrolled to bookmark');
      }, 500);
    }
  }, [bookmark, hasScrolledToBookmark, currentLesson]);

  // זיהוי בחירת טקסט (לציטוטים והערות)
  useEffect(() => {
    let longPressTimer = null;

    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 0) {
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    };

    // זיהוי לחיצה ארוכה להוספת הערה
    const handleTouchStart = (e) => {
      longPressTimer = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > 0) {
          setNoteContext(text);
          setShowNoteModal(true);
        }
      }, 500); // 500ms לחיצה ארוכה
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    // הוסף event listeners
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, []);

  const goToPreviousLesson = () => {
    if (lessonIndex > 0) {
      const prevLesson = course.lessons[lessonIndex - 1];
      setCurrentLesson(prevLesson);
      setLessonIndex(lessonIndex - 1);
    }
  };

  const goToNextLesson = () => {
    if (lessonIndex < course.lessons.length - 1) {
      const nextLesson = course.lessons[lessonIndex + 1];
      setCurrentLesson(nextLesson);
      setLessonIndex(lessonIndex + 1);
    }
  };

  const handleLessonEnd = () => {
    // כשההקראה מסתיימת, אפשר לעבור אוטומטית ליחידה הבאה
    // או להציג הודעה
    console.log('הקראת היחידה הסתיימה');
  };

  const handleSaveQuote = async () => {
    if (!selectedText) return;

    const collectionName = isCreatingNew ? newCollectionName.trim() : selectedCollection;

    if (!collectionName) {
      alert('אנא בחר או צור אוסף');
      return;
    }

    setSaving(true);
    try {
      await saveQuote(user.uid, {
        text: selectedText,
        courseId: course.id,
        courseName: course.title,
        lessonId: currentLesson.id,
        lessonTitle: currentLesson.title,
        collectionName: collectionName,
      });

      // הצלחה - איפוס הטופס
      setShowQuoteModal(false);
      setSelectedText('');
      setSelectedCollection('');
      setNewCollectionName('');
      setIsCreatingNew(false);

      // רענן את רשימת האוספים
      loadCollections();

      // נקה את הבחירה בדף
      window.getSelection().removeAllRanges();

      // הודעה למשתמש
      alert('הציטוט נשמר בהצלחה! ✅');
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('שגיאה בשמירת הציטוט');
    } finally {
      setSaving(false);
    }
  };

  // שמירת מיקום נוכחי כסימנייה
  const handleSaveBookmark = async () => {
    if (!currentLesson || !user) return;

    try {
      // חשב את מיקום הגלילה הנוכחי
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const position = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      console.log('🔖 Saving bookmark at position:', position);

      await saveBookmark(user.uid, {
        lessonId: currentLesson.id,
        courseId: course.id,
        courseName: course.title,
        lessonTitle: currentLesson.title,
        position: position
      });

      // עדכן state מקומי
      await loadBookmark();

      alert('המיקום נשמר בהצלחה! 🔖');
    } catch (error) {
      console.error('Error saving bookmark:', error);
      alert('שגיאה בשמירת המיקום');
    }
  };

  // שמירת הערה
  const handleSaveNote = async () => {
    if (!noteText.trim() || !currentLesson || !user) return;

    try {
      await saveNote(user.uid, {
        courseId: course.id,
        lessonId: currentLesson.id,
        content: noteText,
        context: noteContext,
        paragraphIndex: 0, // ניתן לשפר בעתיד
      });

      // רענן את רשימת ההערות
      await loadNotes();

      // איפוס הטופס
      setShowNoteModal(false);
      setNoteText('');
      setNoteContext('');
      window.getSelection().removeAllRanges();

      alert('ההערה נשמרה בהצלחה! 📝');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('שגיאה בשמירת ההערה');
    }
  };

  // סימון יחידה כהושלמה
  const handleToggleLessonComplete = async () => {
    if (!currentLesson || !user || !course) return;

    try {
      if (lessonCompleted) {
        await markLessonIncomplete(user.uid, course.id, currentLesson.id);
        setLessonCompleted(false);
      } else {
        await markLessonComplete(user.uid, course.id, currentLesson.id);
        setLessonCompleted(true);
        // אופציונלי: עבור ליחידה הבאה אוטומטית
        setTimeout(() => {
          if (lessonIndex < course.lessons.length - 1) {
            goToNextLesson();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error toggling lesson completion:', error);
      alert('שגיאה בעדכון סטטוס היחידה');
    }
  };

  if (!currentLesson) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={onBack}
          className="mb-4 text-btk-gold hover:text-btk-bronze flex items-center gap-2 font-medium"
        >
          <span>←</span>
          <span>חזרה לקורס</span>
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          היחידה לא נמצאה
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* כפתור חזרה */}
      <div className="bg-white border-b border-btk-light-gray p-4">
        <button
          onClick={onBack}
          className="text-btk-gold hover:text-btk-bronze flex items-center gap-2 font-medium"
        >
          <span>←</span>
          <span>חזרה לקורס</span>
        </button>
      </div>

      {/* כותרת היחידה */}
      <div className="bg-gradient-to-r from-btk-navy to-btk-dark-gray text-white p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-btk-gold">{currentLesson.order}</span>
            <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
          </div>
        </div>

        {/* שורת כפתורי פעולה */}
        <div className="flex flex-wrap gap-2">
          {/* כפתור שמירת מיקום */}
          <button
            onClick={handleSaveBookmark}
            className="px-3 py-2 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-medium rounded-lg transition flex items-center gap-2 shadow-sm text-sm"
            title="שמור מיקום נוכחי"
          >
            <span>🔖</span>
            <span>שמור מיקום</span>
          </button>

          {/* כפתור הצגת הערות */}
          <button
            onClick={() => setShowNotesPanel(true)}
            className="px-3 py-2 bg-white hover:bg-btk-light-gray text-btk-navy font-medium rounded-lg transition flex items-center gap-2 shadow-sm text-sm"
            title="הצג הערות"
          >
            <span>📝</span>
            <span>הערות</span>
            {notes.length > 0 && (
              <span className="bg-btk-gold text-btk-navy rounded-full px-2 py-0.5 text-xs font-bold">
                {notes.length}
              </span>
            )}
          </button>

          {/* כפתור סימון יחידה כהושלמה */}
          <button
            onClick={handleToggleLessonComplete}
            className={`px-3 py-2 font-medium rounded-lg transition flex items-center gap-2 shadow-sm text-sm ${
              lessonCompleted
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-white hover:bg-btk-light-gray text-btk-navy'
            }`}
            title={lessonCompleted ? 'סמן כלא הושלם' : 'סיימתי יחידה זו'}
          >
            <span>{lessonCompleted ? '✓' : '○'}</span>
            <span>{lessonCompleted ? 'הושלמה' : 'סיימתי יחידה'}</span>
          </button>
        </div>

        {/* אינדיקציה לסימנייה קיימת */}
        {bookmark && (
          <div className="mt-3 text-sm text-btk-gold flex items-center gap-2">
            <span>🔖</span>
            <span>
              יש סימנייה שמורה מ-{new Date(bookmark.updatedAt?.toMillis?.() || bookmark.createdAt?.toMillis?.() || 0).toLocaleDateString('he-IL')}
            </span>
          </div>
        )}
      </div>

      {/* כפתור שמירת ציטוט/הערה - מופיע רק כשיש טקסט מסומן */}
      {selectedText && (
        <div className="bg-btk-gold border-b border-btk-bronze p-3 sticky top-0 z-10 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm text-btk-navy font-medium">
              נבחר טקסט ({selectedText.length} תווים)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNoteContext(selectedText);
                  setShowNoteModal(true);
                }}
                className="px-4 py-2 bg-white hover:bg-btk-light-gray text-btk-navy font-medium rounded-lg transition shadow-sm"
              >
                📝 הוסף הערה
              </button>
              <button
                onClick={() => setShowQuoteModal(true)}
                className="px-4 py-2 bg-btk-navy hover:bg-btk-dark-gray text-white font-medium rounded-lg transition shadow-sm"
              >
                💾 שמור ציטוט
              </button>
            </div>
          </div>
        </div>
      )}

      {/* תוכן היחידה */}
      <div className="bg-white p-8">
        <div
          className="lesson-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: currentLesson.contentHtml }}
        />
      </div>

      {/* ניווט בין יחידות */}
      <div className="bg-white border-t border-btk-light-gray p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousLesson}
            disabled={lessonIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-btk-light-gray text-btk-navy border border-btk-light-gray font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>←</span>
            <span>יחידה קודמת</span>
          </button>

          <div className="text-btk-dark-gray">
            יחידה {lessonIndex + 1} מתוך {course.lessons.length}
          </div>

          <button
            onClick={goToNextLesson}
            disabled={lessonIndex === course.lessons.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>יחידה הבאה</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Modal לשמירת ציטוט */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-btk-navy mb-4">שמירת ציטוט</h3>

            {/* תצוגת הטקסט */}
            <div className="bg-btk-light-gray p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
              <p className="text-sm text-btk-dark-gray italic">
                "{selectedText}"
              </p>
            </div>

            {/* בחירת אוסף או יצירת חדש */}
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="collection-mode"
                  checked={!isCreatingNew}
                  onChange={() => setIsCreatingNew(false)}
                  className="text-btk-gold"
                />
                <span className="font-medium text-btk-dark-gray">בחר אוסף קיים</span>
              </label>

              {!isCreatingNew && (
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full border border-btk-light-gray rounded-lg p-2 focus:ring-2 focus:ring-btk-gold focus:border-transparent"
                >
                  <option value="">-- בחר אוסף --</option>
                  {collections.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.count})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="collection-mode"
                  checked={isCreatingNew}
                  onChange={() => setIsCreatingNew(true)}
                  className="text-btk-gold"
                />
                <span className="font-medium text-btk-dark-gray">צור אוסף חדש</span>
              </label>

              {isCreatingNew && (
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="שם האוסף החדש"
                  className="w-full border border-btk-light-gray rounded-lg p-2 focus:ring-2 focus:ring-btk-gold focus:border-transparent"
                />
              )}
            </div>

            {/* כפתורי פעולה */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedText('');
                  window.getSelection().removeAllRanges();
                }}
                className="flex-1 px-4 py-2 bg-white hover:bg-btk-light-gray text-btk-dark-gray border border-btk-light-gray font-medium rounded-lg transition"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveQuote}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal להוספת הערה */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-btk-navy mb-4">הוספת הערה</h3>

            {/* תצוגת ההקשר */}
            {noteContext && (
              <div className="bg-btk-light-gray p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
                <p className="text-sm text-btk-dark-gray italic">
                  "{noteContext}"
                </p>
              </div>
            )}

            {/* תיבת הערה */}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="כתוב את ההערה שלך כאן..."
              className="w-full border border-btk-light-gray rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-btk-gold focus:border-transparent resize-none"
              autoFocus
            />

            {/* כפתורי פעולה */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setNoteContext('');
                  window.getSelection().removeAllRanges();
                }}
                className="flex-1 px-4 py-2 bg-white hover:bg-btk-light-gray text-btk-dark-gray border border-btk-light-gray font-medium rounded-lg transition"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="flex-1 px-4 py-2 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                שמור הערה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* פאנל תצוגת הערות */}
      {showNotesPanel && (
        <NotesPanel
          userId={user.uid}
          lessonId={currentLesson.id}
          onClose={() => setShowNotesPanel(false)}
          onNoteClick={(note) => {
            // אפשר להוסיף פונקציונליות לקפיצה למיקום ההערה
            setShowNotesPanel(false);
          }}
        />
      )}

      {/* בר הקראה צף */}
      <FloatingTTSBar
        ttsEngine={ttsEngine}
        text={currentLesson.contentText}
        onEnd={handleLessonEnd}
      />
    </div>
  );
}
