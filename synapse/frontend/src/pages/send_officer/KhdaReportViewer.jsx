import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

function isPdfBlob(blob) {
  if (!blob || blob.size < 500) return false;
  const t = String(blob.type || "");
  if (t.includes("pdf")) return true;
  return blob.slice(0, 4).text().then((h) => h.startsWith("%PDF")).catch(() => false);
}

export default function KhdaReportViewer() {
  const { childId } = useParams();
  const [searchParams] = useSearchParams();
  const { lang } = useLang();
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  const [childName, setChildName] = useState("");

  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";

  useEffect(() => {
    if (!childId || !startDate || !endDate) return undefined;
    let revoked = null;
    let cancelled = false;

    (async () => {
      try {
        setError("");
        setUrl(null);

        const childRes = await api.get(`/api/children/${childId}`);
        if (!cancelled) setChildName(childRes.data.name || "");

        await api.post(
          `/api/reports/child/${childId}/khda-send/generate`,
          { start_date: startDate, end_date: endDate },
          { timeout: 180000 }
        );

        const res = await api.get(
          `/api/reports/child/${childId}/khda-send/view?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&refresh=1&_=${Date.now()}`,
          { responseType: "blob", timeout: 180000 }
        );

        const pdfOk = await isPdfBlob(res.data);
        if (!pdfOk) {
          throw new Error("invalid pdf");
        }

        if (cancelled) return;
        const u = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        revoked = u;
        setUrl(u);
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status;
          setError(
            status === 403
              ? lang === "ar"
                ? "غير مصرح"
                : "Not authorized"
              : lang === "ar"
                ? "تعذر إنشاء التقرير — تحقق من الخادم"
                : "Could not generate report — check backend is running"
          );
          toast.error(lang === "ar" ? "تعذر تحميل التقرير" : "Could not load report");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [childId, startDate, endDate, lang]);

  if (!startDate || !endDate) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-900">
        {lang === "ar" ? "يرجى تحديد فترة التقرير من مركز التقارير." : "Please select a report period from the reports hub."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <div className={lang === "ar" ? "text-right" : "text-left"}>
          <h1 className="text-xl font-extrabold text-[#1e2d26]">
            {lang === "ar" ? "تقرير KHDA SEND" : "KHDA SEND Report"}
          </h1>
          <p className="text-sm text-[#7a8a80]">
            {childName || "—"} · {startDate} → {endDate}
          </p>
          <p className="mt-1 text-xs text-[#7a8a80]">
            {lang === "ar"
              ? "التقرير بالإنجليزية ثم العربية — عرض داخل المتصفح"
              : "English section first, then Arabic — in-browser viewer"}
          </p>
        </div>
        <Link
          to="/send-officer/reports-hub"
          className="rounded-xl border border-[#e0e8e4] px-4 py-2 text-sm font-bold text-[#3a4a40]"
        >
          {lang === "ar" ? "رجوع" : "Back"}
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-10rem)] flex-col rounded-2xl border border-[#e0e8e4] bg-white shadow-sm">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-red-700">
            <p className="font-bold">{lang === "ar" ? "التقرير غير متاح" : "Report unavailable"}</p>
            <p className="text-sm text-[#7a8a80]">{error}</p>
          </div>
        ) : !url ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12">
            <LoadingSpinner />
            <p className="text-sm font-semibold text-[#7a8a80]">
              {lang === "ar" ? "جاري إنشاء التقرير…" : "Generating report…"}
            </p>
            <p className="max-w-sm text-center text-xs text-[#7a8a80]">
              {lang === "ar"
                ? "قد يستغرق دقيقة واحدة (ذكاء اصطناعي محلي)"
                : "May take up to a minute (local AI narrative)"}
            </p>
          </div>
        ) : (
          <iframe title="KHDA SEND report" src={url} className="min-h-[75vh] w-full flex-1 rounded-2xl border-0 bg-white" />
        )}
      </div>
    </div>
  );
}
