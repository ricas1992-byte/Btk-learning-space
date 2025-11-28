import { useState, useEffect } from 'react';
import { getLessonNotes, deleteNote, updateNote } from '../services/noteService';

/**
 * NotesPanel - פאנל תצוגת והערות
 */
export default function NotesPanel({ userId, lessonId, onClose, onNoteClick }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadNotes();
  }, [userId, lessonId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const lessonNotes = await getLessonNotes(userId, lessonId);
      setNotes(lessonNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('האם למחוק הערה זו?')) return;

    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('שגיאה במחיקת ההערה');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId) => {
    try {
      await updateNote(noteId, { content: editContent });
      setNotes(notes.map(n => n.id === noteId ? { ...n, content: editContent } : n));
      setEditingNote(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating note:', error);
      alert('שגיאה בעדכון ההערה');
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="p-6 text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p>טוען הערות...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* כותרת */}
        <div className="bg-gradient-to-r from-btk-navy to-btk-dark-gray text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📝</span>
            <span>ההערות שלי</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-btk-gold transition p-2"
          >
            ✕
          </button>
        </div>

        {/* תוכן */}
        <div className="flex-1 overflow-y-auto p-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📝</span>
              <p className="text-btk-dark-gray text-lg">אין עדיין הערות ביחידה זו</p>
              <p className="text-sm text-btk-dark-gray mt-2">
                לחץ לחיצה ארוכה על טקסט כדי להוסיף הערה
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-btk-light-gray rounded-lg p-4 hover:shadow-md transition bg-white"
                >
                  {/* הקשר - הטקסט המקורי */}
                  {note.context && (
                    <div
                      className="bg-btk-light-gray bg-opacity-50 p-2 rounded mb-2 text-sm text-btk-dark-gray italic cursor-pointer hover:bg-opacity-70 transition"
                      onClick={() => onNoteClick && onNoteClick(note)}
                      title="לחץ לקפיצה למיקום בטקסט"
                    >
                      "{note.context}"
                    </div>
                  )}

                  {/* תוכן ההערה */}
                  {editingNote === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full border border-btk-light-gray rounded p-2 min-h-[80px] focus:ring-2 focus:ring-btk-gold focus:border-transparent"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-3 py-1 bg-btk-gold hover:bg-btk-bronze text-btk-navy rounded text-sm font-medium transition"
                        >
                          שמור
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-btk-light-gray hover:bg-btk-dark-gray hover:text-white text-btk-dark-gray rounded text-sm transition"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-btk-navy mb-2">
                      {note.content}
                    </div>
                  )}

                  {/* תאריך וכפתורים */}
                  <div className="flex items-center justify-between text-xs text-btk-dark-gray">
                    <span>{formatDate(note.createdAt)}</span>
                    {editingNote !== note.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(note)}
                          className="text-btk-gold hover:text-btk-bronze transition"
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* סיכום */}
        {notes.length > 0 && (
          <div className="bg-btk-light-gray bg-opacity-30 p-3 text-center text-sm text-btk-dark-gray border-t border-btk-light-gray">
            סה"כ {notes.length} הערות ביחידה זו
          </div>
        )}
      </div>
    </div>
  );
}
