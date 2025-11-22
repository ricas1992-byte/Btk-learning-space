import { useState } from 'react';

/**
 * UploadForm - טופס העלאת קורס DOCX
 */
export default function UploadForm({ onUploadSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'he',
    tags: '',
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(''); // '', 'uploading', 'processing', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx')) {
        setErrorMessage('אנא בחר קובץ DOCX בלבד');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ולידציה
    if (!file) {
      setErrorMessage('אנא בחר קובץ DOCX');
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage('אנא הזן שם לקורס');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');

    try {
      // צור FormData
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('language', formData.language);
      formDataToSend.append('tags', formData.tags);

      setStatus('processing');

      // שלח ל-API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('העלאת הקובץ נכשלה');
      }

      const result = await response.json();

      // שמור את הקורס ב-localStorage
      if (result.success && result.course) {
        const storedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        storedCourses.push(result.course);
        localStorage.setItem('courses', JSON.stringify(storedCourses));
      }

      setStatus('success');

      // איפוס הטופס
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          language: 'he',
          tags: '',
        });
        setFile(null);
        setStatus('');

        // קריאה ל-callback
        if (onUploadSuccess) {
          onUploadSuccess(result.course.id);
        }
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'אירעה שגיאה בהעלאת הקורס. אנא נסה שנית.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📤</span>
          <span>העלאת קורס חדש</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* בחירת קובץ */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              בחר קובץ DOCX *
            </label>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={status === 'uploading' || status === 'processing'}
            />
            {file && (
              <p className="text-sm text-green-600 mt-1">
                ✓ {file.name}
              </p>
            )}
          </div>

          {/* שם הקורס */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              שם הקורס *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="לדוגמה: מבוא לפסיכולוגיה"
              disabled={status === 'uploading' || status === 'processing'}
              required
            />
          </div>

          {/* תיאור */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              תיאור
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="תיאור קצר של הקורס..."
              rows="3"
              disabled={status === 'uploading' || status === 'processing'}
            />
          </div>

          {/* שפה */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              שפה *
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={status === 'uploading' || status === 'processing'}
            >
              <option value="he">עברית</option>
              <option value="en">אנגלית</option>
            </select>
          </div>

          {/* תגיות */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              תגיות
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="מוטוריקה, פסיכולוגיה (מופרדות בפסיקים)"
              disabled={status === 'uploading' || status === 'processing'}
            />
            <p className="text-sm text-gray-500 mt-1">
              הפרד תגיות בפסיקים
            </p>
          </div>

          {/* הודעות סטטוס */}
          {status === 'uploading' && (
            <div className="text-blue-600 flex items-center gap-2">
              <div className="spinner"></div>
              <span>מעלה קובץ...</span>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-blue-600 flex items-center gap-2">
              <div className="spinner"></div>
              <span>מעבד DOCX ויוצר יחידות...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="text-green-600 font-medium">
              ✓ הקורס נוצר בהצלחה!
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="text-red-600 font-medium">
              ✗ {errorMessage}
            </div>
          )}

          {errorMessage && status !== 'error' && (
            <div className="text-red-600 font-medium">
              ✗ {errorMessage}
            </div>
          )}

          {/* כפתור שליחה */}
          <button
            type="submit"
            disabled={status === 'uploading' || status === 'processing' || status === 'success'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            צור קורס ללמידה
          </button>
        </form>
      </div>
    </div>
  );
}
