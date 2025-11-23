import { GoogleAuth } from 'google-auth-library';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // הגדר CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'שיטת HTTP לא מורשית' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'טקסט חובה' });
    }

    // קריאת credentials מ-GOOGLE_CREDENTIALS
    const credentialsJson = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsJson) {
      throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
    }

    const credentials = JSON.parse(credentialsJson);

    // צור Google Auth client
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    // קבל access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // הכן את גוף הבקשה ל-REST API
    const requestBody = {
      input: { text },
      voice: {
        languageCode: 'he-IL',
        name: 'he-IL-Wavenet-B',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9,
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    // שלח בקשה ישירות ל-Google Text-to-Speech REST API
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();

    // החזר את האודיו (כבר מגיע ב-base64 מה-API)
    res.status(200).json({
      success: true,
      audio: data.audioContent,
      format: 'mp3',
    });
  } catch (error) {
    console.error('Text-to-Speech error:', error);
    res.status(500).json({
      error: 'כשל בהמרת טקסט לדיבור',
      details: error.message,
    });
  }
}
