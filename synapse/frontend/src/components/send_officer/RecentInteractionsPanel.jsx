import { useLang } from "../../hooks/useLang.js";

const TYPE_LABELS = {
  en: {
    card_selection: "Card",
    emotion_detected: "Mood",
    session_start: "Session",
  },
  ar: {
    card_selection: "بطاقة",
    emotion_detected: "مزاج",
    session_start: "جلسة",
  },
};

export default function RecentInteractionsPanel({ items = [], lastUpdated }) {
  const { lang } = useLang();
  const labels = TYPE_LABELS[lang === "ar" ? "ar" : "en"];

  return (
    <section className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
      <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <div>
          <h2 className="text-lg font-extrabold text-[#1e2d26]">
            {lang === "ar" ? "التفاعلات الأخيرة" : "Recent interactions"}
          </h2>
          <p className="text-xs font-medium text-[#7a8a80]">
            {lang === "ar" ? "يتم التحديث تلقائياً كل 12 ثانية" : "Auto-refreshes every 12 seconds"}
          </p>
        </div>
        {lastUpdated && (
          <span className="rounded-full bg-[#e8f4ec] px-3 py-1 text-xs font-bold text-[#2c3e35]">
            {lang === "ar" ? "آخر تحديث" : "Updated"}{" "}
            {lastUpdated.toLocaleTimeString(lang === "ar" ? "ar-AE" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {!items.length ? (
        <p className="text-sm text-[#7a8a80]">{lang === "ar" ? "لا توجد تفاعلات بعد" : "No interactions yet"}</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#f0f2f0] bg-[#fafcf9] px-3 py-2.5 ${lang === "ar" ? "flex-row-reverse text-right" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#1e2d26]">{item.child_name}</p>
                <p className="text-xs font-medium text-[#3a4a40]">
                  {lang === "ar" ? item.summary_ar : item.summary_en}
                </p>
              </div>
              <div className={`shrink-0 text-end ${lang === "ar" ? "text-start" : ""}`}>
                <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#4a7a5a]">
                  {labels[item.interaction_type] || item.interaction_type}
                </span>
                <p className="mt-1 text-[10px] font-semibold text-[#7a8a80]">
                  {new Date(item.timestamp).toLocaleString(lang === "ar" ? "ar-AE" : "en-GB", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
