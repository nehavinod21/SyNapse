import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import { useTeacherDashboard } from "../../hooks/useTeacherDashboard.js";
import api from "../../api/axios.js";

function statusPillClass(status) {
  if (status === "ready") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "needs_support") return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-red-100 text-red-900 border-red-200";
}

export default function TeacherChildren() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { summary, loading, error } = useTeacherDashboard();

  const handleStartSession = async (child) => {
    try {
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
    return <p className="text-red-700">{t("teacher.loadFail")}</p>;
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-4 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <h1 className="text-2xl font-extrabold text-[#1e2d26]">{t("nav.children")}</h1>
      <div className="flex flex-col gap-3">
        {summary.students.map((student) => (
          <div key={student.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
            <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${lang === "ar" ? "md:flex-row-reverse" : ""}`}>
              <div>
                <div className={`flex flex-wrap items-center gap-2 ${lang === "ar" ? "flex-row-reverse justify-end" : ""}`}>
                  <span className="text-lg font-bold text-[#1e2d26]">{student.name}</span>
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusPillClass(student.status)}`}>
                    {student.status_label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#7a8a80]">
                  {student.age} {lang === "ar" ? "سنوات" : "years old"}
                </p>
                <div className={`mt-2 ${lang === "ar" ? "flex justify-end" : ""}`}>
                  <SpeakButton text={`${student.name}, ${student.status_label}`} />
                </div>
              </div>
              <div className={`flex flex-col gap-2 sm:flex-row ${lang === "ar" ? "sm:flex-row-reverse" : ""}`}>
                <button
                  type="button"
                  onClick={() => handleStartSession(student)}
                  className="rounded-xl bg-[#4a7a5a] px-4 py-2 text-sm font-bold text-white"
                >
                  {t("teacher.startSession")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/students/${student.id}`)}
                  className="rounded-xl border border-[#e0e8e4] px-4 py-2 text-sm font-bold text-[#3a4a40]"
                >
                  {t("teacher.viewProfile")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
