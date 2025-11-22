import { useState, useEffect } from 'react';

/**
 * AudioPlayer - נגן אודיו עם בקרות
 */
export default function AudioPlayer({ ttsEngine, text, onEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      // ניקוי - עצור הקראה כשהקומפוננטה נהרסת
      if (ttsEngine) {
        ttsEngine.stop();
      }
    };
  }, [ttsEngine]);

  const handlePlay = () => {
    if (!ttsEngine || !text) return;

    if (isPaused) {
      // המשך הקראה
      ttsEngine.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // התחל הקראה חדשה
      ttsEngine.speak(
        text,
        () => {
          // הקראה הסתיימה
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          if (onEnd) onEnd();
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

  return (
    <div className="bg-white border-t border-btk-light-gray p-4">
      <div className="flex flex-col gap-3">
        {/* כותרת */}
        <div className="flex items-center gap-2 text-btk-dark-gray">
          <span className="text-xl">🔊</span>
          <span className="font-medium">הקראת היחידה</span>
        </div>

        {/* בקרות */}
        <div className="flex items-center gap-3">
          {!isPlaying && !isPaused && (
            <button
              onClick={handlePlay}
              className="bg-btk-gold hover:bg-btk-bronze text-btk-navy px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-sm"
              aria-label="הפעל הקראה"
            >
              <span className="text-xl">▶️</span>
              <span>הפעל</span>
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handlePause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-sm"
              aria-label="השהה הקראה"
            >
              <span className="text-xl">⏸️</span>
              <span>השהה</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={handlePlay}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-sm"
              aria-label="המשך הקראה"
            >
              <span className="text-xl">▶️</span>
              <span>המשך</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-sm"
              aria-label="עצור הקראה"
            >
              <span className="text-xl">⏹️</span>
              <span>עצור</span>
            </button>
          )}
        </div>

        {/* פס התקדמות */}
        {(isPlaying || isPaused || progress > 0) && (
          <div className="w-full">
            <div className="w-full bg-btk-light-gray rounded-full h-2">
              <div
                className="bg-btk-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-btk-dark-gray mt-1 text-center">
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
