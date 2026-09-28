/**
 * Read text aloud using the Web Speech API.
 * @param {string} text
 * @param {'en'|'ar'} language
 */
export function speakText(text, language = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "ar" ? "ar-SA" : "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
