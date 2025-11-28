import { useState, useEffect } from 'react';

/**
 * FloatingTTSBar - בר הקראה צף בתחתית המסך
 * מופיע רק בעמודי יחידות לימוד
 */
export default function FloatingTTSBar({ ttsEngine, text, onEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [paragraphs, setParagraphs] = useState([]);
  const [rate, setRate] = useState(0.9); // מהירות ברירת מחדל
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  // פיצול טקסט לפסקאות
  useEffect(() => {
    if (text) {
      // פיצול לפי פסקאות - מפריד על בסיס שורות ריקות או נקודות עם שורה חדשה
      const splitParagraphs = text
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      setParagraphs(splitParagraphs);
      setCurrentParagraphIndex(0);
    }
  }, [text]);

  // ניקוי - עצור הקראה כשהקומפוננטה נהרסת
  useEffect(() => {
    return () => {
      if (ttsEngine) {
        ttsEngine.stop();
      }
    };
  }, [ttsEngine]);

  // עדכון מהירות במנוע
  useEffect(() => {
    if (ttsEngine && ttsEngine.utterance) {
      ttsEngine.setRate(rate);
    }
  }, [rate, ttsEngine]);

  const getCurrentText = () => {
    if (paragraphs.length === 0) return text;
    return paragraphs[currentParagraphIndex] || '';
  };

  const handlePlay = () => {
    if (!ttsEngine || !text) return;

    if (isPaused) {
      // המשך הקראה
      ttsEngine.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // התחל הקראה חדשה של הפסקה הנוכחית
      const currentText = getCurrentText();

      ttsEngine.speak(
        currentText,
        () => {
          // הקראת פסקה הסתיימה
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);

          // עבור אוטומטית לפסקה הבאה אם קיימת
          if (currentParagraphIndex < paragraphs.length - 1) {
            setTimeout(() => {
              setCurrentParagraphIndex(prev => prev + 1);
              setProgress(0);
              // התחל להקריא את הפסקה הבאה
              handlePlay();
            }, 500);
          } else {
            // סיימנו את כל הטקסט
            if (onEnd) onEnd();
          }
        },
        (charIndex, totalLength) => {
          // עדכון התקדמות
          const progressPercent = (charIndex / totalLength) * 100;
          setProgress(progressPercent);
        }
      );

      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);
    }
  };

  const handlePause = () => {
    if (!ttsEngine) return;
    ttsEngine.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!ttsEngine) return;
    ttsEngine.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const goToPreviousParagraph = () => {
    if (currentParagraphIndex > 0) {
      handleStop();
      setCurrentParagraphIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const goToNextParagraph = () => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      handleStop();
      setCurrentParagraphIndex(prev => prev + 1);
      setProgress(0);
    }
  };

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 0.9, label: 'רגיל' },
    { value: 1.0, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2x' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* רקע עם blur */}
      <div className="bg-white/95 backdrop-blur-sm border-t-2 border-btk-gold shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          {/* פס התקדמות */}
          {(isPlaying || isPaused || progress > 0) && (
            <div className="mb-3">
              <div className="w-full bg-btk-light-gray rounded-full h-1.5">
                <div
                  className="bg-btk-gold h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {/* כפתורי ניווט - צד ימין */}
            <div className="flex items-center gap-2">
              {/* כפתור פסקה קודמת */}
              <button
                onClick={goToPreviousParagraph}
                disabled={currentParagraphIndex === 0 || isPlaying}
                className="w-11 h-11 flex items-center justify-center bg-btk-light-gray hover:bg-gray-300 text-btk-dark-gray rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="פסקה קודמת"
                title="פסקה קודמת"
              >
                <span className="text-xl">⏮️</span>
              </button>

              {/* כפתור פסקה הבאה */}
              <button
                onClick={goToNextParagraph}
                disabled={currentParagraphIndex >= paragraphs.length - 1 || isPlaying}
                className="w-11 h-11 flex items-center justify-center bg-btk-light-gray hover:bg-gray-300 text-btk-dark-gray rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="פסקה הבאה"
                title="פסקה הבאה"
              >
                <span className="text-xl">⏭️</span>
              </button>
            </div>

            {/* כפתור הפעלה/עצירה מרכזי וגדול */}
            <div className="flex-1 flex justify-center">
              {!isPlaying && !isPaused && (
                <button
                  onClick={handlePlay}
                  className="w-14 h-14 bg-btk-gold hover:bg-btk-bronze text-btk-navy rounded-full font-semibold transition flex items-center justify-center shadow-lg"
                  aria-label="הפעל הקראה"
                >
                  <span className="text-2xl">▶️</span>
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={handlePause}
                  className="w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-semibold transition flex items-center justify-center shadow-lg"
                  aria-label="השהה הקראה"
                >
                  <span className="text-2xl">⏸️</span>
                </button>
              )}

              {isPaused && (
                <button
                  onClick={handlePlay}
                  className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition flex items-center justify-center shadow-lg"
                  aria-label="המשך הקראה"
                >
                  <span className="text-2xl">▶️</span>
                </button>
              )}
            </div>

            {/* פקדים נוספים - צד שמאל */}
            <div className="flex items-center gap-2">
              {/* כפתור עצירה */}
              {(isPlaying || isPaused) && (
                <button
                  onClick={handleStop}
                  className="w-11 h-11 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-sm"
                  aria-label="עצור הקראה"
                  title="עצור"
                >
                  <span className="text-xl">⏹️</span>
                </button>
              )}

              {/* כפתור בקרת מהירות */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedControl(!showSpeedControl)}
                  className="w-11 h-11 flex items-center justify-center bg-btk-light-gray hover:bg-gray-300 text-btk-dark-gray rounded-lg transition shadow-sm text-sm font-medium"
                  aria-label="שנה מהירות"
                  title="שנה מהירות"
                >
                  {rate === 0.9 ? '⚡' : `${rate}x`}
                </button>

                {/* תפריט מהירות */}
                {showSpeedControl && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-btk-light-gray rounded-lg shadow-xl overflow-hidden">
                    {speedOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRate(option.value);
                          setShowSpeedControl(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-right hover:bg-btk-light-gray transition ${
                          rate === option.value ? 'bg-btk-gold text-btk-navy font-semibold' : 'text-btk-dark-gray'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* מידע על מיקום */}
          {paragraphs.length > 1 && (
            <div className="text-xs text-btk-dark-gray text-center mt-2">
              פסקה {currentParagraphIndex + 1} מתוך {paragraphs.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
