import { TextToSpeechClient } from '@google-cloud/text-to-speech';

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

    // אתחול לקוח Google Cloud Text-to-Speech
    const client = new TextToSpeechClient({ credentials });

    // הגדרות הבקשה
    const request = {
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

    // שלח בקשה ל-Google Cloud TTS API
    const [response] = await client.synthesizeSpeech(request);

    // המר את האודיו ל-base64
    const audioBase64 = response.audioContent.toString('base64');

    // החזר את האודיו
    res.status(200).json({
      success: true,
      audio: audioBase64,
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
