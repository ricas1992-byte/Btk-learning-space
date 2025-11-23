/**
 * TTSEngine - Hybrid TTS Engine
 * מנוע הקראה היברידי: Google Cloud TTS עם fallback ל-Web Speech API
 */
export class TTSEngine {
  constructor() {
    // Web Speech API
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.utterance = null;

    // Google TTS Audio Player
    this.audioElement = null;
    this.currentAudioBlob = null;

    // Engine state
    this.isInitialized = false;
    this.currentEngine = null; // 'google' או 'webspeech'
    this.preferGoogleTTS = true; // האם לנסות Google TTS קודם

    // Callbacks
    this.onEndCallback = null;
    this.onProgressCallback = null;
  }

  /**
   * אתחול המנוע וטעינת קולות
   * @param {string} lang - שפה (he-IL / en-US)
   */
  async init(lang = 'he-IL') {
    console.log('🎤 [TTSEngine] מאתחל מנוע TTS...');

    return new Promise((resolve) => {
      const loadVoices = () => {
        const voices = this.synth.getVoices();

        if (voices.length === 0) {
          // חלק מהדפדפנים טוענים את הקולות באופן אסינכרוני
          return;
        }

        // חפש קול מתאים לשפה
        const langPrefix = lang.split('-')[0];
        this.voice = voices.find(v => v.lang.startsWith(langPrefix)) || voices[0];

        this.isInitialized = true;
        console.log('✅ [TTSEngine] Web Speech API מוכן');
        console.log(`📢 [TTSEngine] קול נבחר: ${this.voice?.name || 'ברירת מחדל'}`);
        resolve(this.voice);
      };

      // טען קולות
      loadVoices();

      // אירוע טעינת קולות (נדרש בחלק מהדפדפנים)
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    });
  }

  /**
   * הקרא טקסט - ינסה Google TTS ואז Web Speech API
   * @param {string} text - הטקסט להקראה
   * @param {function} onEnd - callback כשההקראה נגמרת
   * @param {function} onProgress - callback לעדכון התקדמות
   */
  async speak(text, onEnd = null, onProgress = null) {
    if (!this.isInitialized) {
      console.warn('⚠️ [TTSEngine] המנוע לא אותחל');
      return;
    }

    // שמור callbacks
    this.onEndCallback = onEnd;
    this.onProgressCallback = onProgress;

    // עצור הקראה קודמת
    this.stop();

    console.log('🎯 [TTSEngine] מתחיל הקראה...');
    console.log(`📝 [TTSEngine] אורך טקסט: ${text.length} תווים`);

    // נסה Google TTS קודם (אם מופעל)
    if (this.preferGoogleTTS) {
      console.log('🌐 [TTSEngine] מנסה Google Cloud TTS...');
      const googleSuccess = await this._speakWithGoogle(text);

      if (googleSuccess) {
        console.log('✅ [TTSEngine] משתמש ב-Google Cloud TTS');
        this.currentEngine = 'google';
        return;
      }

      console.log('⚠️ [TTSEngine] Google TTS נכשל, עובר ל-Web Speech API...');
    }

    // Fallback ל-Web Speech API
    console.log('🔊 [TTSEngine] משתמש ב-Web Speech API');
    this.currentEngine = 'webspeech';
    this._speakWithWebSpeech(text);
  }

