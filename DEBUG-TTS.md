# 🔧 מדריך תיקון בעיות TTS (הקראה)

## 🚨 הבעיה: ההקראה לא עובדת בכלל!

המדריך הזה יעזור לך לאבחן ולתקן את הבעיה.

---

## 📋 שלב 1: בדיקת משתני סביבה ב-Vercel

### איזה משתנה הקוד משתמש?

הקוד שלך ב-`api/text-to-speech.js` משתמש **רק** ב:

```javascript
const credentialsJson = process.env.GOOGLE_CREDENTIALS;  // שורה 31
```

### ✅ מה לעשות:

1. **כנס ל-Vercel Dashboard** → בחר את הפרויקט → Settings → Environment Variables

2. **בדוק שיש לך:**
   - ✅ `GOOGLE_CREDENTIALS` - **משמש בקוד**
   - ❌ `GOOGLE_APPLICATION_CREDENTIALS` - **לא משמש, אפשר למחוק**

3. **ודא שה-GOOGLE_CREDENTIALS מכיל JSON תקין:**

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

4. **אחרי שינוי משתני סביבה - חובה לעשות redeploy:**

```bash
# אופציה 1: מהשורת פקודה
git commit --allow-empty -m "Trigger redeploy"
git push

# אופציה 2: מ-Vercel Dashboard
Deployments → לחץ על "Redeploy" על ה-deployment האחרון
```

---

## 🐛 שלב 2: בדיקת תקינות ה-API

### הרץ את endpoint ה-debug:

לאחר deploy, פתח בדפדפן:

```
https://YOUR-DOMAIN.vercel.app/api/debug-tts
```

תראה פלט כזה:

```json
{
  "timestamp": "2025-11-23T...",
  "checks": {
    "credentialsExists": true,
    "credentialsValidJson": true,
    "hasProjectId": true,
    "hasPrivateKey": true,
    "hasClientEmail": true,
    "hasType": true,
    "oldCredentialsExists": true
  },
  "info": {
    "projectId": "my-project-123",
    "clientEmail": "my-servic...",
    "type": "service_account",
    "hasPrivateKey": "כן (1679 תווים)"
  },
  "status": "הכל תקין ✅",
  "recommendations": [
    "מחק את GOOGLE_APPLICATION_CREDENTIALS (לא בשימוש)"
  ]
}
```

### 🔍 מה לבדוק:

- ✅ **credentialsExists: true** - המשתנה קיים
- ✅ **credentialsValidJson: true** - ה-JSON תקין
- ✅ **hasProjectId/hasPrivateKey/hasClientEmail: true** - כל השדות הנדרשים קיימים
- ✅ **status: "הכל תקין ✅"** - הכל בסדר!

אם יש ❌ באחד מהבדיקות - תקן לפי ה-recommendations.

---

## 🎤 שלב 3: בדיקת Console Logs בדפדפן

### פתח את Console בדפדפן:

1. **Chrome/Edge:** לחץ F12 → לשונית Console
2. **Firefox:** לחץ F12 → לשונית Console
3. **Safari:** Develop → Show JavaScript Console

### נסה להקריא משהו ותראה מה קורה:

#### ✅ אם Google TTS עובד, תראה:

```
🎤 [TTSEngine] מאתחל מנוע TTS...
✅ [TTSEngine] Web Speech API מוכן
🎯 [TTSEngine] מתחיל הקראה...
🌐 [TTSEngine] מנסה Google Cloud TTS...
🔄 [TTSEngine] שולח בקשה ל-Google TTS API...
✅ [TTSEngine] קיבלתי אודיו מ-Google TTS
▶️ [TTSEngine] מנגן Google TTS audio
✅ [TTSEngine] משתמש ב-Google Cloud TTS
```

#### ⚠️ אם Google TTS נכשל אבל Web Speech עובד:

