/**
 * Debug endpoint לבדיקת הגדרות Google TTS
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'שיטת HTTP לא מורשית' });
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 1. בדוק אם GOOGLE_CREDENTIALS קיים
  debugInfo.checks.credentialsExists = !!process.env.GOOGLE_CREDENTIALS;

  // 2. בדוק אם זה JSON תקין
  if (debugInfo.checks.credentialsExists) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      debugInfo.checks.credentialsValidJson = true;

      // 3. בדוק שדות חובה
      debugInfo.checks.hasProjectId = !!credentials.project_id;
      debugInfo.checks.hasPrivateKey = !!credentials.private_key;
      debugInfo.checks.hasClientEmail = !!credentials.client_email;
      debugInfo.checks.hasType = !!credentials.type;

      // 4. הצג מידע חלקי (ללא sensitive data)
      debugInfo.info = {
        projectId: credentials.project_id || 'לא נמצא',
        clientEmail: credentials.client_email ?
          credentials.client_email.substring(0, 10) + '...' :
          'לא נמצא',
        type: credentials.type || 'לא נמצא',
        hasPrivateKey: credentials.private_key ?
          `כן (${credentials.private_key.length} תווים)` :
          'לא'
      };

    } catch (error) {
      debugInfo.checks.credentialsValidJson = false;
      debugInfo.checks.jsonError = error.message;
    }
  } else {
    debugInfo.checks.credentialsValidJson = false;
    debugInfo.error = 'GOOGLE_CREDENTIALS לא מוגדר כלל!';
  }

  // 5. בדוק אם GOOGLE_APPLICATION_CREDENTIALS קיים (לא צריך)
  debugInfo.checks.oldCredentialsExists = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (debugInfo.checks.oldCredentialsExists) {
    debugInfo.warning = 'GOOGLE_APPLICATION_CREDENTIALS מוגדר אבל לא בשימוש - אפשר למחוק';
  }

  // 6. סטטוס כללי
  const allChecksPass = debugInfo.checks.credentialsExists &&
                        debugInfo.checks.credentialsValidJson &&
                        debugInfo.checks.hasProjectId &&
                        debugInfo.checks.hasPrivateKey &&
                        debugInfo.checks.hasClientEmail;

  debugInfo.status = allChecksPass ? 'הכל תקין ✅' : 'יש בעיות ❌';

  // 7. המלצות
  debugInfo.recommendations = [];

  if (!debugInfo.checks.credentialsExists) {
    debugInfo.recommendations.push('הוסף משתנה סביבה GOOGLE_CREDENTIALS ב-Vercel');
  }

  if (debugInfo.checks.credentialsExists && !debugInfo.checks.credentialsValidJson) {
    debugInfo.recommendations.push('תקן את ה-JSON של GOOGLE_CREDENTIALS (לא תקין)');
  }

  if (!debugInfo.checks.hasProjectId) {
    debugInfo.recommendations.push('ה-credentials חסר project_id');
  }

  if (!debugInfo.checks.hasPrivateKey) {
    debugInfo.recommendations.push('ה-credentials חסר private_key');
  }

  if (!debugInfo.checks.hasClientEmail) {
    debugInfo.recommendations.push('ה-credentials חסר client_email');
  }

  if (debugInfo.checks.oldCredentialsExists) {
    debugInfo.recommendations.push('מחק את GOOGLE_APPLICATION_CREDENTIALS (לא בשימוש)');
  }

  if (allChecksPass) {
    debugInfo.recommendations.push('אם עדיין לא עובד, בדוק שה-Text-to-Speech API מופעל ב-Google Cloud Console');
    debugInfo.recommendations.push('ודא שעשית redeploy אחרי שינוי משתני הסביבה');
  }

  return res.status(200).json(debugInfo);
}