  /**
   * נסה להשתמש ב-Google Cloud TTS
   * @private
   */
  async _speakWithGoogle(text) {
    try {
      console.log('🔄 [TTSEngine] שולח בקשה ל-Google TTS API...');

      // קריאה ל-API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }

        console.error('❌ [TTSEngine] Google TTS API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        // הודעת שגיאה ידידותית למשתמש
        if (response.status === 500) {
          console.error('💡 [TTSEngine] הבעיה היא בשרת - בדוק את משתני הסביבה ב-Vercel');
        } else if (response.status === 403) {
          console.error('💡 [TTSEngine] אין הרשאה - בדוק את ה-credentials ב-Google Cloud');
        }

        return false;
      }

      const data = await response.json();

      if (!data.success || !data.audio) {
        console.error('❌ [TTSEngine] Google TTS החזיר תשובה לא תקינה:', data);
        return false;
      }

      console.log('✅ [TTSEngine] קיבלתי אודיו מ-Google TTS');

      // המר base64 ל-blob
      const audioBlob = this._base64ToBlob(data.audio, 'audio/mp3');

      // נגן את האודיו
      await this._playGoogleAudio(audioBlob);

      return true;
    } catch (error) {
      console.error('❌ [TTSEngine] Google TTS exception:', error);
      console.error('💡 [TTSEngine] סוג השגיאה:', error.name);
      console.error('💡 [TTSEngine] הודעת השגיאה:', error.message);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('💡 [TTSEngine] בעיית רשת - האם ה-API endpoint זמין?');
      }

      return false;
    }
  }

  /**
   * נגן אודיו מ-Google TTS
   * @private
   */
  async _playGoogleAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      // צור Audio element אם לא קיים
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }

      // צור URL מה-blob
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audioElement.src = audioUrl;
      this.currentAudioBlob = audioUrl;

      // אירוע סיום
      this.audioElement.onended = () => {
        console.log('✅ [TTSEngine] Google TTS הסתיים');
        URL.revokeObjectURL(audioUrl);
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        resolve();
      };

      // אירוע שגיאה
      this.audioElement.onerror = (error) => {
        console.error('❌ [TTSEngine] שגיאה בניגון אודיו:', error);
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };

      // אירוע התקדמות (תמיכה חלקית - לפי זמן ולא תווים)
      this.audioElement.ontimeupdate = () => {
        if (this.onProgressCallback && this.audioElement.duration) {
          const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
          // המר אחוזים לאינדקס תו משוער
          const estimatedCharIndex = Math.floor((progress / 100) * 1000); // ערך משוער
          this.onProgressCallback(estimatedCharIndex, 1000);
        }
      };

      // נגן
      this.audioElement.play()
        .then(() => {
          console.log('▶️ [TTSEngine] מנגן Google TTS audio');
        })
        .catch(error => {
          console.error('❌ [TTSEngine] נכשל להפעיל אודיו:', error);
          reject(error);
        });
    });
  }

  /**
   * השתמש ב-Web Speech API (הקוד המקורי)
   * @private
   */
  _speakWithWebSpeech(text) {
    // בדיקות תקינות
    if (!this.synth) {
      console.error('❌ [TTSEngine] Web Speech API לא זמין בדפדפן זה');
      console.error('💡 [TTSEngine] נסה דפדפן אחר (Chrome/Edge מומלצים)');
      return;
    }

    if (!this.voice) {
      console.error('❌ [TTSEngine] לא נמצא קול מתאים');
      console.error('💡 [TTSEngine] הקולות הזמינים:', this.synth.getVoices().map(v => v.name));
      return;
    }

    console.log('🎤 [TTSEngine] מתחיל הקראה עם Web Speech API');
    console.log('📢 [TTSEngine] קול:', this.voice.name, '| שפה:', this.voice.lang);

    // צור utterance חדש
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.voice = this.voice;
    this.utterance.lang = this.voice?.lang || 'he-IL';
    this.utterance.rate = 0.9; // קצב קריאה
    this.utterance.pitch = 1.0; // גובה קול
    this.utterance.volume = 1.0; // עוצמה

    // אירועים
    if (this.onEndCallback) {
      this.utterance.onend = () => {
        console.log('✅ [TTSEngine] Web Speech API הסתיים');
        this.onEndCallback();
      };
    }

    if (this.onProgressCallback) {
      this.utterance.onboundary = (event) => {
        this.onProgressCallback(event.charIndex, text.length);
      };
    }

    this.utterance.onerror = (event) => {
      console.error('❌ [TTSEngine] Web Speech API error:', event.error);

      // הודעות שגיאה ספציפיות
      switch (event.error) {
        case 'not-allowed':
          console.error('💡 [TTSEngine] הדפדפן חסם את ההקראה - ייתכן שצריך אישור מהמשתמש');
          break;
        case 'network':
          console.error('💡 [TTSEngine] בעיית רשת - בדוק את החיבור לאינטרנט');
          break;
        case 'synthesis-failed':
          console.error('💡 [TTSEngine] הסינתזה נכשלה - נסה טקסט קצר יותר');
          break;
        case 'synthesis-unavailable':
          console.error('💡 [TTSEngine] השירות לא זמין - נסה שוב מאוחר יותר');
          break;
        case 'audio-busy':
          console.error('💡 [TTSEngine] האודיו תפוס - חכה שההקראה הקודמת תסתיים');
          break;
        case 'canceled':
          console.error('💡 [TTSEngine] ההקראה בוטלה');
          break;
        default:
          console.error('💡 [TTSEngine] שגיאה לא מוכרת:', event.error);
      }
    };

    // התחל הקראה
    try {
      this.synth.speak(this.utterance);
      console.log('▶️ [TTSEngine] ההקראה התחילה');
    } catch (error) {
      console.error('❌ [TTSEngine] נכשל להתחיל הקראה:', error);
    }
  }

  /**
   * המר base64 ל-Blob
   * @private
   */
  _base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * השהה הקראה
   */
  pause() {
    if (this.currentEngine === 'google' && this.audioElement) {
      this.audioElement.pause();
      console.log('⏸️ [TTSEngine] Google TTS הושהה');
    } else if (this.currentEngine === 'webspeech') {
      if (this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        console.log('⏸️ [TTSEngine] Web Speech API הושהה');
      }
    }
  }

  /**
   * המשך הקראה
   */
  resume() {
    if (this.currentEngine === 'google' && this.audioElement) {
      this.audioElement.play();
      console.log('▶️ [TTSEngine] Google TTS ממשיך');
    } else if (this.currentEngine === 'webspeech') {
      if (this.synth.paused) {
        this.synth.resume();
        console.log('▶️ [TTSEngine] Web Speech API ממשיך');
      }
    }
  }

  /**
   * עצור הקראה
   */
  stop() {
    // עצור Google TTS
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      if (this.currentAudioBlob) {
        URL.revokeObjectURL(this.currentAudioBlob);
        this.currentAudioBlob = null;
      }
    }

    // עצור Web Speech API
    this.synth.cancel();

    // נקה callbacks
    this.onEndCallback = null;
    this.onProgressCallback = null;

    if (this.currentEngine) {
      console.log(`⏹️ [TTSEngine] עצר ${this.currentEngine === 'google' ? 'Google TTS' : 'Web Speech API'}`);
    }

    this.currentEngine = null;
  }

  /**
   * בדוק אם מקריא כרגע
   */
  isSpeaking() {
    if (this.currentEngine === 'google' && this.audioElement) {
      return !this.audioElement.paused;
    }
    return this.synth.speaking;
  }

  /**
   * בדוק אם מושהה
   */
  isPaused() {
    if (this.currentEngine === 'google' && this.audioElement) {
      return this.audioElement.paused && this.audioElement.currentTime > 0;
    }
    return this.synth.paused;
  }

  /**
   * קבל רשימת קולות זמינים (Web Speech API בלבד)
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * שנה קול (Web Speech API בלבד)
   * @param {SpeechSynthesisVoice} voice
   */
  setVoice(voice) {
    this.voice = voice;
  }

  /**
   * שנה קצב קריאה (Web Speech API בלבד)
   * @param {number} rate - 0.1 עד 10 (1 = רגיל)
   */
  setRate(rate) {
    if (this.utterance) {
      this.utterance.rate = rate;
    }
  }

  /**
   * קבל מידע על המנוע הנוכחי בשימוש
   */
  getCurrentEngine() {
    return this.currentEngine;
  }

  /**
   * הפעל/כבה שימוש ב-Google TTS
   */
  setPreferGoogleTTS(prefer) {
    this.preferGoogleTTS = prefer;
    console.log(`⚙️ [TTSEngine] Google TTS ${prefer ? 'מופעל' : 'מושבת'}`);
  }
}
