import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [activeByChild, setActiveByChild] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get("/api/children");
        if (cancelled) return;
        setChildren(data);

        const map = {};
        await Promise.all(
          data.map(async (c) => {
            try {
              const { data: sessions } = await api.get(`/api/sessions/child/${c.id}`);
              const active = (sessions || []).find((s) => s.is_active);
              if (active) map[c.id] = active.id;
            } catch {
              /* ignore */
            }
          })
        );
        if (!cancelled) setActiveByChild(map);
      } catch {
        if (!cancelled) toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [lang]);

  const primary = children[0];

  const weekLine = primary ? t("cg.childWeek").replace("{child}", primary.name) : t("cg.weekSummary");
  const greetingSpeak = `${t("cg.greeting")}, ${user?.full_name || ""}. ${weekLine}`;

  const lastSessionLabel = useMemo(() => {
    if (!primary?.last_session_at) return t("common.none");
    return new Date(primary.last_session_at).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB");
  }, [primary, lang, t]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-3xl space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <section className="rounded-2xl border border-[#e0e8e4] bg-white p-6 shadow-sm">
        <div className={`flex flex-wrap items-start justify-between gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e2d26]">
              {t("cg.greeting")}, {user?.full_name || "—"}
            </h1>
            <p className="mt-2 text-sm text-[#7a8a80]">
              {primary ? weekLine : t("common.none")}
            </p>
          </div>
          <SpeakButton text={greetingSpeak} />
        </div>
      </section>

      {Object.keys(activeByChild).length > 0 ? (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
          <p className="text-sm font-extrabold text-amber-950">
            {lang === "ar" ? "جلسة مباشرة نشطة" : "Live session in progress"}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {children
              .filter((c) => activeByChild[c.id])
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/caregiver/sessions/${activeByChild[c.id]}/live`)}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700"
                >
                  {lang === "ar" ? `انضم — ${c.name}` : `Join live — ${c.name}`}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#7a8a80]">{t("cg.lastSession")}</p>
          <p className="mt-2 text-3xl">{primary ? "😊" : "—"}</p>
          <p className="mt-1 text-sm font-semibold text-[#5a6a60]">{lastSessionLabel}</p>
        </div>
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#7a8a80]">{t("cg.practiceToday")}</p>
          <button
            type="button"
            disabled={!primary}
            onClick={() => navigate("/caregiver/session", { state: { childId: primary.id } })}
            className="mt-3 w-full rounded-xl bg-[#4a7a5a] py-2.5 text-sm font-bold text-white disabled:bg-[#ccc]"
          >
            {t("cg.startHome")}
          </button>
        </div>
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#7a8a80]">{t("cg.weeklyMood")}</p>
          <div className={`mt-3 flex justify-between gap-1 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="flex flex-col items-center text-[10px] font-bold text-[#7a8a80]">
                <span className="mb-1">{t(`weekday.short.${i}`)}</span>
                <span className="text-lg opacity-80">{primary ? ["🙂", "😐", "😊", "🙂", "😌", "😊", "🙂"][i] : "·"}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-[#1e2d26]">{t("cg.myChildren")}</h2>
        {children.map((c) => (
          <div key={c.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
            <div className={`flex flex-wrap items-center justify-between gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f4ec] text-xl font-bold text-[#2c3e35]">
                  {c.name.slice(0, 1)}
                </div>
                <div className={lang === "ar" ? "text-right" : ""}>
                  <p className="text-lg font-bold text-[#1e2d26]">{c.name}</p>
                  <p className="text-xs text-[#7a8a80]">{c.diagnosis}</p>
                  {activeByChild[c.id] ? (
                    <p className="mt-1 text-xs font-bold text-amber-700">
                      {lang === "ar" ? "جلسة مباشرة الآن" : "Live now"}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className={`flex flex-wrap gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <SpeakButton text={`${c.name}. ${c.diagnosis}`} />
                {activeByChild[c.id] ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/caregiver/sessions/${activeByChild[c.id]}/live`)}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white"
                  >
                    {lang === "ar" ? "انضم مباشرة" : "Join live"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/caregiver/session", { state: { childId: c.id } })}
                  className="rounded-xl bg-[#4a7a5a] px-4 py-2 text-sm font-bold text-white"
                >
                  {t("cg.startHome")}
                </button>
                <Link
                  to="/caregiver/progress"
                  state={{ childId: c.id }}
                  className="rounded-xl border border-[#e0e8e4] px-4 py-2 text-sm font-bold text-[#3a4a40]"
                >
                  {t("cg.viewProgress")}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link to="/caregiver/privacy" className="inline-block text-sm font-bold text-[#7a8a80] hover:text-[#4a7a5a]">
        {t("cg.privacy")}
      </Link>
    </div>
  );
}
