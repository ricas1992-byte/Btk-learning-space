import { useState, useEffect } from 'react';

/**
 * TaskDrawer - רכיב מגירת משימות עם שמירה ב-localStorage
 */
function TaskDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  // טען משימות מ-localStorage בעליה
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('btk-tasks');
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
      localStorage.setItem('btk-tasks', JSON.stringify(tasks));
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
      dueDate: newTaskDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setNewTaskDate('');
  };

  // סימון משימה כבוצעה/לא בוצעה
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

  // פורמט תאריך לתצוגה
  const formatDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // השוואת תאריכים (ללא שעות)
    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) {
      return 'היום';
    } else if (isSameDay(date, tomorrow)) {
      return 'מחר';
    } else {
      return date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // בדיקה אם התאריך עבר
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // מספר משימות פעילות
  const activeTasks = tasks.filter(t => !t.completed).length;

  return (
    <>
      {/* כפתור צף */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-btk-gold hover:bg-btk-bronze text-btk-navy rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-50 hover:scale-110"
        title="משימות"
        aria-label="פתח מגירת משימות"
      >
        <span className="text-2xl font-bold">✓</span>
        {activeTasks > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {activeTasks}
          </span>
        )}
      </button>

      {/* רקע כהה */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* מגירה */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-[380px] sm:w-[420px] flex flex-col`}
      >
        {/* כותרת */}
        <div className="bg-btk-navy text-white p-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>✓</span>
            <span>המשימות שלי</span>
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-btk-gold transition text-2xl leading-none"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        {/* טופס הוספת משימה */}
        <div className="p-5 border-b border-btk-light-gray">
          <form onSubmit={handleAddTask} className="space-y-3">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="הוסף משימה חדשה..."
              className="w-full px-4 py-3 border border-btk-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-btk-gold text-btk-dark-gray"
              maxLength={200}
            />

            <div className="flex gap-2">
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="flex-1 px-4 py-2 border border-btk-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-btk-gold text-btk-dark-gray text-sm"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="bg-btk-gold hover:bg-btk-bronze text-btk-navy font-bold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הוסף
              </button>
            </div>
          </form>
        </div>

        {/* רשימת משימות */}
        <div className="flex-1 overflow-y-auto p-5">
          {tasks.length === 0 ? (
            <div className="text-center text-btk-dark-gray py-12">
              <span className="text-5xl mb-3 block opacity-30">✓</span>
              <p className="text-lg">אין משימות עדיין</p>
              <p className="text-sm mt-2 opacity-70">הוסף משימה ראשונה כדי להתחיל</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white border-2 rounded-lg p-4 transition-all ${
                    task.completed
                      ? 'border-btk-light-gray bg-gray-50'
                      : 'border-btk-gold hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-1 flex-shrink-0"
                      aria-label={task.completed ? 'סמן כלא בוצעה' : 'סמן כבוצעה'}
                    >
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${
                          task.completed
                            ? 'bg-btk-gold border-btk-gold'
                            : 'border-btk-dark-gray hover:border-btk-gold'
                        }`}
                      >
                        {task.completed && (
                          <span className="text-btk-navy text-xs font-bold">✓</span>
                        )}
                      </div>
                    </button>

                    {/* תוכן המשימה */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-btk-dark-gray break-words ${
                          task.completed ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {task.text}
                      </p>

                      {task.dueDate && (
                        <div
                          className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                            task.completed
                              ? 'bg-gray-200 text-gray-500'
                              : isOverdue(task.dueDate)
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          📅 {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>

                    {/* כפתור מחיקה */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="flex-shrink-0 text-btk-dark-gray hover:text-red-600 transition text-lg"
                      aria-label="מחק משימה"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* סטטיסטיקות */}
        {tasks.length > 0 && (
          <div className="border-t border-btk-light-gray p-4 bg-btk-light-gray">
            <div className="flex justify-between text-sm text-btk-dark-gray">
              <span>סה"כ משימות: <strong>{tasks.length}</strong></span>
              <span>פעילות: <strong>{activeTasks}</strong></span>
              <span>הושלמו: <strong>{tasks.length - activeTasks}</strong></span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TaskDrawer;
