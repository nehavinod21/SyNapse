export const EMOTION_FRAME_WIDTH = 320;
export const EMOTION_FRAME_HEIGHT = 240;
export const EMOTION_JPEG_QUALITY = 0.72;

export function captureEmotionFrame(webcamRef) {
  const cam = webcamRef?.current;
  if (!cam) return null;
  return cam.getScreenshot({
    width: EMOTION_FRAME_WIDTH,
    height: EMOTION_FRAME_HEIGHT,
    screenshotFormat: "image/jpeg",
    screenshotQuality: EMOTION_JPEG_QUALITY,
  });
}

export async function emotionFrameToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function buildEmotionFormData(sessionId, webcamRef) {
  const shot = captureEmotionFrame(webcamRef);
  if (!shot) return null;
  const blob = await emotionFrameToBlob(shot);
  const fd = new FormData();
  fd.append("session_id", sessionId);
  fd.append("file", blob, "frame.jpg");
  return fd;
}
