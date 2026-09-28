import SpeakButton from "./SpeakButton.jsx";
import AACIcon from "./AACIcon.jsx";

const BORDER = {
  core: "border-amber-400 bg-amber-50",
  emotion: "border-rose-400 bg-rose-50",
  topic: "border-emerald-400 bg-emerald-50",
};

export default function AACCard({ card, lang, onSelect, disabled }) {
  const primary = lang === "ar" ? card.label_ar || card.label : card.label;
  const secondary = lang === "ar" ? card.label : card.label_ar;
  const borderCls = BORDER[card.category] || "border-slate-300 bg-white";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border-[3px] shadow-sm transition hover:scale-[1.02] active:scale-[0.98] ${borderCls}`}
    >
      <div
        className="absolute end-1.5 top-1.5 z-10"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <SpeakButton
          text={primary}
          className="!min-h-0 rounded-lg bg-white/90 px-2 py-1 text-slate-700 shadow-sm hover:bg-white"
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={() => onSelect(card)}
        className="aac-card-touch flex min-h-[140px] w-full flex-col items-center justify-between gap-1 p-2 pt-8 disabled:opacity-50"
      >
        <div className="flex flex-1 w-full items-center justify-center py-1">
          <AACIcon card={card} size={64} />
        </div>
        <div className="w-full shrink-0 border-t border-black/5 bg-white/70 px-1 py-2 text-center">
          <div className="aac-card-label text-sm font-extrabold leading-tight text-slate-900">
            {primary}
          </div>
          {secondary && secondary !== primary && (
            <div
              className="mt-0.5 text-xs font-semibold leading-tight text-slate-600"
              dir="rtl"
            >
              {secondary}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
