import { useNavigate, useParams } from "react-router-dom";
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
  BarChart,
  Bar,
} from "recharts";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import { useTeacherStudentProfile } from "../../hooks/useTeacherStudentProfile.js";
import api from "../../api/axios.js";

const COLORS = ["#4a7a5a", "#81c784", "#ffa726", "#ef5350", "#9575cd"];

function translateStatus(status, t) {
  if (status === "ready") return t("status.ready");
  if (status === "needs_support") return t("status.support");
  if (status === "needs_immediate_support") return t("status.immediate");
  return status;
}

export default function TeacherStudentProfile() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { profile, loading, error } = useTeacherStudentProfile(childId);

  const handleStartSession = async () => {
    if (!profile) return;
    try {
      const response = await api.post("/api/sessions/start", {
        child_id: profile.id,
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

  if (error || !profile) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-800">
        {t("profile.loadFail")}
      </div>
    );
  }

  const speakIntro = `${profile.name}, ${profile.age} ${lang === "ar" ? "سنوات" : "years old"}. ${t("profile.grade")} ${profile.grade}. ${t("profile.diagnosis")}: ${profile.communication_level}.`;

  return (
    <div className={`mx-auto max-w-6xl space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <div className={`flex flex-wrap items-start justify-between gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <div>
          <button
            type="button"
            onClick={() => navigate("/teacher/dashboard")}
            className="mb-2 text-sm font-bold text-[#4a7a5a] hover:underline"
          >
            ← {t("nav.home")}
          </button>
          <h1 className="text-2xl font-extrabold text-[#1e2d26] md:text-3xl">
            {profile.name}, {profile.age} {lang === "ar" ? "سنوات" : "years old"}
          </h1>
          <p className="text-sm text-[#7a8a80]">
            {profile.student_identifier} · {profile.grade}
          </p>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <SpeakButton text={speakIntro} />
          <button
            type="button"
            onClick={handleStartSession}
            className="rounded-xl bg-[#4a7a5a] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#2c3e35]"
          >
            {t("teacher.startSession")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#7a8a80]">{t("profile.basic")}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.age")}</dt>
              <dd className="font-bold">{profile.age}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.grade")}</dt>
              <dd className="font-bold">{profile.grade}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.diagnosis")}</dt>
              <dd className="font-bold leading-snug">{profile.communication_level}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <div className={`mb-2 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#7a8a80]">{t("profile.status")}</h2>
            <SpeakButton
              text={`${profile.name} ${translateStatus(profile.status, t)}. ${t("profile.signal")} ${(profile.signal_score * 100).toFixed(0)}%.`}
            />
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.status")}</dt>
              <dd className="font-bold text-[#4a7a5a]">{translateStatus(profile.status, t)}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.signal")}</dt>
              <dd className="font-bold">{(profile.signal_score * 100).toFixed(0)}%</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.lastSession")}</dt>
              <dd className="font-bold">{profile.last_session_label}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("teacher.turnCounter")}</dt>
              <dd className="font-bold">{profile.turns}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#7a8a80]">{t("profile.baseline")}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">μ</dt>
              <dd className="font-bold">{profile.baseline_mean}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">σ</dt>
              <dd className="font-bold">{profile.baseline_std}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.engagementAvg")}</dt>
              <dd className="font-bold">{profile.engagement_avg}</dd>
            </div>
            <div className={`flex justify-between gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <dt className="text-[#7a8a80]">{t("profile.sessions")}</dt>
              <dd className="font-bold">{profile.total_sessions}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-[#1e2d26]">{t("profile.analytics")}</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
            <div dir="ltr" className="h-56">
              {profile.engagement_trend?.length ? (
                <ResponsiveContainer>
                  <LineChart data={profile.engagement_trend}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#4a7a5a" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-[#7a8a80]">{t("common.none")}</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
            <div dir="ltr" className="h-56">
              {profile.emotion_distribution?.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={profile.emotion_distribution} dataKey="percentage" nameKey="emotion" cx="50%" cy="50%" outerRadius={70} label>
                      {profile.emotion_distribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-[#7a8a80]">{t("common.none")}</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
            <div dir="ltr" className="h-56">
              {profile.most_used_cards?.length ? (
                <ResponsiveContainer>
                  <BarChart data={profile.most_used_cards} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4a7a5a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-[#7a8a80]">{t("common.none")}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-[#1e2d26]">{t("profile.achievements")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(() => {
            const raw = profile.achievements || [];
            const padded = [...raw];
            while (padded.length < 4) padded.push(null);
            return padded.slice(0, 4).map((badge, idx) =>
              badge ? (
                <div key={`${badge.title}-${idx}`} className="rounded-2xl border border-[#e0e8e4] bg-white p-4 text-center shadow-sm">
                  <div className="text-2xl">🏆</div>
                  <p className="mt-2 font-bold text-[#1e2d26]">{badge.title}</p>
                  <p className="mt-1 text-xs text-[#7a8a80]">{badge.description}</p>
                </div>
              ) : (
                <div key={`empty-${idx}`} className="rounded-2xl border border-dashed border-[#e0e8e4] bg-[#fafaf8] p-4 text-center text-xs text-[#b0c0b8]">
                  {lang === "ar" ? "قريباً" : "More soon"}
                </div>
              )
            );
          })()}
        </div>
      </section>
    </div>
  );
}
