import { useState, useEffect } from 'react';

/**
 * TodoList - אפליקציית משימות מודרנית בעברית עם תמיכה מלאה ב-RTL
 * עיצוב מודרני ונקי עם אנימציות, צללים עדינים ופינות מעוגלות
 */
function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // טען משימות מ-localStorage בעליה
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('modern-todo-tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    }
  }, []);

  // שמור משימות ב-localStorage בכל שינוי
  useEffect(() => {
    try {
      localStorage.setItem('modern-todo-tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  // הוספת משימה חדשה
  const handleAddTask = (e) => {
    e.preventDefault();

    if (!newTaskText.trim()) {
      return;
    }

    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  // סימון משימה כהושלמה/לא בוצעה
  const handleToggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  // מחיקת משימה
  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      dir="rtl"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            המשימות שלי
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            ארגן את היום שלך בצורה חכמה ויעילה
          </p>
        </div>

        {/* טופס הוספת משימה */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="הוסף משימה חדשה..."
                className="w-full px-6 py-4 text-base sm:text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                maxLength={200}
                style={{ fontSize: '16px' }} // מניעת זום ב-iOS
              />
            </div>

            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ minHeight: '44px' }} // גודל נגיעה נוח
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>הוסף משימה</span>
              </span>
            </button>
          </form>
        </div>

        {/* רשימת משימות */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            // מצב ריק
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
                אין משימות עדיין
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                הוסף משימה ראשונה כדי להתחיל
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                  task.completed ? 'opacity-75' : ''
                }`}
                style={{
                  animation: `fadeSlideIn 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="flex-shrink-0 group"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label={task.completed ? 'סמן כלא בוצעה' : 'סמן כבוצעה'}
                  >
                    <div
                      className={`w-7 h-7 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        task.completed
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-400 scale-110'
                          : 'border-gray-300 hover:border-amber-400 group-hover:scale-110'
                      }`}
                    >
                      {task.completed && (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* תוכן המשימה */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-base sm:text-lg text-gray-800 break-words transition-all duration-200 ${
                        task.completed ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {task.text}
                    </p>
                  </div>

                  {/* כפתור מחיקה */}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-all duration-200 hover:bg-red-50 rounded-lg group"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label="מחק משימה"
                  >
                    <svg
                      className="w-5 h-5 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* סטטיסטיקות */}
        {tasks.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {tasks.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  סה"כ משימות
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-500">
                  {tasks.filter(t => !t.completed).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  פעילות
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-500">
                  {tasks.filter(t => t.completed).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  הושלמו
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* הוספת אנימציות CSS */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default TodoList;
