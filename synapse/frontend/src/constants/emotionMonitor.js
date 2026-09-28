/** Auto mood check while AAC session is open (student webcam). */
export const EMOTION_MONITOR_INTERVAL_MS = 2.5 * 60 * 1000; // 2.5 minutes
/** Delay before the first automatic check so the camera can settle. */
export const EMOTION_MONITOR_FIRST_DELAY_MS = 20 * 1000;

export const CAUTIOUS_EMOTIONS = new Set(["sad", "angry", "fear", "disgust", "distress", "scared", "frustrated"]);

export const MIN_ALERT_CONFIDENCE = 0.55;

const ALIASES = {
  distress: "sad",
  scared: "fear",
  afraid: "fear",
  frustrated: "angry",
  upset: "sad",
};

export function normalizeEmotionLabel(label) {
  const key = String(label || "neutral").toLowerCase().trim();
  return ALIASES[key] || key;
}

export function isCautiousEmotion(label, confidence = 0) {
  const normalized = normalizeEmotionLabel(label);
  return CAUTIOUS_EMOTIONS.has(normalized) && confidence >= MIN_ALERT_CONFIDENCE;
}
