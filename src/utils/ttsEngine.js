/**
 * TTSEngine - Google Cloud Text-to-Speech Wrapper
 * מנוע הקראה אוטומטית באמצעות Google Cloud Text-to-Speech API
 */
export class TTSEngine {
  constructor() {
    this.audio = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.isPausedState = false;
    this.currentText = null;
    this.onEndCallback = null;
    this.onProgressCallback = null;
    this.progressInterval = null;
  }

  /**
   * אתחול המנוע
   * @param {string} lang - שפה (he-IL / en-US)
   */
  async init(lang = 'he-IL') {
    this.isInitialized = true;
    return Promise.resolve({ lang });
  }

  /**
   * הקרא טקסט
   * @param {string} text - הטקסט להקראה
   * @param {function} onEnd - callback כשההקראה נגמרת
   * @param {function} onProgress - callback לעדכון התקדמות
   */
  async speak(text, onEnd = null, onProgress = null) {
    if (!this.isInitialized) {
      console.warn('TTS Engine לא אותחל');
      return;
    }

    // עצור הקראה קודמת
    this.stop();

    this.currentText = text;
    this.onEndCallback = onEnd;
    this.onProgressCallback = onProgress;

    try {
      // שלח בקשה ל-API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.audio) {
        throw new Error('שגיאה בקבלת אודיו מהשרת');
      }

      // המר base64 ל-Blob
      const audioBlob = this.base64ToBlob(data.audio, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      // צור אלמנט אודיו חדש
      this.audio = new Audio(audioUrl);
      this.isPlaying = true;
      this.isPausedState = false;

      // אירוע סיום
      this.audio.onended = () => {
        this.isPlaying = false;
        this.isPausedState = false;
        this.stopProgressTracking();
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        URL.revokeObjectURL(audioUrl);
      };

      // אירוע שגיאה
      this.audio.onerror = (error) => {
        console.error('TTS Audio Error:', error);
        this.isPlaying = false;
        this.isPausedState = false;
        this.stopProgressTracking();
      };

      // התחל הקראה
      await this.audio.play();

      // התחל מעקב התקדמות
      if (onProgress) {
        this.startProgressTracking();
      }
    } catch (error) {
      console.error('TTS Error:', error);
      this.isPlaying = false;
      this.isPausedState = false;
    }
  }

  /**
   * המר base64 ל-Blob
   */
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * התחל מעקב התקדמות
   */
  startProgressTracking() {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.audio && this.onProgressCallback) {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        if (duration > 0) {
          const progress = (currentTime / duration) * 100;
          // המר ל-charIndex לתאימות עם ממשק הקיים
          const charIndex = Math.floor((currentTime / duration) * (this.currentText?.length || 0));
          this.onProgressCallback(charIndex, this.currentText?.length || 0);
        }
      }
    }, 100);
  }

  /**
   * עצור מעקב התקדמות
   */
  stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * השהה הקראה
   */
  pause() {
    if (this.audio && this.isPlaying && !this.isPausedState) {
      this.audio.pause();
      this.isPausedState = true;
      this.isPlaying = false;
    }
  }

  /**
   * המשך הקראה
   */
  resume() {
    if (this.audio && this.isPausedState) {
      this.audio.play();
      this.isPausedState = false;
      this.isPlaying = true;
    }
  }

  /**
   * עצור הקראה
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.isPlaying = false;
    this.isPausedState = false;
    this.stopProgressTracking();
  }

  /**
   * בדוק אם מקריא כרגע
   */
  isSpeaking() {
    return this.isPlaying;
  }

  /**
   * בדוק אם מושהה
   */
  isPaused() {
    return this.isPausedState;
  }

  /**
   * קבל רשימת קולות זמינים (תאימות לממשק הקודם)
   */
  getVoices() {
    return [];
  }

  /**
   * שנה קול (תאימות לממשק הקודם)
   * @param {object} voice
   */
  setVoice(voice) {
    // לא רלוונטי ל-Google Cloud TTS
  }

  /**
   * שנה קצב קריאה (תאימות לממשק הקודם)
   * @param {number} rate - 0.1 עד 10 (1 = רגיל)
   */
  setRate(rate) {
    // לא רלוונטי ל-Google Cloud TTS (קצב מוגדר ב-API)
  }
}
