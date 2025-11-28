/**
 * פונקציות עזר לייצוא ציטוטים
 */

/**
 * ממיר Firestore timestamp לתאריך עברי
 * @param {object} timestamp - Firestore Timestamp
 * @returns {string} - תאריך בפורמט עברי
 */
function formatDate(timestamp) {
  if (timestamp?.toDate) {
    return timestamp.toDate().toLocaleDateString('he-IL');
  }
  return 'לא ידוע';
}

/**
 * ממיר ציטוטים למחרוזת Markdown
 * @param {Array} quotes - מערך ציטוטים
 * @param {string} title - כותרת הייצוא
 * @returns {string} - תוכן Markdown
 */
export function exportQuotesToMarkdown(quotes, title) {
  // כותרת עם RTL directive
  let markdown = '<div dir="rtl">\n\n';

  // כותרת ראשית
  markdown += `# ציטוטים: ${title}\n\n`;

  // תאריך ייצוא
  const today = new Date().toLocaleDateString('he-IL');
  markdown += `תאריך ייצוא: ${today}\n`;

  // ספירת ציטוטים
  const count = quotes.length;
  const quotesWord = count === 1 ? 'ציטוט' : 'ציטוטים';
  markdown += `סה"כ: ${count} ${quotesWord}\n\n`;

  markdown += '---\n\n';

  // לולאה על כל ציטוט
  quotes.forEach((quote, index) => {
    // מספר סידורי
    markdown += `## ${index + 1}.\n\n`;

    // טקסט הציטוט (blockquote)
    markdown += `> ${quote.text}\n\n`;

    // מקור
    markdown += `- **מקור:** ${quote.courseName} › ${quote.lessonTitle}\n`;

    // אוסף (אם יש)
    if (quote.collectionName) {
      markdown += `- **אוסף:** ${quote.collectionName}\n`;
    }

    // תגיות (אם יש)
    if (quote.tags && quote.tags.length > 0) {
      const tagsString = quote.tags.map(tag => `#${tag}`).join(' ');
      markdown += `- **תגיות:** ${tagsString}\n`;
    }

    // תאריך שמירה
    const savedDate = formatDate(quote.createdAt);
    markdown += `- **נשמר:** ${savedDate}\n\n`;

    // מפריד בין ציטוטים (חוץ מהאחרון)
    if (index < quotes.length - 1) {
      markdown += '---\n\n';
    }
  });

  // סגירת RTL directive
  markdown += '\n</div>';

  return markdown;
}

/**
 * מנסה לשתף קובץ דרך Share API, אם לא זמין - מוריד את הקובץ
 * @param {string} content - תוכן הקובץ
 * @param {string} filename - שם הקובץ
 * @returns {Promise<object>} - תוצאת הפעולה
 */
export async function shareOrDownload(content, filename) {
  try {
    // צור blob מהתוכן
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const file = new File([blob], filename, { type: 'text/markdown' });

    // בדוק אם Share API זמין ותומך בקבצים
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'ציטוטים',
        });
        return { method: 'share', success: true };
      } catch (error) {
        // אם המשתמש ביטל - זה לא שגיאה
        if (error.name === 'AbortError') {
          return { method: 'share', success: false, cancelled: true };
        }
        // אם נכשל מסיבה אחרת - נפול להורדה
        console.log('Share failed, falling back to download:', error);
      }
    }

    // fallback - הורדה רגילה
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { method: 'download', success: true };
  } catch (error) {
    console.error('Error in shareOrDownload:', error);
    throw error;
  }
}
