import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import EmotionBadge from "../../components/EmotionBadge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLang } from "../../hooks/useLang.js";
import { useTeacherLiveSession } from "../../hooks/useTeacherLiveSession.js";
import api from "../../api/axios.js";

function signalWord(signal, lang) {
  if (signal < 0.35) return lang === "ar" ? "هادئ" : "Calm";
  if (signal < 0.65) return lang === "ar" ? "مرتفع" : "Elevated";
  return lang === "ar" ? "عالٍ" : "High";
}

function signalColor(signal) {
  if (signal < 0.35) return "bg-emerald-500";
  if (signal < 0.65) return "bg-amber-500";
  return "bg-red-500";
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TeacherLiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const isCaregiver = user?.role === "caregiver" || location.pathname.includes("/caregiver/");
  const homePath = isCaregiver ? "/caregiver/dashboard" : "/teacher/dashboard";

  const {
    liveSession,
    loading,
    error,
    wsConnected,
    actionLoading,
    pauseSession,
    nextTurn,
    endSession,
    useGuidance,
    dismissGuidance,
    sendMessage,
  } = useTeacherLiveSession(sessionId);

  const [messageText, setMessageText] = useState("");
  const [tick, setTick] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!liveSession) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [liveSession?.session_id]);

  const displaySeconds = (liveSession?.duration_seconds ?? 0) + tick;
  const timerLabel = formatTime(displaySeconds);
  const transcript = useMemo(() => (liveSession?.transcript || []).slice(-30), [liveSession?.transcript]);

  const handleEnd = async () => {
    await endSession();
    toast.success(lang === "ar" ? "انتهت الجلسة" : "Session ended");
    navigate(homePath);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    await sendMessage(messageText);
    setMessageText("");
    toast.success(lang === "ar" ? "تم الإرسال" : "Sent");
  };

  const downloadPdf = async () => {
    if (!sessionId) return;
    setPdfBusy(true);
    try {
      const { data } = await api.post(
        `/api/reports/session/${sessionId}/generate-pdf?language=${lang === "ar" ? "ar" : "en"}`,
        null,
        { responseType: "blob", timeout: 120000 }
      );
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synapse-session-${sessionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(lang === "ar" ? "تم تنزيل التقرير" : "Report downloaded");
    } catch {
      toast.error(lang === "ar" ? "تعذر إنشاء التقرير" : "Could not generate report");
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading && !liveSession) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className="text-sm font-medium text-[#7a8a80]">
          {lang === "ar" ? "جاري الاتصال بالجلسة المباشرة…" : "Connecting to live session…"}
        </p>
      </div>
    );
  }

  if (error || !liveSession) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <p className="font-bold">{lang === "ar" ? "تعذر تحميل الجلسة" : "Could not load live session"}</p>
        <p className="mt-2 text-sm">
          {lang === "ar"
            ? "تأكد أن الطالب بدأ جلسة، ثم اضغط «انضم مباشرة» من لوحة التحكم."
            : "Make sure the student started a session, then click Join live on the dashboard."}
        </p>
        <button
          type="button"
          onClick={() => navigate(homePath)}
          className="mt-4 rounded-xl bg-[#4a7a5a] px-4 py-2 text-sm font-bold text-white"
        >
          {lang === "ar" ? "العودة" : "Back to dashboard"}
        </button>
      </div>
    );
  }

  const sig = liveSession.signal_intensity ?? 0;
  const word = signalWord(sig, lang);
  const liveOk = liveSession.is_active !== false;

  return (
    <div className={`mx-auto flex max-w-5xl flex-col gap-4 pb-28 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
          liveOk ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        {liveOk
          ? lang === "ar"
            ? `مباشر — ${liveSession.child_name} · الموضوع: ${liveSession.topic || "—"} · ${wsConnected ? "متصل" : "تحديث كل ٣ ثوانٍ"}`
            : `LIVE — ${liveSession.child_name} · Topic: ${liveSession.topic || "—"} · ${wsConnected ? "WebSocket connected" : "Auto-refresh every 3s"}`
          : lang === "ar"
            ? "انتهت هذه الجلسة — يمكنك تنزيل التقرير."
            : "This session has ended — you can still download a report."}
      </div>

      <header className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
        <div className={`flex flex-wrap items-center justify-between gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <div className="min-w-0">
            <button type="button" onClick={() => navigate(homePath)} className="text-xs font-bold text-[#4a7a5a] hover:underline">
              ← {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
            </button>
            <div className={`mt-1 flex flex-wrap items-center gap-2 ${lang === "ar" ? "flex-row-reverse justify-end" : ""}`}>
              <h1 className="truncate text-xl font-extrabold text-[#1e2d26]">{liveSession.child_name}</h1>
              <SpeakButton text={`${liveSession.child_name}. Live session. ${timerLabel}.`} />
            </div>
            <p className="mt-1 text-xs text-[#7a8a80]">
              {timerLabel} · {liveSession.session_type || "classroom"} · cards {liveSession.turn_index}/{liveSession.turn_target}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy}
            className="rounded-xl bg-[#1e2d26] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {pdfBusy ? (lang === "ar" ? "جاري…" : "Generating…") : lang === "ar" ? "تنزيل PDF" : "Download PDF report"}
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase text-[#7a8a80]">
            {lang === "ar" ? "المشاعر الحالية" : "Current mood"}
          </h2>
          <div className="mt-3">
            <EmotionBadge
              label={liveSession.latest_emotion || "neutral"}
              confidence={liveSession.latest_confidence || 0}
            />
          </div>
          <p className="mt-3 text-xs text-[#7a8a80]">
            {lang === "ar"
              ? "تحديث تلقائي كل ٢–٣ دقائق، أو عند ضغط «تحديث المشاعر»"
              : "Auto every 2–3 min, or when student taps Update mood"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase text-[#7a8a80]">{t("teacher.signal")}</h2>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#eef2ef]">
            <div className={`h-full rounded-full transition-all ${signalColor(sig)}`} style={{ width: `${Math.min(100, sig * 100)}%` }} />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-[#2c3e35]">{word}</p>
          <p className="text-sm font-semibold text-[#4a7a5a]">
            {lang === "ar" ? "الانخراط" : "Engagement"}: {liveSession.engagement_score?.toFixed?.(1) ?? liveSession.engagement_score}/10
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase text-[#7a8a80]">
            {lang === "ar" ? "آخر البطاقات" : "Recent AAC cards"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(liveSession.recent_cards || []).length === 0 ? (
              <p className="text-sm text-[#7a8a80]">
                {lang === "ar" ? "لم يختر الطالب بطاقة بعد" : "No cards tapped yet"}
              </p>
            ) : (
              liveSession.recent_cards.map((label, i) => (
                <span key={`${label}-${i}`} className="rounded-full bg-[#e8f4ec] px-3 py-1 text-xs font-bold text-[#2c3e35]">
                  {label}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#7a8a80]">
              {lang === "ar" ? "سجل النشاط المباشر" : "Live activity feed"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {transcript.map((entry, idx) => {
                const isSys = entry.speaker === "system";
                return (
                  <div
                    key={idx}
                    className={`rounded-xl px-3 py-2 text-sm ${isSys ? "bg-[#e8f4ec] text-[#2c3e35]" : "bg-[#f5f7fb] text-[#3a4a40]"}`}
                  >
                    <div className="text-[10px] font-bold uppercase text-[#7a8a80]">{entry.speaker}</div>
                    <div>{entry.message}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isCaregiver ? (
            <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
              <label className="text-xs font-extrabold text-[#1e2d26]">{lang === "ar" ? "ردك" : "Your reply"}</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t("teacher.replyPlaceholder")}
                rows={3}
                className="mt-2 w-full rounded-xl border border-[#e0e8e4] bg-[#fafaf8] px-3 py-2 text-sm outline-none focus:border-[#4a7a5a]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={actionLoading || !messageText.trim()}
                className="mt-3 w-full rounded-xl bg-[#4a7a5a] py-2.5 text-sm font-bold text-white disabled:bg-[#ccc]"
              >
                {t("teacher.send")}
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-extrabold text-[#1e2d26]">{t("teacher.guidance")}</h3>
          <div className="flex flex-col gap-3">
            {(liveSession.guidance_suggestions || []).slice(0, 3).map((s) => (
              <div key={s.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-[#7a8a80]">{s.type}</p>
                <p className="mt-2 text-sm font-semibold text-[#1e2d26]">{s.text}</p>
                {!isCaregiver ? (
                  <div className={`mt-3 flex gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                    <button
                      type="button"
                      onClick={async () => {
                        await useGuidance(s.id);
                        setMessageText(s.example || s.text);
                        toast.success(lang === "ar" ? "تم" : "OK");
                      }}
                      className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {t("teacher.useThis")}
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissGuidance(s.id)}
                      className="rounded-lg border border-[#e0e8e4] px-3 py-1.5 text-xs font-bold text-[#5a6a60]"
                    >
                      {t("teacher.dismiss")}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer
        className={`fixed bottom-0 left-0 right-0 z-20 flex flex-wrap gap-2 border-t border-[#e8ece9] bg-white/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none ${lang === "ar" ? "flex-row-reverse justify-end" : ""}`}
      >
        {!isCaregiver ? (
          <>
            <button
              type="button"
              onClick={() => {
                pauseSession();
                toast.success(lang === "ar" ? "تم الإيقاف المؤقت" : "Paused");
              }}
              disabled={actionLoading}
              className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 disabled:opacity-50"
            >
              {t("teacher.pause")}
            </button>
            <button
              type="button"
              onClick={() => nextTurn()}
              disabled={actionLoading}
              className="rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("teacher.nextTurn")}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={handleEnd}
          disabled={actionLoading}
          className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {t("teacher.end")}
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdfBusy}
          className="rounded-xl border border-[#1e2d26] bg-white px-4 py-3 text-sm font-bold text-[#1e2d26] disabled:opacity-50"
        >
          PDF
        </button>
      </footer>
    </div>
  );
}
