import { useState, useEffect } from 'react';
import { TTSEngine } from './utils/ttsEngine';
import UploadForm from './components/UploadForm';
import CourseLibrary from './components/CourseLibrary';
import CourseView from './components/CourseView';
import LessonPlayer from './components/LessonPlayer';

/**
 * App - הקומפוננט הראשי של האפליקציה
 */
function App() {
  // מצבי ניווט
  const [currentView, setCurrentView] = useState('library'); // 'library', 'upload', 'course', 'lesson'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // TTS Engine
  const [ttsEngine] = useState(() => new TTSEngine());
  const [ttsReady, setTtsReady] = useState(false);

  useEffect(() => {
    // אתחול TTS
    initTTS();
  }, []);

  const initTTS = async () => {
    try {
      await ttsEngine.init('he-IL');
      setTtsReady(true);
    } catch (error) {
      console.error('TTS initialization failed:', error);
    }
  };

  // ניווט
  const navigateToLibrary = () => {
    setCurrentView('library');
    setSelectedCourseId(null);
    setSelectedCourse(null);
    setSelectedLessonId(null);
  };

  const navigateToUpload = () => {
    setCurrentView('upload');
  };

  const navigateToCourse = async (courseId) => {
    setSelectedCourseId(courseId);

    // טען נתוני קורס
    try {
      const response = await fetch(`/api/courses?courseId=${courseId}`);
      if (response.ok) {
        const courseData = await response.json();
        setSelectedCourse(courseData);
        setCurrentView('course');
      }
    } catch (error) {
      console.error('Error loading course:', error);
    }
  };

  const navigateToLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setCurrentView('lesson');
  };

  const handleUploadSuccess = (courseId) => {
    // לאחר העלאה מוצלחת, חזור לספרייה
    navigateToLibrary();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ניווט עליון */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* לוגו */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={navigateToLibrary}
            >
              <span className="text-3xl">📚</span>
              <h1 className="text-2xl font-bold text-gray-800">
                מרחב הלמידה
              </h1>
            </div>

            {/* תפריט */}
            <nav className="flex gap-4">
              <button
                onClick={navigateToLibrary}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentView === 'library'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                ספרייה
              </button>
              <button
                onClick={navigateToUpload}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentView === 'upload'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                העלאת קורס
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* תוכן ראשי */}
      <main className="py-6">
        {/* הודעת TTS */}
        {!ttsReady && currentView === 'lesson' && (
          <div className="max-w-4xl mx-auto mb-4 px-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
              מנוע ההקראה עדיין נטען...
            </div>
          </div>
        )}

        {/* ספריית קורסים */}
        {currentView === 'library' && (
          <CourseLibrary onSelectCourse={navigateToCourse} />
        )}

        {/* טופס העלאה */}
        {currentView === 'upload' && (
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        )}

        {/* תצוגת קורס */}
        {currentView === 'course' && selectedCourse && (
          <CourseView
            courseId={selectedCourseId}
            onBack={navigateToLibrary}
            onSelectLesson={navigateToLesson}
          />
        )}

        {/* נגן יחידה */}
        {currentView === 'lesson' && selectedCourse && selectedLessonId && (
          <LessonPlayer
            course={selectedCourse}
            lessonId={selectedLessonId}
            ttsEngine={ttsEngine}
            onBack={() => setCurrentView('course')}
          />
        )}
      </main>

      {/* פוטר */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>מרחב הלמידה - מערכת ספריית למידה עם הקראה אוטומטית</p>
          <p className="text-sm mt-1">
            נבנה עם React, Vite, Tailwind CSS ו-Web Speech API
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
