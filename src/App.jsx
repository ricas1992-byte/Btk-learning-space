import { useState, useEffect } from 'react';
import { TTSEngine } from './utils/ttsEngine';
import { useAuth } from './contexts/AuthContext';
import { getCourse } from './services/courseService';
import UploadForm from './components/UploadForm';
import CourseLibrary from './components/CourseLibrary';
import CourseView from './components/CourseView';
import LessonPlayer from './components/LessonPlayer';

/**
 * App - הקומפוננט הראשי של האפליקציה
 */
function App() {
  // Authentication
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

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

    // טען נתוני קורס מ-Firestore
    try {
      const courseData = await getCourse(courseId);

      if (courseData) {
        setSelectedCourse(courseData);
        setCurrentView('course');
      } else {
        console.error('Course not found:', courseId);
        alert('לא נמצא קורס זה');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('שגיאה בטעינת הקורס');
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

  // טיפול בהתחברות
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error during sign in:', error);
      alert('שגיאה בהתחברות. אנא נסה שנית.');
    }
  };

  // טיפול בהתנתקות
  const handleSignOut = async () => {
    try {
      await signOut();
      navigateToLibrary();
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('שגיאה בהתנתקות. אנא נסה שנית.');
    }
  };

  // אם עדיין טוען את סטטוס ההתחברות
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-btk-dark-gray">טוען...</p>
        </div>
      </div>
    );
  }

  // אם המשתמש לא מחובר
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 text-center">
          <span className="text-6xl mb-4 block">📚</span>
          <h1 className="text-3xl font-bold text-btk-navy mb-4">
            מרחב הלמידה
          </h1>
          <p className="text-btk-dark-gray mb-6">
            מערכת ספריית למידה עם הקראה אוטומטית
          </p>
          <p className="text-btk-dark-gray mb-6">
            התחבר כדי להתחיל ללמוד ולסנכרן את הקורסים שלך בין מכשירים
          </p>
          <button
            onClick={handleSignIn}
            className="bg-btk-gold hover:bg-btk-bronze text-btk-navy font-bold py-3 px-6 rounded-lg transition shadow-md flex items-center justify-center gap-3 mx-auto"
          >
            <span>🔐</span>
            <span>התחבר עם Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ניווט עליון */}
      <header className="bg-white shadow-sm border-b border-btk-light-gray">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* לוגו */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={navigateToLibrary}
            >
              <span className="text-3xl">📚</span>
              <h1 className="text-2xl font-bold text-btk-navy">
                מרחב הלמידה
              </h1>
            </div>

            {/* תפריט */}
            <nav className="flex items-center gap-4">
              <button
                onClick={navigateToLibrary}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentView === 'library'
                    ? 'bg-btk-gold text-btk-navy'
                    : 'text-btk-dark-gray hover:bg-btk-light-gray'
                }`}
              >
                ספרייה
              </button>
              <button
                onClick={navigateToUpload}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentView === 'upload'
                    ? 'bg-btk-gold text-btk-navy'
                    : 'text-btk-dark-gray hover:bg-btk-light-gray'
                }`}
              >
                העלאת קורס
              </button>

              {/* מידע משתמש */}
              <div className="flex items-center gap-3 border-r border-btk-light-gray pr-4">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-btk-dark-gray">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-btk-dark-gray hover:text-btk-navy transition"
                  title="התנתק"
                >
                  יציאה
                </button>
              </div>
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
      <footer className="bg-white border-t border-btk-light-gray mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-btk-dark-gray">
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
