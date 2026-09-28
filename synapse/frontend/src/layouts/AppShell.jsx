import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
  TrendingUp,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLang } from "../hooks/useLang.js";
import SpeakButton from "../components/SpeakButton.jsx";
import EmotionAlertBanner from "../components/EmotionAlertBanner.jsx";
import { useAlertWebSocket } from "../hooks/useAlertWebSocket.js";
import api from "../api/axios.js";
import toast from "react-hot-toast";

function roleLabel(role, t) {
  if (role === "teacher") return t("shell.roleTeacher");
  if (role === "send_officer") return t("shell.roleSend");
  if (role === "caregiver") return t("shell.roleCaregiver");
  return role || "";
}

function greetingForHour(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "greet.morning";
  if (h < 17) return "greet.afternoon";
  return "greet.evening";
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, setLanguage, t } = useLang();
  const rtl = lang === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const nav = useMemo(() => {
    const r = user?.role;
    if (r === "teacher") {
      return [
        { to: "/teacher/dashboard", key: "nav.home", icon: LayoutDashboard },
        { to: "/teacher/children", key: "nav.children", icon: Users },
        { to: "/teacher/sessions-hub", key: "nav.sessions", icon: Calendar },
        { to: "/teacher/reports", key: "nav.reports", icon: FileText },
        { to: "/teacher/settings", key: "shell.settings", icon: Settings },
      ];
    }
    if (r === "send_officer") {
      return [
        { to: "/send-officer/dashboard", key: "nav.home", icon: LayoutDashboard },
        { to: "/send-officer/children", key: "nav.children", icon: Users },
        { to: "/send-officer/assessments", key: "nav.assessments", icon: ClipboardList },
        { to: "/send-officer/reports-hub", key: "nav.reports", icon: FileText },
        { to: "/send-officer/settings", key: "shell.settings", icon: Settings },
      ];
    }
    if (r === "caregiver") {
      return [
        { to: "/caregiver/dashboard", key: "nav.home", icon: LayoutDashboard },
        { to: "/caregiver/progress", key: "nav.progress", icon: TrendingUp },
        { to: "/caregiver/session", key: "nav.sessions", icon: Heart },
        { to: "/caregiver/settings", key: "shell.settings", icon: Settings },
      ];
    }
    return [];
  }, [user?.role]);

  const greetKey = greetingForHour();

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const headerSpeak = `${t(greetKey)}, ${user?.full_name || ""}. ${roleLabel(user?.role, t)}.`;

  const alertToken = typeof localStorage !== "undefined" ? localStorage.getItem("synapse_token") : null;
  const alertsEnabled = user?.role === "teacher" || user?.role === "caregiver";
  const { latestAlert, dismissLatest, clearAlert, connected } = useAlertWebSocket({
    enabled: alertsEnabled,
    token: alertToken,
    onAlert: (msg) => {
      toast(msg.message_en || "Emotion alert", {
        duration: 6000,
        id: "synapse-emotion-alert",
        icon: "⚠️",
      });
    },
  });

  const acknowledgeAlert = async () => {
    if (!latestAlert?.alert_id) return;
    const alertId = latestAlert.alert_id;
    try {
      await api.post(`/api/alerts/${alertId}/acknowledge`);
      clearAlert(alertId);
      toast.success(
        lang === "ar"
          ? "تم التأكيد وإرسال رسالة طمأنة للطالب"
          : "Acknowledged — support message sent to student",
        { duration: 5000 }
      );
    } catch {
      toast.error(lang === "ar" ? "فشل التأكيد" : "Could not acknowledge");
    }
  };

  const dismissAlert = async () => {
    // Dismiss without student message still stops the spam; prefer Acknowledge for demo.
    if (latestAlert?.alert_id) {
      try {
        await api.post(`/api/alerts/${latestAlert.alert_id}/acknowledge`);
      } catch {
        /* still clear locally */
      }
      clearAlert(latestAlert.alert_id);
    } else {
      dismissLatest();
    }
  };

  const onLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <div className={`teacher-layout flex min-h-screen bg-[#f7f3ee] text-[#1e2d26] ${rtl ? "flex-row-reverse" : ""}`}>
      <aside className="hidden w-56 shrink-0 flex-col border-[#e0e8e4] bg-white shadow-sm md:flex ltr:border-r rtl:border-l">
        <div className="flex items-center gap-3 border-b border-[#e8ece9] px-4 py-5">
          <img src="/synapse-logo.png" alt="SyNAPSE logo" className="h-12 w-12 rounded-xl object-contain md:h-14 md:w-14" />
          <div className={`min-w-0 ${rtl ? "text-right" : "text-left"}`}>
            <div className="truncate text-sm font-extrabold text-[#1e2d26]">SyNAPSE</div>
            <div className="truncate text-xs text-[#7a8a80]">{roleLabel(user?.role, t)}</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                  rtl ? "flex-row-reverse text-right" : "text-left"
                } ${isActive ? "bg-[#e8f4ec] text-[#2c3e35]" : "text-[#5a6a60] hover:bg-[#f7f3ee]"}`
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#d8e8de] bg-[#fafcf9]/95 backdrop-blur shadow-sm">
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 ${rtl ? "flex-row-reverse" : ""}`}>
            <div className={`flex min-w-0 flex-1 items-center gap-3 ${rtl ? "flex-row-reverse justify-end" : ""}`}>
              <img src="/synapse-logo.png" alt="SyNAPSE logo" className="h-11 w-11 shrink-0 object-contain md:hidden" />
              <div className={`min-w-0 flex-1 ${rtl ? "text-right" : "text-center md:text-left"}`}>
              <div className={`flex flex-wrap items-center justify-center gap-2 md:justify-start ${rtl ? "flex-row-reverse md:justify-end" : ""}`}>
                <p className="truncate text-xl font-extrabold text-[#1e2d26] md:text-2xl">
                  {t(greetKey)}, {user?.full_name || "—"}
                </p>
                <SpeakButton text={headerSpeak} className="shrink-0" />
              </div>
              <p className={`mt-0.5 text-xs font-semibold text-[#7a8a80] ${rtl ? "text-center md:text-left" : "text-center md:text-left"} ${rtl ? "md:text-right" : ""}`}>
                {roleLabel(user?.role, t)}
              </p>
              </div>
            </div>

            <div className={`flex flex-wrap items-center gap-2 ${rtl ? "flex-row-reverse" : ""}`}>
              <div className="flex rounded-full border border-[#e0e8e4] bg-[#f7f3ee] p-1">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${lang === "en" ? "bg-white shadow-sm text-[#2c3e35]" : "text-[#7a8a80]"}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ar")}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${lang === "ar" ? "bg-white shadow-sm text-[#2c3e35]" : "text-[#7a8a80]"}`}
                >
                  عربي
                </button>
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 rounded-2xl border border-[#e0e8e4] bg-white px-3 py-2 text-sm font-semibold text-[#3a4a40] shadow-sm ${rtl ? "flex-row-reverse" : ""}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ec] text-xs font-bold text-[#2c3e35]">
                    {(user?.full_name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                {menuOpen ? (
                  <div
                    className={`absolute top-full z-30 mt-2 min-w-[180px] rounded-2xl border border-[#e8ece9] bg-white py-2 shadow-lg ${rtl ? "left-0" : "right-0"}`}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-[#3a4a40] hover:bg-[#f7f3ee] ${rtl ? "flex-row-reverse text-right" : "text-left"}`}
                      onClick={() => {
                        const p =
                          user?.role === "teacher"
                            ? "/teacher/settings"
                            : user?.role === "send_officer"
                              ? "/send-officer/settings"
                              : "/caregiver/settings";
                        navigate(p);
                        setMenuOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      {t("shell.profile")}
                    </button>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 ${rtl ? "flex-row-reverse text-right" : "text-left"}`}
                      onClick={onLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("shell.logout")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[#f0f2f0] px-3 py-2 md:hidden">
            {nav.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                    isActive ? "bg-[#e8f4ec] text-[#2c3e35]" : "bg-[#f7f3ee] text-[#5a6a60]"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {t(key)}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {alertsEnabled && (
            <>
              <EmotionAlertBanner
                alert={latestAlert}
                lang={lang}
                onDismiss={dismissAlert}
                onAcknowledge={acknowledgeAlert}
              />
              {!connected && (
                <p className={`mb-3 text-xs font-semibold text-amber-700 ${rtl ? "text-right" : "text-left"}`}>
                  {lang === "ar"
                    ? "جاري الاتصال بالتنبيهات… (نسخ احتياطي كل ٤ ثوانٍ)"
                    : "Connecting alerts… (polling backup every 4s)"}
                </p>
              )}
            </>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
