import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function ChildHistory() {
  const { child_id } = useParams();
  const { lang } = useLang();
  const [child, setChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/api/children/${child_id}`), api.get(`/api/sessions/child/${child_id}`)])
      .then(([c, s]) => {
        setChild(c.data);
        setSessions(s.data);
      })
      .catch(() => toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [child_id, lang]);

  const downloadPdf = async (sessionId) => {
    setBusyId(sessionId);
    try {
      const { data } = await api.post(
        `/api/reports/session/${sessionId}/generate-pdf?language=${lang === "ar" ? "ar" : "en"}`,
        null,
        { responseType: "blob", timeout: 120000 }
      );
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synapse-${sessionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(lang === "ar" ? "تم تنزيل PDF" : "PDF downloaded");
    } catch {
      toast.error(lang === "ar" ? "تعذر إنشاء التقرير" : "Could not generate PDF");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`mx-auto max-w-3xl space-y-4 pb-8 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <Link to="/teacher/dashboard" className="text-sm font-bold text-[#4a7a5a] hover:underline">
        ← {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
      </Link>
      <h1 className="text-2xl font-extrabold text-[#1e2d26]">
        {lang === "ar" ? "سجل الطفل" : "Child history"}
      </h1>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#1e2d26]">{child?.name}</h2>
            <p className="mt-1 text-sm text-[#7a8a80]">
              {child?.diagnosis} · {child?.communication_level}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-[#7a8a80]">
                {lang === "ar" ? "لا توجد جلسات مسجلة بعد" : "No sessions recorded yet."}
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm ${lang === "ar" ? "flex-row-reverse" : ""}`}
                >
                  <div>
                    <p className="font-extrabold text-[#1e2d26]">{s.topic}</p>
                    <p className="text-xs text-[#7a8a80]">
                      {s.session_type} · {format(new Date(s.started_at), "PPp")}
                      {s.is_active ? " · LIVE" : ""}
                    </p>
                  </div>
                  <div className={`flex gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                    <Link
                      to={`/teacher/sessions/${s.id}/live`}
                      className="rounded-xl bg-[#4a7a5a] px-3 py-2 text-xs font-bold text-white"
                    >
                      {s.is_active ? (lang === "ar" ? "مباشر" : "Live") : lang === "ar" ? "عرض" : "View"}
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => downloadPdf(s.id)}
                      className="rounded-xl bg-[#1e2d26] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {busyId === s.id ? "…" : "PDF"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
