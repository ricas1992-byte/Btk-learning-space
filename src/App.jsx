import { useState, useEffect } from 'react';
import { TTSEngine } from './utils/ttsEngine';
import { useAuth } from './contexts/AuthContext';
import { getCourse } from './services/courseService';
import UploadForm from './components/UploadForm';
import CourseLibrary from './components/CourseLibrary';
import CourseView from './components/CourseView';
import LessonPlayer from './components/LessonPlayer';
import TaskDrawer from './components/TaskDrawer';
import TodoList from './components/TodoList';

/**
 * App - הקומפוננט הראשי של האפליקציה
 */
function App() {
  console.log('[App] 🚀 App component rendering');

  // Authentication
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();

  console.log('[App] Current state - user:', user?.email || 'null', 'loading:', authLoading);

  // לוג למעקב אחרי מצב ההתחברות
  useEffect(() => {
    console.log('[App] ⚡ Auth state changed - user:', user?.email || 'null', 'loading:', authLoading);
    if (user) {
      console.log('[App] ✅ User is authenticated:', {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid
      });
    } else {
      console.log('[App] ❌ No authenticated user');
    }
  }, [user, authLoading]);

  // מצבי ניווט
  const [currentView, setCurrentView] = useState('library'); // 'library', 'upload', 'course', 'lesson', 'todo'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // מצבי טופס התחברות
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // מצב תפריט המבורגר
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navigateToTodo = () => {
    setCurrentView('todo');
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
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('נא למלא אימייל וסיסמא');
      return;
    }

    try {
      console.log('[App] Signing in with email:', email);
      await signIn(email, password);
      console.log('[App] Sign in successful');
    } catch (error) {
      console.error('[App] Error during sign in:', error);
      let errorMessage = 'שגיאה בהתחברות';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'אימייל או סיסמא שגויים';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'משתמש לא קיים. אנא הירשם תחילה.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'אימייל לא תקין';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר.';
      }

      setAuthError(errorMessage);
    }
  };

  // טיפול ברישום
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('נא למלא אימייל וסיסמא');
      return;
    }

    if (password.length < 6) {
      setAuthError('הסיסמא חייבת להכיל לפחות 6 תווים');
      return;
    }

    try {
      console.log('[App] Signing up with email:', email);
      await signUp(email, password);
      console.log('[App] Sign up successful');
    } catch (error) {
      console.error('[App] Error during sign up:', error);
      let errorMessage = 'שגיאה ברישום';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'האימייל כבר קיים במערכת. אנא התחבר.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'אימייל לא תקין';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'הסיסמא חלשה מדי. השתמש לפחות ב-6 תווים.';
      }

      setAuthError(errorMessage);
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
        <div className="max-w-md mx-auto p-6">
          <div className="text-center mb-6">
            <span className="text-6xl mb-4 block">📚</span>
            <h1 className="text-3xl font-bold text-btk-navy mb-4">
              מרחב הלמידה
            </h1>
            <p className="text-btk-dark-gray mb-2">
              מערכת ספריית למידה עם הקראה אוטומטית
            </p>
          </div>

          <form className="bg-white shadow-lg rounded-lg p-6 border border-btk-light-gray">
            <h2 className="text-xl font-bold text-btk-navy mb-4 text-center">
              התחברות / רישום
            </h2>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {authError}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-btk-dark-gray font-medium mb-2">
                אימייל
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-btk-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-btk-gold"
                placeholder="your@email.com"
                dir="ltr"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-btk-dark-gray font-medium mb-2">
                סיסמא
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-btk-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-btk-gold"
                placeholder="לפחות 6 תווים"
                dir="ltr"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSignIn}
                className="flex-1 bg-btk-gold hover:bg-btk-bronze text-btk-navy font-bold py-3 px-6 rounded-lg transition shadow-md"
              >
                התחבר
              </button>
              <button
                onClick={handleSignUp}
                className="flex-1 bg-btk-navy hover:bg-btk-dark-gray text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
              >
                הירשם
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ניווט עליון */}
      <header className="bg-white shadow-sm border-b border-btk-light-gray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* לוגו */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={navigateToLibrary}
            >
              <span className="text-2xl md:text-3xl">📚</span>
              <h1 className="text-lg md:text-2xl font-bold text-btk-navy">
                מרחב הלמידה
              </h1>
            </div>

            {/* תפריט דסקטופ */}
            <nav className="hidden md:flex items-center gap-4">
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
              <button
                onClick={navigateToTodo}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentView === 'todo'
                    ? 'bg-btk-gold text-btk-navy'
                    : 'text-btk-dark-gray hover:bg-btk-light-gray'
                }`}
              >
                משימות
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

            {/* כפתור המבורגר - מובייל בלבד */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-btk-light-gray transition"
              aria-label="תפריט"
            >
              <svg
                className="w-6 h-6 text-btk-navy"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* תפריט מובייל נפתח */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-2 border-t border-btk-light-gray pt-4">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigateToLibrary();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium transition text-right ${
                    currentView === 'library'
                      ? 'bg-btk-gold text-btk-navy'
                      : 'text-btk-dark-gray hover:bg-btk-light-gray'
                  }`}
                >
                  📖 ספרייה
                </button>
                <button
                  onClick={() => {
                    navigateToUpload();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium transition text-right ${
                    currentView === 'upload'
                      ? 'bg-btk-gold text-btk-navy'
                      : 'text-btk-dark-gray hover:bg-btk-light-gray'
                  }`}
                >
                  ⬆️ העלאת קורס
                </button>
                <button
                  onClick={() => {
                    navigateToTodo();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium transition text-right ${
                    currentView === 'todo'
                      ? 'bg-btk-gold text-btk-navy'
                      : 'text-btk-dark-gray hover:bg-btk-light-gray'
                  }`}
                >
                  ✓ משימות
                </button>

                {/* מידע משתמש במובייל */}
                <div className="flex items-center gap-3 px-4 py-3 bg-btk-light-gray rounded-lg">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-btk-dark-gray truncate">
                      {user.displayName || user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg font-medium text-right bg-btk-navy text-white hover:bg-btk-dark-gray transition"
                >
                  🚪 התנתק
                </button>
              </nav>
            </div>
          )}
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

        {/* אפליקציית משימות */}
        {currentView === 'todo' && (
          <div className="max-w-full -my-6">
            <TodoList />
          </div>
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

      {/* מגירת משימות */}
      <TaskDrawer />
    </div>
  );
}

export default App;