```
🎤 [TTSEngine] מאתחל מנוע TTS...
✅ [TTSEngine] Web Speech API מוכן
🎯 [TTSEngine] מתחיל הקראה...
🌐 [TTSEngine] מנסה Google Cloud TTS...
🔄 [TTSEngine] שולח בקשה ל-Google TTS API...
❌ [TTSEngine] Google TTS API error: { status: 500, ... }
💡 [TTSEngine] הבעיה היא בשרת - בדוק את משתני הסביבה ב-Vercel
⚠️ [TTSEngine] Google TTS נכשל, עובר ל-Web Speech API...
🔊 [TTSEngine] משתמש ב-Web Speech API
🎤 [TTSEngine] מתחיל הקראה עם Web Speech API
▶️ [TTSEngine] ההקראה התחילה
```

#### ❌ אם שני המנועים נכשלים:

```
🎤 [TTSEngine] מאתחל מנוע TTS...
✅ [TTSEngine] Web Speech API מוכן
🎯 [TTSEngine] מתחיל הקראה...
🌐 [TTSEngine] מנסה Google Cloud TTS...
❌ [TTSEngine] Google TTS API error: { status: 500, ... }
⚠️ [TTSEngine] Google TTS נכשל, עובר ל-Web Speech API...
❌ [TTSEngine] Web Speech API error: not-allowed
💡 [TTSEngine] הדפדפן חסם את ההקראה - ייתכן שצריך אישור מהמשתמש
```

---

## 🔧 שלב 4: תיקון בעיות נפוצות

### 🚨 בעיה 1: Google TTS נכשל עם status: 500

**סיבה:** `GOOGLE_CREDENTIALS` לא מוגדר נכון או חסר.

**פתרון:**
1. בדוק ב-Vercel → Settings → Environment Variables
2. ודא שה-JSON תקין (העתק מחדש מ-Google Cloud Console)
3. עשה redeploy

---

### 🚨 בעיה 2: Google TTS נכשל עם status: 403

**סיבה:** ה-Service Account לא מורשה או ה-API לא מופעל.

**פתרון:**
1. כנס ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט הנכון
3. לך ל-APIs & Services → Library
4. חפש "Cloud Text-to-Speech API"
5. לחץ "Enable"
6. ודא שה-Service Account שלך קיים ב-IAM & Admin

---

### 🚨 בעיה 3: Web Speech API נכשל עם "not-allowed"

**סיבה:** הדפדפן חוסם את ההקראה (בעיקר Safari).

**פתרון:**
1. **Chrome/Edge:** בדרך כלל עובד ללא בעיות
2. **Firefox:** ייתכן שצריך לאשר גישה
3. **Safari:** תמיכה מוגבלת - נסה דפדפן אחר
4. ודא שאתה מפעיל את ההקראה **לאחר לחיצה של המשתמש** (לא אוטומטית)

---

### 🚨 בעיה 4: "Web Speech API לא זמין בדפדפן זה"

**פתרון:** השתמש בדפדפן מודרני:
- ✅ Chrome (מומלץ!)
- ✅ Edge
- ⚠️ Firefox (תמיכה חלקית)
- ❌ Safari (תמיכה מוגבלת)

---

## 📞 עדיין לא עובד?

1. **הפעל את ה-debug endpoint:**
   ```
   https://YOUR-DOMAIN.vercel.app/api/debug-tts
   ```

2. **בדוק את ה-Console logs** בדפדפן (F12)

3. **שלח צילום מסך של:**
   - פלט ה-debug endpoint
   - Console logs מהדפדפן
   - הגדרות Environment Variables ב-Vercel (ללא ה-credentials עצמם!)

---

## ✅ סיכום - צ'קליסט מהיר

- [ ] `GOOGLE_CREDENTIALS` מוגדר ב-Vercel עם JSON תקין
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` נמחק (לא נדרש)
- [ ] עשיתי redeploy אחרי שינוי משתני סביבה
- [ ] `https://YOUR-DOMAIN.vercel.app/api/debug-tts` מחזיר "הכל תקין ✅"
- [ ] Google Cloud Text-to-Speech API מופעל בפרויקט
- [ ] משתמש בדפדפן Chrome/Edge (לא Safari)
- [ ] בדקתי את ה-Console logs (F12) בדפדפן

---

**📝 הערה:** אם אתה רואה לוגים עם 🔄/✅/❌/💡 ב-Console, זה אומר שהקוד החדש עובד!
