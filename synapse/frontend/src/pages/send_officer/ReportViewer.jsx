import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function ReportViewer() {
  const { id } = useParams();
  const { lang } = useLang();
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let revoked = null;
    let cancelled = false;

    api
      .get(`/api/reports/${id}`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const u = URL.createObjectURL(res.data);
        revoked = u;
        setUrl(u);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          toast.error(lang === "ar" ? "لا يوجد تقرير بعد — أكمل التقييم أولاً" : "Report not available — complete assessment first");
        }
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id, lang]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        to="/send-officer/reports-hub"
        className="inline-block rounded-xl border border-[#e0e8e4] px-4 py-2 text-sm font-bold text-[#3a4a40]"
      >
        {lang === "ar" ? "رجوع إلى التقارير" : "Back to reports"}
      </Link>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-[#e0e8e4] bg-white shadow-sm">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center text-[#7a8a80]">
            <p className="font-bold text-[#1e2d26]">{lang === "ar" ? "التقرير غير متاح" : "Report not available"}</p>
            <p className="text-sm">
              {lang === "ar"
                ? "اضغط «إرسال التقرير» في لوحة التقييم أولاً."
                : "Use Submit report in the assessment console first."}
            </p>
          </div>
        ) : !url ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <iframe title="report" src={url} className="min-h-[70vh] flex-1 w-full rounded-2xl border-0 bg-white" />
        )}
      </div>
    </div>
  );
}
