import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function SOReportsHub() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ranges, setRanges] = useState({});
  const defaults = useMemo(() => defaultDateRange(), []);

  useEffect(() => {
    Promise.all([api.get("/api/children"), api.get("/api/assessments")])
      .then(([cRes, aRes]) => {
        setChildren(cRes.data || []);
        setAssessments(aRes.data || []);
        const initial = {};
        for (const child of cRes.data || []) {
          initial[child.id] = { ...defaults };
        }
        setRanges(initial);
      })
      .catch(() => toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [lang, defaults]);

  const openKhdaViewer = (childId) => {
    const range = ranges[childId] || defaults;
    if (!range.start || !range.end) {
      toast.error(lang === "ar" ? "حدد الفترة" : "Select a date range");
      return;
    }
    navigate(`/send-officer/khda-report/${childId}?start_date=${range.start}&end_date=${range.end}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-8 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <div>
        <h1 className="text-2xl font-extrabold text-[#1e2d26]">{t("nav.reports")}</h1>
        <p className="mt-1 text-sm text-[#7a8a80]">
          {lang === "ar"
            ? "تقرير KHDA SEND لكل طالب — إنجليزي ثم عربي — عرض PDF داخل التطبيق"
            : "Per-student KHDA SEND reports — English then Arabic — in-app PDF viewer"}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#7a8a80]">
          {lang === "ar" ? "تقارير KHDA SEND حسب الطالب" : "KHDA SEND reports by student"}
        </h2>
        {children.map((child) => {
          const range = ranges[child.id] || defaults;
          return (
            <div key={child.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
              <p className="text-lg font-bold text-[#1e2d26]">
                {child.name}, {child.age}
              </p>
              <p className="text-xs text-[#7a8a80]">{child.diagnosis}</p>
              <div className={`mt-4 flex flex-wrap items-end gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <label className="text-xs font-bold text-[#7a8a80]">
                  {lang === "ar" ? "من" : "From"}
                  <input
                    type="date"
                    value={range.start}
                    onChange={(e) =>
                      setRanges((prev) => ({
                        ...prev,
                        [child.id]: { ...range, start: e.target.value },
                      }))
                    }
                    className="mt-1 block rounded-xl border border-[#e0e8e4] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-bold text-[#7a8a80]">
                  {lang === "ar" ? "إلى" : "To"}
                  <input
                    type="date"
                    value={range.end}
                    onChange={(e) =>
                      setRanges((prev) => ({
                        ...prev,
                        [child.id]: { ...range, end: e.target.value },
                      }))
                    }
                    className="mt-1 block rounded-xl border border-[#e0e8e4] px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => openKhdaViewer(child.id)}
                  className="rounded-xl bg-[#4a7a5a] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#2c3e35]"
                >
                  {lang === "ar" ? "عرض تقرير KHDA" : "View KHDA SEND report"}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold text-[#7a8a80]">
          {lang === "ar" ? "تقارير التقييم المكتملة" : "Completed assessment reports"}
        </h2>
        {assessments.filter((a) => (a.status || "").toLowerCase().includes("complete")).length === 0 ? (
          <p className="text-sm text-[#7a8a80]">
            {lang === "ar" ? "أكمل التقييم من لوحة التقييم لإنشاء PDF" : "Complete an assessment to generate PDF reports"}
          </p>
        ) : (
          assessments
            .filter((a) => (a.status || "").toLowerCase().includes("complete"))
            .map((a) => (
              <div
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm ${lang === "ar" ? "flex-row-reverse" : ""}`}
              >
                <span className="font-mono text-xs text-[#7a8a80]">{a.id.slice(0, 8)}… · {a.status}</span>
                <Link
                  to={`/send-officer/report/${a.id}`}
                  className="rounded-xl bg-[#e8f4ec] px-4 py-2 text-xs font-bold text-[#2c3e35]"
                >
                  {t("send.viewReport")}
                </Link>
              </div>
            ))
        )}
      </section>
    </div>
  );
}
