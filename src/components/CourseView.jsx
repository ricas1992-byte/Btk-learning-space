import { useState, useEffect } from 'react';
import { getCourse } from '../services/courseService';
import { useAuth } from '../contexts/AuthContext';
import { getAllBookmarks } from '../services/bookmarkService';
import { getCourseProgress } from '../services/progressService';

/**
 * CourseView - תצוגת קורס ויחידות הלימוד
 */
export default function CourseView({ courseId, onBack, onSelectLesson }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    loadBookmarks();
  }, [user]);

  useEffect(() => {
    loadProgress();
  }, [user, courseId]);

  const loadProgress = async () => {
    if (!user || !courseId) return;

    try {
      const progress = await getCourseProgress(user.uid, courseId);
      const completed = new Set(
        progress.filter(p => p.completed).map(p => p.lessonId)
      );
      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📖 CourseView: Loading course:', courseId);

      if (!user) {
        throw new Error('משתמש לא מחובר');
      }

      // טען קורס מ-Firestore
      const foundCourse = await getCourse(courseId);

      if (!foundCourse) {
        throw new Error('הקורס לא נמצא');
      }

      // ודא שהקורס שייך למשתמש המחובר
      if (foundCourse.userId !== user.uid) {
        console.error('⚠️ Course does not belong to current user');
        throw new Error('הקורס לא שייך למשתמש הנוכחי');
      }

      console.log('✅ Course loaded successfully:', foundCourse.title);
      setCourse(foundCourse);
      setError('');
    } catch (err) {
      console.error('❌ Error loading course:', err);
      setError(err.message || 'אירעה שגיאה בטעינת הקורס');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      console.log('🔖 Loading bookmarks for user:', user.uid);
      const userBookmarks = await getAllBookmarks(user.uid);
      setBookmarks(userBookmarks);
      console.log('✅ Loaded', userBookmarks.length, 'bookmarks');
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      // לא מציג שגיאה למשתמש - זה לא קריטי
    }
  };

  const hasBookmark = (lessonId) => {
    return bookmarks.some(b => b.lessonId === lessonId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-btk-dark-gray">טוען קורס...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={onBack}
          className="mb-4 text-btk-gold hover:text-btk-bronze flex items-center gap-2 font-medium"
        >
          <span>←</span>
          <span>חזרה לספרייה</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'הקורס לא נמצא'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* כפתור חזרה */}
      <button
        onClick={onBack}
        className="mb-6 text-btk-gold hover:text-btk-bronze flex items-center gap-2 font-medium"
      >
        <span>←</span>
        <span>חזרה לספרייה</span>
      </button>

      {/* כותרת הקורס */}
      <div className="bg-white rounded-lg border border-btk-light-gray shadow-sm p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-5xl">📖</span>
          <div>
            <h1 className="text-3xl font-bold text-btk-navy">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-btk-dark-gray mt-2">
                {course.description}
              </p>
            )}
          </div>
        </div>

        {/* תגיות */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-btk-light-gray text-btk-dark-gray text-sm px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* רשימת יחידות */}
      <div className="bg-white rounded-lg border border-btk-light-gray shadow-sm p-6">
        <h2 className="text-2xl font-bold text-btk-navy mb-4">
          יחידות הלימוד
        </h2>

        <div className="space-y-3">
          {course.lessons && course.lessons.length > 0 ? (
            course.lessons.map((lesson, index) => {
              const isCompleted = completedLessons.has(lesson.id);
              const isNextLesson = !isCompleted &&
                (index === 0 || completedLessons.has(course.lessons[index - 1].id));

              return (
                <div
                  key={lesson.id}
                  className={`border rounded-lg p-4 transition flex items-center justify-between ${
                    isCompleted
                      ? 'border-green-300 bg-green-50 bg-opacity-50'
                      : isNextLesson
                        ? 'border-btk-gold bg-btk-gold bg-opacity-10 ring-2 ring-btk-gold ring-opacity-30'
                        : 'border-btk-light-gray hover:bg-btk-light-gray hover:bg-opacity-30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* אייקון השלמה או מספר */}
                    {isCompleted ? (
                      <span className="text-2xl font-bold text-green-600" title="יחידה הושלמה">
                        ✓
                      </span>
                    ) : (
                      <span className={`text-2xl font-bold ${isNextLesson ? 'text-btk-gold' : 'text-btk-dark-gray'}`}>
                        {lesson.order}
                      </span>
                    )}

                    <div>
                      <h3 className={`text-lg font-medium ${isCompleted ? 'text-green-700' : 'text-btk-navy'}`}>
                        {lesson.title}
                      </h3>
                      {isNextLesson && !isCompleted && (
                        <p className="text-xs text-btk-gold font-medium mt-1">המשך ללמוד ←</p>
                      )}
                      {isCompleted && (
                        <p className="text-xs text-green-600 mt-1">הושלמה ✓</p>
                      )}
                    </div>

                    {/* אייקונים נוספים */}
                    <div className="flex gap-2 mr-3">
                      {hasBookmark(lesson.id) && (
                        <span className="text-sm" title="יש סימנייה שמורה">🔖</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectLesson(lesson.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                      isCompleted
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : isNextLesson
                          ? 'bg-btk-gold hover:bg-btk-bronze text-btk-navy'
                          : 'bg-btk-gold hover:bg-btk-bronze text-btk-navy'
                    }`}
                  >
                    <span>{isCompleted ? 'חזור' : 'למידה'}</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-btk-dark-gray text-center py-4">
              אין יחידות בקורס זה
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
