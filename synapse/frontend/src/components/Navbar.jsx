import { Link, useNavigate } from "react-router-dom";
import { LogOut, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";

function roleHome(role) {
  switch (role) {
    case "student":
      return "/student/splash";
    case "teacher":
      return "/teacher/dashboard";
    case "send_officer":
      return "/send-officer/dashboard";
    case "caregiver":
      return "/caregiver/dashboard";
    default:
      return "/login";
  }
}

export default function Navbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [lang, setLang] = useState(() => localStorage.getItem("synapse_lang") || "en");
  useEffect(() => {
    const onLang = () => setLang(localStorage.getItem("synapse_lang") || "en");
    window.addEventListener("synapse-lang", onLang);
    return () => window.removeEventListener("synapse-lang", onLang);
  }, []);
  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    localStorage.setItem("synapse_lang", next);
    document.documentElement.lang = next;
    setLang(next);
    window.dispatchEvent(new Event("synapse-lang"));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#d8e8de] bg-[#fafcf9]/95 backdrop-blur shadow-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <Link
            to={user ? roleHome(user.role) : "/login"}
            className="inline-flex shrink-0 items-center gap-2"
            aria-label="SyNAPSE home"
          >
            <img src="/synapse-logo.png" alt="SyNAPSE logo" className="h-12 w-12 object-contain md:h-14 md:w-14" />
            {!title && (
              <span className="hidden font-extrabold text-[#2c3e35] sm:inline md:text-lg">SyNAPSE</span>
            )}
          </Link>
        </div>

        <div className="min-w-0 justify-self-center text-center">
          {title && (
            <>
              <h1 className="truncate text-xl font-extrabold text-[#1e2d26] md:text-2xl lg:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs font-semibold text-[#7a8a80] md:text-sm">{subtitle}</p>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end">
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1 rounded-lg border border-[#c5d9cc] bg-white px-2 py-1.5 text-xs font-semibold text-[#3a4a40] hover:bg-[#f0f7f2]"
            title="Toggle English / Arabic UI labels"
          >
            <Globe size={14} />
            {lang === "en" ? "EN" : "عربي"}
          </button>
          {user && (
            <>
              <span className="hidden max-w-[120px] truncate text-xs text-[#7a8a80] md:inline">{user.full_name}</span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#c5d9cc] bg-white px-2 py-1.5 text-xs font-semibold text-[#3a4a40] hover:bg-[#f0f7f2]"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
