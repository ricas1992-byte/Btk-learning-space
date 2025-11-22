import { useState, useEffect } from 'react';

/**
 * CourseLibrary - ספריית קורסים
 */
export default function CourseLibrary({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');

      if (!response.ok) {
        throw new Error('שגיאה בטעינת הקורסים');
      }

      const data = await response.json();
      setCourses(data);
      setError('');
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('אירעה שגיאה בטעינת הקורסים');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">טוען קורסים...</p>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            אין עדיין קורסים
          </h2>
          <p className="text-gray-600">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            {/* אייקון */}
            <div className="text-4xl mb-3">📖</div>

            {/* שם הקורס */}
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {course.title}
            </h3>

            {/* תיאור */}
            {course.description && (
              <p className="text-gray-600 mb-3 line-clamp-2">
                {course.description}
              </p>
            )}

            {/* תגיות */}
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {course.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* מידע נוסף */}
            <div className="text-sm text-gray-500 mb-4">
              <span>{course.lessonCount} יחידות</span>
              <span className="mx-2">|</span>
              <span>{course.language === 'he' ? 'עברית' : 'אנגלית'}</span>
            </div>

            {/* תאריך */}
            <div className="text-xs text-gray-400 mb-4">
              נוצר ב-{formatDate(course.createdAt)}
            </div>

            {/* כפתור צפייה */}
            <button
              onClick={() => onSelectCourse(course.id)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition"
            >
              צפייה בקורס
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
