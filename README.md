# 📚 מרחב הלמידה

מערכת ספריית למידה מבוססת DOCX עם הקראה אוטומטית באמצעות Web Speech API.

## תכונות

- 📤 **העלאת קורסים מקובצי DOCX** - המרה אוטומטית לקורס מובנה
- 🔊 **הקראה אוטומטית** - Web Speech API עם תמיכה בעברית ואנגלית
- 📖 **ספריית קורסים** - ניהול ותצוגה של כל הקורסים
- 🎯 **יחידות לימוד** - חלוקה אוטומטית ליחידות לפי כותרות
- 🎨 **ממשק עברי מלא** - תמיכת RTL ועיצוב נקי
- ⚡ **פריסה קלה** - Vercel Serverless Functions

## דרישות מקדימות

- Node.js 18+
- npm או yarn
- חשבון Vercel (לפריסה בענן)

## התקנה והפעלה מקומית

### 1. שכפל את הפרויקט

```bash
git clone <repository-url>
cd btk-learning-space
```

### 2. התקן תלויות

```bash
npm install
```

### 3. הגדר משתני סביבה

צור קובץ `.env` בשורש הפרויקט והעתק את התוכן מ-`.env.example`:

```bash
cp .env.example .env
```

ערוך את הקובץ `.env` והזן את ערכי Firebase שלך:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**איך למצוא את הערכים:**
1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך (או צור חדש)
3. לך ל-**Project Settings** > **General**
4. גלול ל-**Your apps** > בחר באפליקציית Web
5. העתק את הערכים מ-**Firebase SDK snippet** > **Config**

### 4. הרץ בסביבת פיתוח

```bash
npm run dev
```

האפליקציה תהיה זמינה ב: `http://localhost:3000`

### 4. בניית הפרויקט

```bash
npm run build
```

## פריסה ל-Vercel

### אופציה 1: דרך ממשק Vercel

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. לחץ על **"Add New Project"**
3. בחר את ה-repository שלך מ-GitHub
4. Vercel יזהה אוטומטית את הגדרות Vite
5. **לפני Deploy** - הוסף את משתני הסביבה:
   - לך ל-**Environment Variables**
   - הוסף את כל המשתנים מקובץ `.env.example`
   - העתק את הערכים האמיתיים מ-Firebase Console
6. לחץ על **"Deploy"**

**חשוב:** אחרי כל שינוי במשתני הסביבה ב-Vercel, חובה לעשות Redeploy!

### אופציה 2: דרך CLI

```bash
# התקן Vercel CLI
npm install -g vercel

# התחבר לחשבון
vercel login

# פרוס
vercel
```

## פורמט קובץ DOCX נדרש

המערכת מעבדת קבצי DOCX לפי המבנה הבא:

### מבנה מומלץ

```
שם הקורס (אופציונלי - Heading 1)

יחידה 1: מבוא (Heading 2)

כותרת משנה (Heading 3)
טקסט רגיל של היחידה...

יחידה 2: נושא מתקדם (Heading 2)

כותרת משנה (Heading 3)
טקסט נוסף...
```

### כללי עיצוב

- **Heading 1** - כותרת הקורס (אופציונלי, ניתן להזין ידנית)
- **Heading 2** - כותרת יחידת לימוד (המערכת תחלק את הקורס ליחידות לפי H2)
- **Heading 3** - כותרות משנה בתוך יחידה
- **Normal** - טקסט רגיל
- **Bold/Italic** - דגשים (ישמרו)
- **Lists** - רשימות ממוספרות ולא ממוספרות

### דוגמה

ראה את הקובץ: `examples/DOCX-FORMAT-GUIDE.md`

## Stack טכנולוגי

### Frontend
- **React 18** - ספריית UI
- **Vite** - כלי build מהיר
- **Tailwind CSS** - עיצוב עם תמיכת RTL
- **Web Speech API** - הקראה אוטומטית

### Backend
- **Vercel Serverless Functions** - Node.js
- **mammoth.js** - המרת DOCX ל-HTML
- **formidable** - טיפול בהעלאת קבצים
- **uuid** - יצירת מזהים ייחודיים

### אחסון
- JSON files ב-`public/courses/`
- אינדקס קורסים: `public/courses/index.json`
- קורסים: `public/courses/{courseId}.json`

## מבנה הפרויקט

```
btk-learning-space/
├── api/                    # Vercel Serverless Functions
│   ├── upload.js          # העלאת DOCX ועיבוד
│   └── courses.js         # API לקורסים
├── public/
│   └── courses/           # JSON files של קורסים
├── src/
│   ├── components/        # קומפוננטות React
│   │   ├── AudioPlayer.jsx
│   │   ├── CourseLibrary.jsx
│   │   ├── CourseView.jsx
│   │   ├── LessonPlayer.jsx
│   │   └── UploadForm.jsx
│   ├── utils/
│   │   └── ttsEngine.js   # Web Speech API wrapper
│   ├── App.jsx            # קומפוננט ראשי
│   ├── main.jsx           # Entry point
│   └── index.css          # סגנונות גלובליים
├── examples/              # דוגמאות
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

## שימוש במערכת

### 1. העלאת קורס חדש

1. לחץ על **"העלאת קורס"** בתפריט העליון
2. בחר קובץ DOCX
3. הזן:
   - שם הקורס (חובה)
   - תיאור (אופציונלי)
   - שפה (עברית/אנגלית)
   - תגיות (מופרדות בפסיקים)
4. לחץ **"צור קורס ללמידה"**
5. המערכת תעבד את הקובץ ותחלק אותו ליחידות

### 2. צפייה בקורסים

1. היכנס ל**"ספרייה"**
2. לחץ על **"צפייה בקורס"** על הקורס הרצוי
3. בחר יחידה ללמידה

### 3. למידה עם הקראה

1. בתוך יחידת לימוד, לחץ על **"הפעל"** בנגן האודיו
2. ניתן להשהות/להמשיך/לעצור את ההקראה
3. עבור בין יחידות עם הכפתורים **"יחידה קודמת"** / **"יחידה הבאה"**

## תמיכה בדפדפנים

Web Speech API נתמך ב:
- ✅ Chrome/Edge (מומלץ)
- ✅ Safari
- ⚠️ Firefox (תמיכה חלקית)

## פתרון בעיות

### ההקראה לא עובדת

1. ודא שאתה משתמש בדפדפן נתמך (Chrome מומלץ)
2. בדוק שההרשאות לאודיו מאושרות
3. נסה לרענן את הדף

### העלאת DOCX נכשלת

1. ודא שהקובץ הוא DOCX תקני (לא DOC)
2. בדוק שיש לפחות Heading 2 אחד בקובץ
3. נסה לפתוח את הקובץ ב-Word ולשמור מחדש

### הקורסים לא נטענים

1. ודא שהתיקייה `public/courses/` קיימת
2. בדוק ש-`index.json` קיים ותקין
3. בדוק את console ב-DevTools לשגיאות

## תרומה

Pull requests מתקבלים בברכה! לשינויים גדולים, אנא פתח issue תחילה.

## רישיון

MIT

## יצירת קשר

לשאלות או בעיות, פתח issue ב-GitHub.

---

**נבנה עם ❤️ עבור לומדים בעברית**