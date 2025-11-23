# החזרת Google Cloud TTS עם fallback ל-Web Speech API

## 🎯 מטרה
החזרת תמיכה ב-Google Cloud TTS למערכת הלמידה, עם fallback אוטומטי ל-Web Speech API כשאין credentials או כשיש שגיאה.

## ✨ שינויים עיקריים

### 1. כלי גיבוי (backup-tool.html)
- ✅ כלי HTML לייצוא/ייבוא של קורסים מ-localStorage
- ✅ מאפשר גיבוי ושחזור של כל הקורסים
- ✅ ממשק עברי ידידותי למשתמש

### 2. שדרוג ttsEngine.js
- ✅ **Google Cloud TTS כברירת מחדל**: המערכת מנסה קודם להשתמש ב-Google Cloud TTS דרך `/api/text-to-speech`
- ✅ **Fallback אוטומטי**: אם Google TTS נכשל (אין credentials, שגיאת רשת, וכו') - המערכת עוברת אוטומטית ל-Web Speech API
- ✅ **לוגים מפורטים**: כל פעולה מדפיסה לוג ברור בקונסול:
  - `🌐 [TTSEngine] מנסה Google Cloud TTS...`
  - `✅ [TTSEngine] משתמש ב-Google Cloud TTS`
  - `🔊 [TTSEngine] משתמש ב-Web Speech API`
- ✅ **תאימות מלאה**: שמירת כל הממשק הקיים - AudioPlayer.jsx לא השתנה
- ✅ **שליטה מלאה**: pause/resume/stop עובדים על שני המנועים
- ✅ **API חדש**:
  - `getCurrentEngine()` - מחזיר 'google' או 'webspeech'
  - `setPreferGoogleTTS(true/false)` - הפעלה/כיבוי של Google TTS

### 3. Backup של הגרסה המקורית
- ✅ `ttsEngine.backup.js` - גיבוי של הגרסה המקורית לפני השינויים

## 🔧 טכנולוגיות
- Google Cloud Text-to-Speech API (REST)
- Web Speech API (fallback)
- HTML5 Audio Element (לניגון MP3 מ-Google)

## ✅ בדיקות
- ✅ Build עבר בהצלחה
- ✅ Dev server עולה ללא שגיאות
- ✅ Fallback ל-Web Speech API עובד כשאין credentials
- ✅ תאימות מלאה עם הממשק הקיים

## 📋 צעדים הבאים
1. להוסיף `GOOGLE_CREDENTIALS` ב-Vercel Environment Variables
2. לבדוק שהמערכת עובדת עם Google TTS בסביבת production
3. לבדוק שה-fallback עובד כצפוי

## 🔗 קבצים שונו
- ✅ `backup-tool.html` - חדש
- ✅ `src/utils/ttsEngine.backup.js` - חדש (backup)
- ✅ `src/utils/ttsEngine.js` - שודרג
- ✅ `package-lock.json` - עודכן

## 📊 Commits
```
e51e508 עדכון package-lock.json אחרי התקנת dependencies
86be2f5 שדרוג ttsEngine.js עם תמיכה ב-Google Cloud TTS
c205535 הוספת כלי גיבוי ו-backup של ttsEngine
```

---

**⚠️ לתשומת לב**: המערכת תעבוד מיד עם Web Speech API. כדי להפעיל Google Cloud TTS, יש להוסיף את משתנה הסביבה `GOOGLE_CREDENTIALS` ב-Vercel (ראה מדריך להלן).
