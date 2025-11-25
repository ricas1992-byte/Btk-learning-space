# הגדרת Firestore

## אינדקסים נדרשים

כדי שהאפליקציה תעבוד כראוי, נדרש ליצור אינדקס ב-Firestore עבור שאילתת הקורסים.

### אינדקס: courses

**שדות:**
- `userId` (Ascending)
- `createdAt` (Descending)

### יצירת האינדקס

יש שתי דרכים ליצור את האינדקס:

#### אופן 1: דרך קונסול Firebase (מומלץ)

1. היכנס ל-[Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט `btk-learning`
3. עבור אל **Firestore Database** > **Indexes**
4. לחץ על **Create Index**
5. הגדר את האינדקס כך:
   - **Collection ID**: `courses`
   - **Fields to index**:
     - Field: `userId`, Order: `Ascending`
     - Field: `createdAt`, Order: `Descending`
   - **Query scope**: `Collection`
6. לחץ **Create**

#### אופן 2: דרך השגיאה בקונסול

1. התחבר לאפליקציה
2. נסה לטעון קורסים
3. אם האינדקס חסר, תופיע שגיאה בקונסול עם לינק ליצירת האינדקס
4. לחץ על הלינק ליצירת האינדקס אוטומטית
5. המתן מספר דקות עד שהאינדקס יהיה פעיל

### קוד האינדקס (לשימוש ב-firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "courses",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

## כללי אבטחה (Firestore Rules)

ודא שכללי האבטחה ב-Firestore מוגדרים כראוי:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // כללים עבור קורסים
    match /courses/{courseId} {
      // משתמשים יכולים לקרוא רק את הקורסים שלהם
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;

      // משתמשים יכולים ליצור קורסים עם ה-userId שלהם בלבד
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

      // משתמשים יכולים לעדכן רק את הקורסים שלהם
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;

      // משתמשים יכולים למחוק רק את הקורסים שלהם
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## בדיקה

אחרי יצירת האינדקס:

1. רענן את הדפדפן
2. התחבר לאפליקציה
3. הקורסים אמורים להיטען בהצלחה
4. בדוק בקונסול שאין שגיאות

## מיגרציה מ-localStorage

המערכת כוללת מנגנון אוטומטי למיגרציה של קורסים מ-localStorage ל-Firestore:

- המיגרציה רצה אוטומטית בהתחברות ראשונה
- הקורסים מועברים ל-Firestore תחת ה-`userId` של המשתמש המחובר
- אחרי המיגרציה תוצג הודעה למשתמש
- המיגרציה רצה רק פעם אחת לכל משתמש

## פתרון בעיות

### שגיאה: "failed-precondition" או "index required"

**פתרון:** צור את האינדקס כמתואר למעלה

### שגיאה: "permission-denied"

**פתרון:** בדוק את כללי האבטחה ב-Firestore ווודא שהם מוגדרים נכון

### שגיאה: "הקורסים לא נטענים"

**פתרון:**
1. בדוק את הקונסול לשגיאות
2. ודא שהמשתמש מחובר
3. ודא שהאינדקס פעיל
4. בדוק את כללי האבטחה

### קורסים לא מופיעים אחרי מיגרציה

**פתרון:**
1. בדוק את הקונסול לשגיאות מיגרציה
2. ודא שהקורסים היו ב-localStorage לפני המיגרציה
3. בדוק ב-Firestore Console אם הקורסים נוצרו
