import { useLang } from "../hooks/useLang.js";
import { speakText } from "../utils/speech.js";

export default function SpeakButton({ text, className = "" }) {
  const { lang, t } = useLang();

  if (!text) return null;

  return (
    <button
      type="button"
      onClick={() => speakText(text, lang)}
      className={`inline-flex items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-100 ${className}`}
      aria-label={t("a11y.readAloud")}
    >
      <span className="sr-only">{t("a11y.readAloud")}</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9v6h4l5 5V4L8 9H4z" />
        <path d="M16 8a5 5 0 0 1 0 8" />
        <path d="M19 5a9 9 0 0 1 0 14" />
      </svg>
    </button>
  );
}
