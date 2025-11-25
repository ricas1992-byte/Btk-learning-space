import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCourses, deleteCourse } from '../services/courseService';

/**
 * CourseLibrary - ספריית קורסים
 */
export default function CourseLibrary({ onSelectCourse }) {
  const { user, migrationMessage } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user) {
        console.log('⚠️ No user logged in, clearing courses');
        setCourses([]);
        return;
      }

      console.log('📚 CourseLibrary: Starting to load courses...');

      // קרא קורסים מ-Firestore
      const firestoreCourses = await getCourses(user.uid);

      console.log('📚 CourseLibrary: Received courses from Firestore:', firestoreCourses);

      // צור אינדקס של הקורסים (רק המידע הבסיסי)
      const coursesIndex = firestoreCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        language: course.language,
        tags: course.tags,
        createdAt: course.createdAt,
        lessonCount: course.lessons ? course.lessons.length : 0,
      }));

      console.log('📚 CourseLibrary: Processed courses index:', coursesIndex);

      setCourses(coursesIndex);
      setError('');
    } catch (err) {
      console.error('❌ Error loading courses:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);

      let errorMessage = 'אירעה שגיאה בטעינת הקורסים';

      // הודעות שגיאה ספציפיות
      if (err.code === 'permission-denied') {
        errorMessage = 'שגיאת הרשאות Firestore. בדוק את Rules.';
      } else if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        errorMessage = 'נדרש אינדקס ב-Firestore. בדוק את הקונסול ליצירת האינדקס.';
      } else if (err.message) {
        errorMessage = `שגיאה: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  const handleDelete = async (courseId) => {
    const course = courses.find(c => c.id === courseId);

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את הקורס "${course.title}"?\n\nפעולה זו בלתי הפיכה.`
    );

    if (confirmed) {
      try {
        // מחק את הקורס מ-Firestore
        await deleteCourse(courseId);

        // עדכן את המצב המקומי
        setCourses(courses.filter(c => c.id !== courseId));

        // הודעת הצלחה
        alert('הקורס נמחק בהצלחה');
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('שגיאה במחיקת הקורס. אנא נסה שנית.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-btk-dark-gray">טוען קורסים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <span className="text-6xl mb-4 block">📚</span>
          <h2 className="text-2xl font-bold text-btk-navy mb-2">
            אין עדיין קורסים
          </h2>
          <p className="text-btk-dark-gray">
            התחל על ידי העלאת קורס DOCX חדש
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <span>📚</span>
        <span>ספריית הקורסים</span>
      </h1>

      {/* הודעת מיגרציה */}
      {migrationMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold">{migrationMessage}</p>
            <p className="text-sm text-green-600 mt-1">
              הקורסים שלך כעת מאוחסנים ב-Firestore ויהיו זמינים מכל מכשיר
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg border border-btk-light-gray shadow-sm hover:shadow-md transition-shadow p-6 relative"
          >
            {/* כפתור מחיקה */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(course.id);
              }}
              className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
              title="מחק קורס"
            >
              🗑️
            </button>

            {/* אייקון */}
            <div className="text-4xl mb-3">📖</div>

            {/* שם הקורס */}
            <h3 className="text-xl font-bold text-btk-navy mb-2">
              {course.title}
            </h3>

            {/* תיאור */}
            {course.description && (
              <p className="text-btk-dark-gray mb-3 line-clamp-2">
                {course.description}
              </p>
            )}

            {/* תגיות */}
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
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

            {/* מידע נוסף */}
            <div className="text-sm text-btk-dark-gray mb-4">
              <span>{course.lessonCount} יחידות</span>
              <span className="mx-2">|</span>
              <span>{course.language === 'he' ? 'עברית' : 'אנגלית'}</span>
            </div>

            {/* תאריך */}
            <div className="text-xs text-btk-dark-gray mb-4 opacity-70">
              נוצר ב-{formatDate(course.createdAt)}
            </div>

            {/* כפתור צפייה */}
            <button
              onClick={() => onSelectCourse(course.id)}
              className="w-full bg-btk-gold hover:bg-btk-bronze text-btk-navy font-semibold py-2 rounded-lg transition"
            >
              צפייה בקורס
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
