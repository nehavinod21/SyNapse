import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import SpeakButton from "../../components/SpeakButton.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import { useSendDashboard } from "../../hooks/useSendDashboard.js";
import RecentInteractionsPanel from "../../components/send_officer/RecentInteractionsPanel.jsx";
import api from "../../api/axios.js";

const COLORS = ["#4a7a5a", "#81c784", "#ffa726"];

function sendStatusLabel(status, t) {
  if (status === "on_track") return t("send.status.on_track");
  if (status === "monitor") return t("send.status.monitor");
  if (status === "needs_attention") return t("send.status.needs_attention");
  return status;
}

export default function SODashboard() {
  const { lang, t } = useLang();
  const { data, loading, error, lastUpdated } = useSendDashboard();

  const create = async () => {
    try {
      const { data: children } = await api.get("/api/children");
      const first = children[0];
      if (!first) {
        toast.error(lang === "ar" ? "لا يوجد أطفال" : "No children available");
        return;
      }
      const { data: created } = await api.post("/api/assessments", { child_id: first.id });
      toast.success(lang === "ar" ? "تم الإنشاء" : "Created");
      window.location.href = `/send-officer/assessment/${created.id}`;
    } catch {
      toast.error(lang === "ar" ? "فشل الإنشاء" : "Create failed");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-800">
        {t("send.dashboardFail")}
      </div>
    );
  }

  const pieData = Object.entries(data.status_counts || {}).map(([statusKey, count]) => ({
    name: sendStatusLabel(statusKey, t),
    value: count,
  }));

  const welcomeSpeak = `${t("send.welcome")}, ${data.officer_name}. ${data.children_on_caseload} ${t("send.caseload")}.`;

  return (
    <div className={`mx-auto max-w-6xl space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <section className="rounded-2xl border border-[#e0e8e4] bg-white p-6 shadow-sm">
        <div className={`flex flex-wrap items-start justify-between gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e2d26] md:text-3xl">
              {t("send.welcome")}, {data.officer_name}
            </h1>
            <p className="mt-2 text-sm font-medium text-[#7a8a80]">
              {data.children_on_caseload} {t("send.caseload")}
            </p>
          </div>
          <div className={`flex flex-wrap items-center gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
            <SpeakButton text={welcomeSpeak} />
            <button
              type="button"
              onClick={create}
              className="rounded-xl bg-[#4a7a5a] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#2c3e35]"
            >
              {t("send.newAssessment")}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#7a8a80]">{t("send.caseloadStat")}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#2c3e35]">{data.children_on_caseload}</p>
        </div>
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#7a8a80]">{t("send.upcoming")}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#2c3e35]">{data.upcoming_reviews_week}</p>
        </div>
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#7a8a80]">{t("send.overdue")}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#d32f2f]">{data.overdue_reviews}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RecentInteractionsPanel items={data.recent_interactions || []} lastUpdated={lastUpdated} />
          <div>
          <h2 className="mb-3 text-lg font-extrabold text-[#1e2d26]">{t("nav.children")}</h2>
          <div className="flex flex-col gap-3">
            {data.children.map((row) => (
              <div key={row.child_id} className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
                <div className={`flex flex-wrap items-center justify-between gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                  <div>
                    <p className="text-lg font-bold text-[#1e2d26]">
                      {row.name}, {row.age}
                    </p>
                    <p className="text-xs text-[#7a8a80]">
                      {row.school_class} · {sendStatusLabel(row.status, t)}
                    </p>
                    <p className="mt-1 text-xs text-[#7a8a80]">
                      {t("send.lastAssessment")}:{" "}
                      {row.last_assessment_date
                        ? new Date(row.last_assessment_date).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB")
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-[#7a8a80]">
                      {t("send.nextReview")}:{" "}
                      {row.next_review_date
                        ? new Date(row.next_review_date).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB")
                        : "—"}
                    </p>
                  </div>
                  <div className={`flex flex-wrap gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                    {row.latest_assessment_id ? (
                      <>
                        <Link
                          to={`/send-officer/assessment/${row.latest_assessment_id}`}
                          className="rounded-xl bg-[#4a7a5a] px-3 py-2 text-xs font-bold text-white"
                        >
                          {t("send.openAssessment")}
                        </Link>
                        {row.latest_assessment_completed ? (
                          <Link
                            to={`/send-officer/report/${row.latest_assessment_id}`}
                            className="rounded-xl border border-[#e0e8e4] px-3 py-2 text-xs font-bold text-[#3a4a40]"
                          >
                            {t("send.viewReport")}
                          </Link>
                        ) : (
                          <span className="rounded-xl border border-dashed border-[#e0e8e4] px-3 py-2 text-xs font-bold text-[#b0c0b8]">
                            {lang === "ar" ? "التقرير بعد الإكمال" : "Report after submit"}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-[#b0c0b8]">{t("send.noAssessment")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#e0e8e4] bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-extrabold text-[#1e2d26]">{t("send.chartByStatus")}</h3>
          <div dir="ltr" className="h-52">
            {pieData.some((d) => d.value > 0) ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((_, i) => (
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
      </div>
    </div>
  );
}
