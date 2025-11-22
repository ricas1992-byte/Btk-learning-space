import { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

/**
 * LessonPlayer - נגן יחידת לימוד
 */
export default function LessonPlayer({ course, lessonId, ttsEngine, onBack }) {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonIndex, setLessonIndex] = useState(-1);

  useEffect(() => {
    if (course && course.lessons) {
      const index = course.lessons.findIndex(l => l.id === lessonId);
      setLessonIndex(index);
      if (index >= 0) {
        setCurrentLesson(course.lessons[index]);
      }
    }
  }, [course, lessonId]);

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
    </div>
  );
}
