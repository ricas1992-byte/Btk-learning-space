import { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { useAuth } from '../contexts/AuthContext';
import { saveQuote, getAllCollections } from '../services/quoteService';

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

  // זיהוי בחירת טקסט
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 0) {
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    };

    // הוסף event listeners
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection); // לתמיכה במובייל

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
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
    <div className="max-w-4xl mx-auto">
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
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-btk-gold">{currentLesson.order}</span>
          <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
        </div>
      </div>

      {/* כפתור שמירת ציטוט - מופיע רק כשיש טקסט מסומן */}
      {selectedText && (
        <div className="bg-btk-gold border-b border-btk-bronze p-3 sticky top-0 z-10 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm text-btk-navy font-medium">
              נבחר טקסט ({selectedText.length} תווים)
            </span>
            <button
              onClick={() => setShowQuoteModal(true)}
              className="px-4 py-2 bg-btk-navy hover:bg-btk-dark-gray text-white font-medium rounded-lg transition shadow-sm"
            >
              💾 שמור ציטוט
            </button>
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

      {/* נגן אודיו */}
      <AudioPlayer
        ttsEngine={ttsEngine}
        text={currentLesson.contentText}
        onEnd={handleLessonEnd}
      />

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
    </div>
  );
}
