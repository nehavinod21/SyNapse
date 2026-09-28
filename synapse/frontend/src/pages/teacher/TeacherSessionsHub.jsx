import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function TeacherSessionsHub() {
  const { lang, t } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: children } = await api.get("/api/children");
        const lists = await Promise.all(
          children.map(async (c) => {
            try {
              const { data } = await api.get(`/api/sessions/child/${c.id}`);
              return data.map((s) => ({ ...s, childName: c.name, childId: c.id }));
            } catch {
              return [];
            }
          })
        );
        const flat = lists.flat().sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        if (!cancelled) setRows(flat.slice(0, 40));
      } catch {
        if (!cancelled) toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const poll = setInterval(() => {
      api.get("/api/children").then(async ({ data: children }) => {
        const lists = await Promise.all(
          children.map(async (c) => {
            try {
              const { data } = await api.get(`/api/sessions/child/${c.id}`);
              return data.map((s) => ({ ...s, childName: c.name, childId: c.id }));
            } catch {
              return [];
            }
          })
        );
        const flat = lists.flat().sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        if (!cancelled) setRows(flat.slice(0, 40));
      }).catch(() => {});
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [lang]);

  const label = useMemo(() => t("nav.sessions"), [t]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-4 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <h1 className="text-2xl font-extrabold text-[#1e2d26]">{label}</h1>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-[#7a8a80]">{lang === "ar" ? "لا توجد جلسات" : "No sessions yet."}</p>
        ) : (
          rows.map((s) => (
            <div key={s.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
              <div className={`flex flex-wrap items-center justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <div>
                  <p className="font-bold text-[#1e2d26]">{s.childName}</p>
                  <p className="text-xs text-[#7a8a80]">
                    {s.topic} · {new Date(s.started_at).toLocaleString(lang === "ar" ? "ar-AE" : "en-GB")}
                  </p>
                </div>
                <div className={`flex gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                  {s.is_active ? (
                    <Link
                      to={`/teacher/sessions/${s.id}/live`}
                      className="rounded-xl bg-[#4a7a5a] px-3 py-2 text-xs font-bold text-white"
                    >
                      {t("teacher.liveSession")}
                    </Link>
                  ) : (
                    <span className="rounded-xl bg-[#f7f3ee] px-3 py-2 text-xs font-bold text-[#7a8a80]">
                      {lang === "ar" ? "منتهية" : "Ended"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
