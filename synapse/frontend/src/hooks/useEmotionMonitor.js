import { useCallback, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { isCautiousEmotion } from "../constants/emotionMonitor.js";
import { buildEmotionFormData } from "../utils/emotionCapture.js";

/**
 * Manual emotion detection helper (e.g. chrome extension tick via runCheckNow).
 * No automatic interval — student taps "Update mood" in the session UI.
 */
export function useEmotionMonitor({
  sessionId,
  webcamRef,
  lang = "en",
  onEmotionUpdate,
  onCautiousEmotion,
  onDetectingChange,
}) {
  const busyRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (!sessionId || !webcamRef?.current || busyRef.current) return;
    busyRef.current = true;
    onDetectingChange?.(true);
    try {
      const fd = await buildEmotionFormData(sessionId, webcamRef);
      if (!fd) return;
      const { data } = await api.post("/api/emotion/detect", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000,
      });
      const label = data.emotion || "neutral";
      const confidence = data.confidence ?? 0;
      onEmotionUpdate?.({ label, confidence });

      if (isCautiousEmotion(label, confidence)) {
        onCautiousEmotion?.({ label, confidence });
        toast(
          lang === "ar"
            ? "تم إبلاغ المعلم/ولي الأمر — استخدم البطاقات للتواصل"
            : "Your teacher/caregiver has been alerted — use the cards to communicate",
          { icon: "💛", duration: 5000 }
        );
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } catch {
      /* silent on optional extension-triggered checks */
    } finally {
      busyRef.current = false;
      onDetectingChange?.(false);
    }
  }, [sessionId, webcamRef, lang, onEmotionUpdate, onCautiousEmotion, onDetectingChange]);

  return { runCheckNow: runCheck };
}
