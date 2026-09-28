import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api, { getWsBase } from "../../api/axios.js";

export default function AssessmentConsole() {
  const { id } = useParams();
  const { lang, t } = useLang();
  const [assessment, setAssessment] = useState(null);
  const [childName, setChildName] = useState("");
  const [phase, setPhase] = useState(1);
  const [notes, setNotes] = useState("");
  const [acc, setAcc] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [live, setLive] = useState(null);
  const [tab, setTab] = useState("overview");
  const [ratComm, setRatComm] = useState(3);
  const [ratBeh, setRatBeh] = useState(3);
  const [ratEmo, setRatEmo] = useState(3);
  const [txtComm, setTxtComm] = useState("");
  const [txtBeh, setTxtBeh] = useState("");
  const [txtEmo, setTxtEmo] = useState("");
  const [txtRec, setTxtRec] = useState("");

  useEffect(() => {
    api
      .get(`/api/assessments/${id}`)
      .then((r) => setAssessment(r.data))
      .catch(() => toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id, lang]);

  useEffect(() => {
    if (!assessment?.child_id) return;
    api.get(`/api/children/${assessment.child_id}`).then((r) => setChildName(r.data.name)).catch(() => {});
  }, [assessment?.child_id]);

  useEffect(() => {
    if (!assessment?.child_id) return;
    api
      .post("/api/sessions/start", {
        child_id: assessment.child_id,
        session_type: "assessment",
        topic: "SEND phases",
      })
      .then((r) => setSessionId(r.data.id))
      .catch(() => {});
  }, [assessment?.child_id]);

  useEffect(() => {
    if (!sessionId) return;
    const ws = new WebSocket(`${getWsBase()}/ws/session/${sessionId}`);
    ws.onmessage = (e) => {
      try {
        setLive(JSON.parse(e.data));
      } catch {
        setLive({ raw: e.data });
      }
    };
    return () => ws.close();
  }, [sessionId]);

  const savePhase = async () => {
    try {
      const combinedNotes = [
        notes,
        `${t("assess.section.comm")}: ${txtComm}`,
        `${t("assess.section.behaviour")}: ${txtBeh}`,
        `${t("assess.section.emotion")}: ${txtEmo}`,
        `${t("assess.section.rec")}: ${txtRec}`,
        `ratings:${ratComm},${ratBeh},${ratEmo}`,
      ].join("\n");
      const { data } = await api.put(`/api/assessments/${id}/phase`, {
        phase,
        notes: combinedNotes,
        accommodations: acc.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setAssessment(data);
      toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
    } catch {
      toast.error(lang === "ar" ? "فشل الحفظ" : "Save failed");
    }
  };

  const complete = async () => {
    try {
      const { data } = await api.post(`/api/assessments/${id}/complete`);
      toast.success(data.report_url || "OK");
    } catch (e) {
      toast.error(e.response?.data?.detail || (lang === "ar" ? "فشل الإكمال" : "Complete failed"));
    }
  };

  if (loading || !assessment) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: t("assess.tabs.overview") },
    { id: "assess", label: t("assess.tabs.assessments") },
    { id: "reports", label: t("assess.tabs.reports") },
  ];

  const headerSpeak = `${childName || "Child"}. ${t("assess.tabs.assessments")}. ${assessment.status}.`;

  return (
    <div className={`mx-auto max-w-4xl space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <div className={`flex flex-wrap items-start justify-between gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e2d26]">{childName || "—"}</h1>
          <p className="text-sm text-[#7a8a80]">{lang === "ar" ? "الحالة" : "Status"}: {assessment.status}</p>
        </div>
        <div className={`flex flex-wrap gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <SpeakButton text={headerSpeak} />
          <Link
            to={`/send-officer/report/${id}`}
            className="rounded-xl border border-[#e0e8e4] bg-white px-4 py-2 text-sm font-bold text-[#4a7a5a]"
          >
            {t("send.viewReport")}
          </Link>
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 border-b border-[#e8ece9] pb-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === x.id ? "bg-[#e8f4ec] text-[#2c3e35]" : "text-[#7a8a80] hover:bg-[#f7f3ee]"}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="space-y-4 rounded-2xl border border-[#e0e8e4] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">{t("assess.tabs.overview")}</h2>
          <p className="text-sm text-[#5a6a60]">
            {lang === "ar"
              ? "ملخص سريع للطفل وحالة التقييم الحالية."
              : "Quick snapshot of the child and current assessment state."}
          </p>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div className={`flex justify-between rounded-xl bg-[#f7f3ee] px-3 py-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{lang === "ar" ? "الطفل" : "Child"}</dt>
              <dd className="font-bold">{childName}</dd>
            </div>
            <div className={`flex justify-between rounded-xl bg-[#f7f3ee] px-3 py-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{lang === "ar" ? "المرحلة" : "Phase"}</dt>
              <dd className="font-bold">{phase}</dd>
            </div>
          </dl>
          <div className="rounded-xl border border-[#e8ece9] bg-[#fafaf8] p-4">
            <p className="text-xs font-bold text-[#7a8a80]">{lang === "ar" ? "مباشر (جلسة تقييم)" : "Live (assessment session)"}</p>
            <pre className="mt-2 max-h-48 overflow-auto text-[11px] text-[#3a4a40]">{JSON.stringify(live, null, 2)}</pre>
          </div>
        </section>
      )}

      {tab === "assess" && (
        <section className="space-y-4 rounded-2xl border border-[#e0e8e4] bg-white p-6 shadow-sm">
          <label className="block text-xs font-bold text-[#7a8a80]">
            {lang === "ar" ? "المرحلة (1-6)" : "Phase (1-6)"}
            <input
              type="number"
              min={1}
              max={6}
              value={phase}
              onChange={(e) => setPhase(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-[#e0e8e4] bg-[#fafaf8] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-bold text-[#7a8a80]">
            {lang === "ar" ? "ملاحظات عامة" : "General notes"}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#e0e8e4] bg-[#fafaf8] px-3 py-2 text-sm" />
          </label>

          {[
            [t("assess.section.comm"), txtComm, setTxtComm, ratComm, setRatComm],
            [t("assess.section.behaviour"), txtBeh, setTxtBeh, ratBeh, setRatBeh],
            [t("assess.section.emotion"), txtEmo, setTxtEmo, ratEmo, setRatEmo],
          ].map(([title, val, setVal, r, setR]) => (
            <div key={title} className="rounded-xl border border-[#eef2ef] p-4">
              <p className="text-sm font-extrabold text-[#1e2d26]">{title}</p>
              <label className="mt-2 block text-xs text-[#7a8a80]">
                {t("assess.rating")}
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={r}
                  onChange={(e) => setR(Number(e.target.value))}
                  className="mt-1 w-24 rounded-lg border border-[#e0e8e4] px-2 py-1 text-sm"
                />
              </label>
              <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#e0e8e4] bg-[#fafaf8] px-3 py-2 text-sm" />
            </div>
          ))}

          <div className="rounded-xl border border-[#eef2ef] p-4">
            <p className="text-sm font-extrabold text-[#1e2d26]">{t("assess.section.rec")}</p>
            <textarea value={txtRec} onChange={(e) => setTxtRec(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#e0e8e4] bg-[#fafaf8] px-3 py-2 text-sm" />
          </div>

          <label className="block text-xs font-bold text-[#7a8a80]">
            {lang === "ar" ? "تسهيلات (مفصولة بفواصل)" : "Accommodations (comma-separated)"}
            <input value={acc} onChange={(e) => setAcc(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e0e8e4] bg-[#fafaf8] px-3 py-2 text-sm" />
          </label>

          <div className={`flex flex-wrap gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
            <button type="button" onClick={savePhase} className="rounded-xl bg-[#4a7a5a] px-5 py-2.5 text-sm font-bold text-white">
              {t("assess.saveDraft")}
            </button>
            <button type="button" onClick={complete} className="rounded-xl border border-[#e0e8e4] px-5 py-2.5 text-sm font-bold text-[#3a4a40]">
              {t("assess.submitReport")}
            </button>
          </div>
        </section>
      )}

      {tab === "reports" && (
        <section className="rounded-2xl border border-[#e0e8e4] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#5a6a60]">{lang === "ar" ? "عرض أو تنزيل تقرير PDF لهذا التقييم." : "View or download the PDF report for this assessment."}</p>
          <Link to={`/send-officer/report/${id}`} className="mt-4 inline-block rounded-xl bg-[#4a7a5a] px-5 py-3 text-sm font-bold text-white">
            {t("send.viewReport")}
          </Link>
        </section>
      )}
    </div>
  );
}
