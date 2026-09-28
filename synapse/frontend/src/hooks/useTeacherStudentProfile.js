import { useEffect, useState } from "react";
import api from "../api/axios.js";

export function useTeacherStudentProfile(childId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get(`/teacher/students/${childId}/profile`)
      .then((r) => {
        if (!cancelled) setProfile(r.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  return { profile, loading, error };
}
