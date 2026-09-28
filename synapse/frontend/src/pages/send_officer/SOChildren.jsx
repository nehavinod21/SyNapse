import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function SOChildren() {
  const { lang, t } = useLang();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/children")
      .then((r) => setChildren(r.data))
      .catch(() => toast.error(lang === "ar" ? "تعذر التحميل" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-5xl space-y-4 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <h1 className="text-2xl font-extrabold text-[#1e2d26]">{t("nav.children")}</h1>
      <div className="overflow-hidden rounded-2xl border border-[#e0e8e4] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#f7f3ee]">
            <tr>
              <th className="px-4 py-3 font-bold">{lang === "ar" ? "الاسم" : "Name"}</th>
              <th className="px-4 py-3 font-bold">{lang === "ar" ? "العمر" : "Age"}</th>
              <th className="px-4 py-3 font-bold">{lang === "ar" ? "التشخيص" : "Diagnosis"}</th>
              <th className="px-4 py-3 font-bold">{t("profile.diagnosis")}</th>
            </tr>
          </thead>
          <tbody>
            {children.map((c) => (
              <tr key={c.id} className="border-t border-[#eef2ef]">
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3">{c.age}</td>
                <td className="px-4 py-3">{c.diagnosis}</td>
                <td className="px-4 py-3">{c.communication_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
