import { useEffect, useState } from "react";
import api from "../api/axios.js";

export function useTeacherDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .get("/teacher/dashboard/summary")
        .then((r) => {
          if (!cancelled) {
            setSummary(r.data);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    load();
    // Poll so "Join live" appears when student starts a session in another window.
    const id = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { summary, loading, error, setSummary };
}
