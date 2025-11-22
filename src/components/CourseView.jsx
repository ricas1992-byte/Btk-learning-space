import { useState, useEffect } from 'react';

/**
 * CourseView - תצוגת קורס ויחידות הלימוד
 */
export default function CourseView({ courseId, onBack, onSelectLesson }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses?courseId=${courseId}`);

      if (!response.ok) {
        throw new Error('שגיאה בטעינת הקורס');
      }

      const data = await response.json();
      setCourse(data);
      setError('');
    } catch (err) {
      console.error('Error loading course:', err);
      setError('אירעה שגיאה בטעינת הקורס');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">טוען קורס...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2"
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
        className="mb-6 text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium"
      >
        <span>←</span>
        <span>חזרה לספרייה</span>
      </button>

      {/* כותרת הקורס */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-5xl">📖</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-gray-600 mt-2">
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
                className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* רשימת יחידות */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          יחידות הלימוד
        </h2>

        <div className="space-y-3">
          {course.lessons && course.lessons.length > 0 ? (
            course.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-500">
                    {lesson.order}
                  </span>
                  <h3 className="text-lg font-medium text-gray-800">
                    {lesson.title}
                  </h3>
                </div>

                <button
                  onClick={() => onSelectLesson(lesson.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span>למידה</span>
                  <span>→</span>
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-4">
              אין יחידות בקורס זה
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
