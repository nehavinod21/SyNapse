import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLang } from "../../hooks/useLang.js";

export default function RoleSettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#e0e8e4] bg-white p-8 shadow-sm">
      <h1 className="text-xl font-extrabold text-[#1e2d26]">{t("shell.settings")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#5a6a60]">{t("settings.blurb")}</p>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="mt-6 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
      >
        {t("shell.logout")}
      </button>
    </div>
  );
}
