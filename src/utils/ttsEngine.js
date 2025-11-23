/**
 * TTSEngine - Web Speech API Wrapper
 * מנוע הקראה אוטומטית באמצעות Web Speech API
 */
export class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.utterance = null;
    this.isInitialized = false;
  }

  /**
   * אתחול המנוע וטעינת קולות
   * @param {string} lang - שפה (he-IL / en-US)
   */
  async init(lang = 'he-IL') {
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
   * הקרא טקסט
   * @param {string} text - הטקסט להקראה
   * @param {function} onEnd - callback כשההקראה נגמרת
   * @param {function} onProgress - callback לעדכון התקדמות
   */
  speak(text, onEnd = null, onProgress = null) {
    if (!this.isInitialized) {
      console.warn('TTS Engine לא אותחל');
      return;
    }

    // עצור הקראה קודמת
    this.stop();

    // צור utterance חדש
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.voice = this.voice;
    this.utterance.lang = this.voice?.lang || 'he-IL';
    this.utterance.rate = 0.9; // קצב קריאה
    this.utterance.pitch = 1.0; // גובה קול
    this.utterance.volume = 1.0; // עוצמה

    // אירועים
    if (onEnd) {
      this.utterance.onend = onEnd;
    }

    if (onProgress) {
      this.utterance.onboundary = (event) => {
        onProgress(event.charIndex, text.length);
      };
    }

    this.utterance.onerror = (event) => {
      console.error('TTS Error:', event.error);
    };

    // התחל הקראה
    this.synth.speak(this.utterance);
  }

  /**
   * השהה הקראה
   */
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * המשך הקראה
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * עצור הקראה
   */
  stop() {
    this.synth.cancel();
  }

  /**
   * בדוק אם מקריא כרגע
   */
  isSpeaking() {
    return this.synth.speaking;
  }

  /**
   * בדוק אם מושהה
   */
  isPaused() {
    return this.synth.paused;
  }

  /**
   * קבל רשימת קולות זמינים
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * שנה קול
   * @param {SpeechSynthesisVoice} voice
   */
  setVoice(voice) {
    this.voice = voice;
  }

  /**
   * שנה קצב קריאה
   * @param {number} rate - 0.1 עד 10 (1 = רגיל)
   */
  setRate(rate) {
    if (this.utterance) {
      this.utterance.rate = rate;
    }
  }
}
