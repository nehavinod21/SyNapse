const map = {
  happy: { cls: "bg-amber-500 text-white border-amber-700 shadow-sm", emoji: "😊" },
  sad: { cls: "bg-blue-600 text-white border-blue-800 shadow-sm", emoji: "😢" },
  angry: { cls: "bg-red-600 text-white border-red-800 shadow-sm", emoji: "😠" },
  fear: { cls: "bg-violet-600 text-white border-violet-800 shadow-sm", emoji: "😨" },
  disgust: { cls: "bg-lime-700 text-white border-lime-900 shadow-sm", emoji: "🤢" },
  surprise: { cls: "bg-indigo-600 text-white border-indigo-800 shadow-sm", emoji: "😲" },
  neutral: { cls: "bg-slate-600 text-white border-slate-800 shadow-sm", emoji: "😐" },
};

export default function EmotionBadge({ label, confidence, analyzing = false }) {
  const key = label?.toLowerCase?.() || "neutral";
  const entry = map[key] || map.neutral;
  const displayLabel = label ? label.charAt(0).toUpperCase() + label.slice(1) : "Neutral";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-bold ${entry.cls}`}
      role="status"
      aria-live="polite"
      aria-busy={analyzing}
      aria-label={
        analyzing
          ? "Analyzing mood"
          : `${displayLabel}${confidence != null ? ` ${(confidence * 100).toFixed(0)} percent` : ""}`
      }
    >
      {analyzing ? (
        <span className="text-xs font-semibold opacity-90">Analyzing…</span>
      ) : (
        <>
          <span aria-hidden>{entry.emoji}</span>
          <span className="capitalize">{displayLabel}</span>
          {confidence != null && (
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-semibold tabular-nums">
              {(confidence * 100).toFixed(0)}%
            </span>
          )}
        </>
      )}
    </span>
  );
}
