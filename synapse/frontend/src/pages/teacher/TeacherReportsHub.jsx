import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function TeacherReportsHub() {
  const { lang, t } = useLang();
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loadingKids, setLoadingKids] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [busy, setBusy] = useState(false);

  const selectedChild = children.find((c) => c.id === childId);
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: kids } = await api.get("/api/children");
        if (cancelled) return;
        setChildren(kids || []);
        if (kids?.length) setChildId(kids[0].id);
      } catch {
        toast.error(lang === "ar" ? "تعذر تحميل الطلاب" : "Could not load students");
      } finally {
        if (!cancelled) setLoadingKids(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (!childId) {
      setSessions([]);
      setSelectedSessionId("");
      return undefined;
    }
    let cancelled = false;
    setLoadingSessions(true);
    setSelectedSessionId("");
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPdfBlob(null);

    (async () => {
      try {
        const { data } = await api.get(`/api/sessions/child/${childId}`);
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setSessions(list);
        if (list.length) setSelectedSessionId(list[0].id);
      } catch {
        if (!cancelled) {
          setSessions([]);
          toast.error(lang === "ar" ? "تعذر تحميل الجلسات" : "Could not load sessions");
        }
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [childId, lang]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const generatePdfBlob = useCallback(async (sessionId) => {
    const { data } = await api.post(
      `/api/reports/session/${sessionId}/generate-pdf?language=both`,
      null,
      { responseType: "blob", timeout: 120000 }
    );
    return new Blob([data], { type: "application/pdf" });
  }, []);

  const viewPdf = async () => {
    if (!selectedSessionId) return;
    setBusy(true);
    try {
      const blob = await generatePdfBlob(selectedSessionId);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setPdfBlob(blob);
      toast.success(lang === "ar" ? "التقرير جاهز للعرض" : "Report ready to view");
    } catch {
      toast.error(lang === "ar" ? "تعذر إنشاء التقرير" : "Could not generate PDF");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!selectedSessionId) return;
    setBusy(true);
    try {
      let blob = pdfBlob;
      if (!blob) {
        blob = await generatePdfBlob(selectedSessionId);
        setPdfBlob(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }
      const name = (selectedChild?.name || "student").replace(/\s+/g, "_");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `SyNAPSE_${name}_${selectedSessionId.slice(0, 8)}.pdf`;
      a.click();
      toast.success(lang === "ar" ? "تم التنزيل" : "Downloaded");
    } catch {
      toast.error(lang === "ar" ? "تعذر التنزيل" : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  if (loadingKids) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-4 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <div>
        <h1 className="text-2xl font-extrabold text-[#1e2d26]">{t("nav.reports")}</h1>
        <p className="mt-1 text-sm text-[#7a8a80]">
          {lang === "ar"
            ? "اختر الطالب → اختر الجلسة → عرض PDF في الصفحة → تنزيل."
            : "Choose student → choose session → view PDF here → download."}
        </p>
      </div>

      {children.length === 0 ? (
        <p className="text-sm text-[#7a8a80]">{lang === "ar" ? "لا يوجد أطفال" : "No children assigned."}</p>
      ) : (
        <>
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#7a8a80]">
                {lang === "ar" ? "اسم الطالب" : "Student name"}
              </span>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-xl border border-[#d5e4da] bg-[#f7f3ee] px-3 py-2.5 text-sm font-bold text-[#1e2d26] outline-none focus:border-[#4a7a5a]"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.diagnosis ? ` — ${c.diagnosis}` : ""}
                  </option>
                ))}
              </select>
            </label>

            {selectedChild ? (
              <p className="text-xs text-[#7a8a80]">
                {lang === "ar" ? "التشخيص" : "Diagnosis"}: {selectedChild.diagnosis || "—"} ·{" "}
                <Link to={`/teacher/child/${selectedChild.id}`} className="font-bold text-[#4a7a5a] hover:underline">
                  {lang === "ar" ? "السجل الكامل" : "Full history"}
                </Link>
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#7a8a80]">
                {lang === "ar" ? "تقرير الجلسة" : "Session report"}
              </span>
              {loadingSessions ? (
                <div className="py-4">
                  <LoadingSpinner />
                </div>
              ) : sessions.length === 0 ? (
                <p className="rounded-xl bg-[#f7f3ee] px-3 py-3 text-sm text-[#7a8a80]">
                  {lang === "ar"
                    ? "لا توجد جلسات لهذا الطالب بعد."
                    : "No sessions for this student yet — run an AAC session first."}
                </p>
              ) : (
                <select
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setPdfUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                    setPdfBlob(null);
                  }}
                  className="w-full rounded-xl border border-[#d5e4da] bg-[#f7f3ee] px-3 py-2.5 text-sm font-bold text-[#1e2d26] outline-none focus:border-[#4a7a5a]"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.topic || "session") +
                        " · " +
                        (s.session_type || "") +
                        (s.is_active ? " (LIVE)" : "") +
                        " · " +
                        new Date(s.started_at).toLocaleString(lang === "ar" ? "ar-AE" : "en-GB")}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <div className={`flex flex-wrap gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <button
                type="button"
                disabled={!selectedSessionId || busy}
                onClick={viewPdf}
                className="rounded-xl bg-[#4a7a5a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy
                  ? lang === "ar"
                    ? "جاري الإنشاء…"
                    : "Generating…"
                  : lang === "ar"
                    ? "عرض PDF"
                    : "View PDF"}
              </button>
              <button
                type="button"
                disabled={!selectedSessionId || busy}
                onClick={downloadPdf}
                className="rounded-xl bg-[#1e2d26] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {lang === "ar" ? "تنزيل" : "Download"}
              </button>
              {selectedSession?.is_active ? (
                <Link
                  to={`/teacher/sessions/${selectedSession.id}/live`}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white"
                >
                  {lang === "ar" ? "فتح المباشر" : "Open live"}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e0e8e4] bg-white shadow-sm">
            <div className="border-b border-[#e0e8e4] bg-[#f7f3ee] px-4 py-2 text-xs font-bold text-[#5a6a60]">
              {lang === "ar" ? "معاينة التقرير" : "PDF preview"}
              {selectedChild ? ` — ${selectedChild.name}` : ""}
            </div>
            {pdfUrl ? (
              <iframe title="Session report PDF" src={pdfUrl} className="h-[70vh] w-full bg-[#525659]" />
            ) : (
              <div className="flex h-[40vh] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[#7a8a80]">
                <p>
                  {lang === "ar"
                    ? "اختر طالباً وجلسة، ثم اضغط «عرض PDF»."
                    : "Select a student and session, then click “View PDF”."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
