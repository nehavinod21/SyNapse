import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

const moodEmoji = (volatility) => {
  if (volatility == null || Number.isNaN(volatility)) return "😐";
  if (volatility < 0.35) return "😊";
  if (volatility < 0.55) return "🙂";
  if (volatility < 0.75) return "😐";
  return "😟";
};

export default function ProgressView() {
  const { lang, t } = useLang();
  const location = useLocation();
  const childId = location.state?.childId;
  const [chartRows, setChartRows] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [words, setWords] = useState([]);
  const [teacherNote, setTeacherNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: sessions } = await api.get(`/api/sessions/child/${childId}`);
        const recent = sessions.slice(0, 8);
        const rows = [];
        const days = [];
        for (let i = 0; i < recent.length; i++) {
          const s = recent[i];
          try {
            const ins = await api.get(`/api/sessions/${s.id}/insights`);
            if (!cancelled) {
              rows.push({
                name: s.topic?.slice(0, 8) || s.id.slice(0, 6),
                volatility: ins.data.emotion_volatility,
                selections: ins.data.total_card_selections,
              });
              days.push({
                label: t(`weekday.short.${i % 7}`),
                emoji: moodEmoji(ins.data.emotion_volatility),
              });
              if (i === 0) {
                const dominant = ins.data.dominant_emotion || "neutral";
                setTeacherNote(
                  lang === "ar"
                    ? `تظهر الجلسات الأخيرة المزاج السائد: ${dominant}. اختيارات البطاقات: ${ins.data.total_card_selections}.`
                    : `Recent sessions show a dominant mood of ${dominant}. Card taps this session: ${ins.data.total_card_selections}.`
                );
                const top = ins.data.top_cards || [];
                setWords(top.map((x) => ({ label: x.label || x.name || "—", count: x.count || 0 })));
              }
            }
          } catch {
            if (!cancelled) rows.push({ name: s.id.slice(0, 6), volatility: 0, selections: 0 });
          }
        }
        if (!cancelled) {
          setChartRows(rows);
          setWeekly(days.length ? days : []);
        }
      } catch {
        if (!cancelled) toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId, lang, t]);

  const speakWeekly = useMemo(
    () => weekly.map((d) => `${d.label} ${d.emoji}`).join(", "),
    [weekly]
  );

  if (!childId) {
    return (
      <p className={`text-[#7a8a80] ${lang === "ar" ? "text-right" : ""}`}>
        {t("cg.progressPickChild")}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <div className={`flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <h1 className="text-2xl font-extrabold text-[#1e2d26]">{t("nav.progress")}</h1>
        <SpeakButton text={`${t("cg.weeklyMood")}: ${speakWeekly}. ${teacherNote || t("cg.noNotes")}`} />
      </div>

      <section className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#7a8a80]">{t("cg.weeklyMood")}</h2>
        <div className={`mt-4 flex flex-wrap gap-3 ${lang === "ar" ? "justify-end" : ""}`}>
          {(weekly.length ? weekly : Array.from({ length: 7 }, (_, i) => ({ label: t(`weekday.short.${i}`), emoji: "·" }))).map(
            (d, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl bg-[#f7f3ee] px-3 py-2">
                <span className="text-[10px] font-bold text-[#7a8a80]">{d.label}</span>
                <span className="text-xl">{d.emoji}</span>
              </div>
            )
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
        <div className={`mb-2 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <h2 className="text-sm font-extrabold text-[#7a8a80]">{t("cg.mostUsed")}</h2>
          <SpeakButton text={words.map((w) => `${w.label} ${w.count}`).join(", ") || t("cg.noNotes")} />
        </div>
        <ul className="mt-2 space-y-2 text-sm">
          {words.length === 0 ? (
            <li className="text-[#7a8a80]">{t("common.none")}</li>
          ) : (
            words.map((w, i) => (
              <li key={i} className={`flex justify-between gap-2 rounded-lg bg-[#f7f3ee] px-3 py-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <span className="font-semibold">{w.label}</span>
                <span className="text-[#7a8a80]">{w.count}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#7a8a80]">{t("cg.teacherNotes")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#3a4a40]">{teacherNote || t("cg.noNotes")}</p>
      </section>

      <div dir="ltr" className="h-72 rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
        <ResponsiveContainer>
          <BarChart data={chartRows}>
            <XAxis dataKey="name" stroke="#7a8a80" />
            <YAxis stroke="#7a8a80" />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e0e8e4" }} />
            <Bar dataKey="selections" fill="#4a7a5a" name={lang === "ar" ? "اختيارات" : "Selections"} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
