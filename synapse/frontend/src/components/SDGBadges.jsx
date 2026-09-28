const items = [
  { n: 3, en: "Good health & wellbeing", ar: "الصحة والرفاهية" },
  { n: 4, en: "Quality education", ar: "التعليم الجيد" },
  { n: 10, en: "Reduced inequalities", ar: "تقليل أوجه عدم المساواة" },
];

export default function SDGBadges({ lang = "en" }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {items.map((s) => (
        <span
          key={s.n}
          className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-3 py-1 text-[11px] text-slate-300"
        >
          <span className="font-bold text-teal-400">SDG {s.n}</span>
          {lang === "ar" ? s.ar : s.en}
        </span>
      ))}
    </div>
  );
}
