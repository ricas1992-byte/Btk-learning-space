# 🌐 מדריך הגדרת Google Cloud TTS

מדריך מפורט להוספת Google Cloud Text-to-Speech למערכת הלמידה BTK.

---

## 📋 תוכן עניינים
1. [יצירת Google Cloud Project](#1-יצירת-google-cloud-project)
2. [הפעלת Text-to-Speech API](#2-הפעלת-text-to-speech-api)
3. [יצירת Service Account](#3-יצירת-service-account)
4. [הוספת Credentials ב-Vercel](#4-הוספת-credentials-ב-vercel)
5. [בדיקה שהכל עובד](#5-בדיקה-שהכל-עובד)
6. [פתרון בעיות](#6-פתרון-בעיות)

---

## 1. יצירת Google Cloud Project

### שלב א: כניסה ל-Google Cloud Console
1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)
2. התחבר עם חשבון Google שלך

### שלב ב: יצירת פרויקט חדש (או בחירת קיים)
1. לחץ על בורר הפרויקטים בפינה השמאלית העליונה
2. לחץ על **"New Project"** / **"פרויקט חדש"**
3. שם הפרויקט: `btk-learning-space` (או כל שם אחר)
4. לחץ **"Create"**

---

## 2. הפעלת Text-to-Speech API

### שלב א: חיפוש ה-API
1. בתפריט הצד, לחץ על **"APIs & Services"** → **"Library"**
2. חפש: **"Cloud Text-to-Speech API"**
3. לחץ על התוצאה הראשונה

### שלב ב: הפעלה
1. לחץ על כפתור **"Enable"** / **"הפעל"**
2. המתן כמה שניות עד שה-API יופעל

---

## 3. יצירת Service Account

### שלב א: יצירת החשבון
1. עבור ל-**"APIs & Services"** → **"Credentials"**
2. לחץ על **"Create Credentials"** → **"Service Account"**
3. מלא את הפרטים:
   - **Service account name**: `btk-tts-service`
   - **Service account ID**: יוצג אוטומטית
   - **Description**: `Service account for BTK TTS`
4. לחץ **"Create and Continue"**

### שלב ב: הענקת הרשאות
1. תחת **"Grant this service account access to project"**:
   - **Role**: בחר **"Cloud Text-to-Speech User"** (או "Owner" אם לא מוצא)
2. לחץ **"Continue"**
3. לחץ **"Done"**

### שלב ג: יצירת מפתח (Key)
1. חזור ל-**"Credentials"**
2. תחת **"Service Accounts"**, מצא את `btk-tts-service`
3. לחץ עליו (על השם)
4. עבור לטאב **"Keys"**
5. לחץ **"Add Key"** → **"Create new key"**
6. בחר פורמט: **JSON**
7. לחץ **"Create"**

**📥 קובץ JSON יורד אוטומטית למחשב!**

הקובץ נראה כך:
```json
{
  "type": "service_account",
  "project_id": "btk-learning-space",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "btk-tts-service@btk-learning-space.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

⚠️ **חשוב**: שמור את הקובץ הזה במקום בטוח! אל תשתף אותו באף מקום!

---

## 4. הוספת Credentials ב-Vercel

### שלב א: פתיחת קובץ ה-JSON
1. פתח את קובץ ה-JSON שהורדת בעורך טקסט
2. **העתק את כל התוכן** (Ctrl+A, Ctrl+C)

### שלב ב: כניסה ל-Vercel
1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט **"Btk-learning-space"**
3. לחץ על **"Settings"** בתפריט העליון

### שלב ג: הוספת Environment Variable
1. בתפריט הצד, לחץ על **"Environment Variables"**
2. לחץ על **"Add"** או **"Add New"**
3. מלא את השדות:

   **Name (שם המשתנה):**
   ```
   GOOGLE_CREDENTIALS
   ```

   **Value (ערך המשתנה):**
   ```json
   {"type":"service_account","project_id":"btk-learning-space",...}
   ```
   👆 הדבק את **כל תוכן** קובץ ה-JSON כשורה אחת (ללא רווחים או שורות חדשות)

   **Environments (סביבות):**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. לחץ **"Save"**

### שלב ד: Redeploy
1. חזור לטאב **"Deployments"**
2. מצא את ה-deployment האחרון
3. לחץ על שלוש הנקודות (**...**) → **"Redeploy"**
4. המתן לסיום ה-deployment

---

## 5. בדיקה שהכל עובד

### שלב א: פתח את האתר
1. לחץ על **"Visit"** כדי לפתוח את האתר
2. פתח את **Developer Console** (F12)
3. לחץ על טאב **"Console"**

### שלב ב: נסה הקראה
1. היכנס לקורס כלשהו
2. בחר יחידת לימוד
3. לחץ על כפתור **"הפעל הקראה"** 🔊

### שלב ג: בדוק את הלוגים

**אם Google TTS עובד, תראה:**
```
🎤 [TTSEngine] מאתחל מנוע TTS...
✅ [TTSEngine] Web Speech API מוכן
🎯 [TTSEngine] מתחיל הקראה...
📝 [TTSEngine] אורך טקסט: XXX תווים
🌐 [TTSEngine] מנסה Google Cloud TTS...
✅ [TTSEngine] משתמש ב-Google Cloud TTS
▶️ [TTSEngine] מנגן Google TTS audio
```

**אם יש בעיה, תראה:**
```
🌐 [TTSEngine] מנסה Google Cloud TTS...
❌ [TTSEngine] Google TTS API error: {...}
⚠️ [TTSEngine] Google TTS נכשל, עובר ל-Web Speech API...
🔊 [TTSEngine] משתמש ב-Web Speech API
```

---

## 6. פתרון בעיות

### ❌ שגיאה: "GOOGLE_CREDENTIALS environment variable is not set"

**פתרון:**
- ודא שהוספת את `GOOGLE_CREDENTIALS` ב-Vercel Environment Variables
- ודא שבחרת את כל הסביבות (Production, Preview, Development)
- עשה Redeploy לפרויקט

---

### ❌ שגיאה: "Invalid JSON in GOOGLE_CREDENTIALS"

**פתרון:**
- ודא שהעתקת את **כל** תוכן קובץ ה-JSON
- ודא שזה JSON תקין (אפשר לבדוק ב-[jsonlint.com](https://jsonlint.com/))
- ודא שאין שורות חדשות או רווחים מיותרים

---

### ❌ שגיאה: "Permission denied" או "403"

**פתרון:**
- ודא שה-Service Account קיבל את התפקיד "Cloud Text-to-Speech User"
- עבור ל-Google Cloud Console → IAM & Admin → IAM
- מצא את ה-Service Account ובדוק שיש לו הרשאות
- אם צריך, הוסף את התפקיד "Text-to-Speech User" או "Owner"

---

### ❌ שגיאה: "API not enabled"

**פתרון:**
- עבור ל-Google Cloud Console
- APIs & Services → Library
- חפש "Cloud Text-to-Speech API"
- ודא שהוא מופעל (Enable)

---

### 🔊 Web Speech API עובד אבל Google TTS לא

**זה לא בעיה!** המערכת מתוכננת לעבוד עם Fallback:
- אם Google TTS לא זמין → Web Speech API עובד
- המשתמש יקבל הקראה גם בלי Google Cloud

אבל אם אתה רוצה Google TTS:
1. בדוק את הלוגים בקונסול
2. בדוק שה-credentials נוספו נכון ב-Vercel
3. בדוק שה-API מופעל ב-Google Cloud
4. עשה Redeploy

---

## 📞 תמיכה

אם יש בעיה:
1. פתח את Developer Console (F12)
2. העתק את הלוגים והשגיאות
3. בדוק את הקובץ `/api/text-to-speech.js`
4. ודא שה-credentials נכונים

---

## ✅ סיכום מהיר

1. ✅ יצרת Google Cloud Project
2. ✅ הפעלת Cloud Text-to-Speech API
3. ✅ יצרת Service Account + Key (JSON)
4. ✅ הוספת `GOOGLE_CREDENTIALS` ב-Vercel
5. ✅ עשית Redeploy
6. ✅ בדקת שהכל עובד

**הצלחת! 🎉**

Google Cloud TTS עכשיו פעיל במערכת הלמידה שלך!

---

**📝 הערה**: המערכת תמיד תעבוד - גם עם Google TTS וגם עם Web Speech API (fallback). אין חשש שמשהו ישבר.
