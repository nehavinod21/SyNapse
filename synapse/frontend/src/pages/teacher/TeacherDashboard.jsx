import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLang } from "../../hooks/useLang.js";
import { useTeacherDashboard } from "../../hooks/useTeacherDashboard.js";
import api from "../../api/axios.js";

const CHART_COLORS = ["#4a7a5a", "#81c784", "#ffa726", "#ef5350", "#9575cd", "#90caf9"];

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "greet.morning";
  if (h < 17) return "greet.afternoon";
  return "greet.evening";
}

function statusPillClass(status) {
  if (status === "ready") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "needs_support") return "bg-amber-100 text-amber-900 border-amber-200";
  if (status === "needs_immediate_support") return "bg-red-100 text-red-900 border-red-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
}

function translateTeacherStatus(status, t) {
  if (status === "ready") return t("status.ready");
  if (status === "needs_support") return t("status.support");
  if (status === "needs_immediate_support") return t("status.immediate");
  return status;
}

function formatLastSession(dateStr, lang, t) {
  if (!dateStr) return t("common.none");
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return lang === "ar" ? "اليوم" : "Today";
  if (d.toDateString() === yesterday.toDateString()) return lang === "ar" ? "أمس" : "Yesterday";
  return d.toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "short" });
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const { summary, loading, error } = useTeacherDashboard();

  const alertsCount = useMemo(
    () => summary?.students.filter((s) => s.status !== "ready").length ?? 0,
    [summary]
  );

  const greet = greetingKey();
  const greetingSpeak = summary
    ? `${t(greet)}, ${user?.full_name || ""}. ${t("teacher.titleClass")}: ${summary.classroom_name || ""}.`
    : "";

  const handleStartSession = async (child) => {
    try {
      // Prefer joining an already-active student session (e.g. student AAC in another window).
      if (child.active_session_id) {
        navigate(`/teacher/sessions/${child.active_session_id}/live`);
        return;
      }
      const { data: sessions } = await api.get(`/api/sessions/child/${child.id}`);
      const active = (sessions || []).find((s) => s.is_active);
      if (active?.id) {
        navigate(`/teacher/sessions/${active.id}/live`);
        return;
      }
      const response = await api.post("/api/sessions/start", {
        child_id: child.id,
        session_type: "classroom",
        topic: "communication",
      });
      navigate(`/teacher/sessions/${response.data.id}/live`);
    } catch {
      toast.error(lang === "ar" ? "تعذر بدء الجلسة" : "Failed to start session");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        {t("teacher.loadFail")}
      </div>
    );
  }

  const engagementData = summary.engagement_this_week?.length ? summary.engagement_this_week : [];
  const emotionData = summary.emotion_mix_class?.length ? summary.emotion_mix_class : [];

  return (
    <div className={`mx-auto flex max-w-6xl flex-col gap-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <section className="rounded-2xl border border-[#e0e8e4] bg-white p-6 shadow-sm">
        <div className={`flex flex-wrap items-start justify-between gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e2d26] md:text-3xl">
              {t(greet)}, {user?.full_name || "—"}
            </h1>
            <p className="mt-2 text-sm font-medium text-[#7a8a80]">
              {t("teacher.titleClass")}: {summary.classroom_name || "—"}
            </p>
          </div>
          <SpeakButton text={greetingSpeak} className="shrink-0" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("teacher.childrenToday"), value: summary.students_total },
          { label: t("teacher.sessionsBooked"), value: summary.sessions_this_week },
          { label: t("teacher.alerts"), value: alertsCount },
          { label: t("teacher.reportsWeek"), value: summary.reports_this_week ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#7a8a80]">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-[#2c3e35]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-extrabold text-[#1e2d26]">{t("teacher.todaysChildren")}</h2>
          <div className="flex flex-col gap-3">
            {summary.students.length === 0 ? (
              <p className="text-sm text-[#7a8a80]">{t("teacher.noStudents")}</p>
            ) : (
              summary.students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className={`flex flex-col gap-4 md:flex-row md:items-start md:justify-between ${lang === "ar" ? "md:flex-row-reverse" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className={`flex flex-wrap items-center gap-2 ${lang === "ar" ? "flex-row-reverse justify-end" : ""}`}>
                        <h3 className="text-lg font-bold text-[#1e2d26]">
                          {student.name}, {student.age} {lang === "ar" ? "سنوات" : "years"}
                        </h3>
                        <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusPillClass(student.status)}`}>
                          {translateTeacherStatus(student.status, t)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#5a6a60]">
                        {t("teacher.lastSession")}: {formatLastSession(student.last_session_at, lang, t)}
                        {student.last_session_turns != null
                          ? ` · ${student.last_session_turns} ${t("teacher.turns")}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-[#7a8a80]">
                        {t("teacher.baseline")}: μ {student.baseline_mean}, σ {student.baseline_std} · Signal {(student.signal_score * 100).toFixed(0)}%
                      </p>
                      {student.recommendation ? (
                        <p className="mt-2 text-sm font-medium text-[#4a7a5a]">{student.recommendation}</p>
                      ) : null}
                      <div className={`mt-3 flex items-center gap-2 ${lang === "ar" ? "flex-row-reverse justify-end" : ""}`}>
                        <SpeakButton
                          text={`${student.name}. ${translateTeacherStatus(student.status, t)}. ${t("teacher.lastSession")} ${formatLastSession(student.last_session_at, lang, t)}.`}
                        />
                      </div>
                    </div>
                    <div className={`flex shrink-0 flex-col gap-2 md:w-44 ${lang === "ar" ? "items-end" : "items-stretch"}`}>
                      {student.active_session_id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/sessions/${student.active_session_id}/live`)}
                          className="rounded-xl bg-[#c45c26] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#a34a1c]"
                        >
                          {lang === "ar" ? "انضم للجلسة المباشرة" : "Join live session"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleStartSession(student)}
                        className="rounded-xl bg-[#4a7a5a] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#2c3e35]"
                      >
                        {student.active_session_id
                          ? lang === "ar"
                            ? "فتح المباشرة"
                            : "Open live"
                          : t("teacher.startSession")}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/students/${student.id}`)}
                        className="rounded-xl border border-[#e0e8e4] bg-white px-4 py-2.5 text-sm font-bold text-[#3a4a40] hover:bg-[#f7f3ee]"
                      >
                        {t("teacher.viewProfile")}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/child/${student.id}`)}
                        className="rounded-xl border border-[#e0e8e4] bg-white px-4 py-2.5 text-sm font-bold text-[#3a4a40] hover:bg-[#f7f3ee]"
                      >
                        {t("teacher.viewReport")}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
            <div className={`mb-2 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <h3 className="text-sm font-extrabold text-[#1e2d26]">{t("teacher.chartEngagement")}</h3>
              <SpeakButton text={`${t("teacher.chartEngagement")}: ${engagementData.map((d) => `${d.day} ${d.value}`).join(", ")}`} />
            </div>
            <div dir="ltr" className="h-56 w-full">
              <ResponsiveContainer>
                <LineChart data={engagementData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4a7a5a" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
            <div className={`mb-2 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <h3 className="text-sm font-extrabold text-[#1e2d26]">{t("teacher.chartEmotion")}</h3>
              <SpeakButton text={`${t("teacher.chartEmotion")}: ${emotionData.map((e) => `${e.emotion} ${e.percentage}%`).join(", ")}`} />
            </div>
            <div dir="ltr" className="h-56 w-full">
              {emotionData.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-[#7a8a80]">{t("common.none")}</p>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={emotionData} dataKey="percentage" nameKey="emotion" cx="50%" cy="50%" outerRadius={70} label>
                      {emotionData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
