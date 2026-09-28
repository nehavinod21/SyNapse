import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios.js";

const REFRESH_MS = 12000;

export function useSendDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fingerprintRef = useRef("");
  const hasLoadedRef = useRef(false);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedRef.current) setLoading(true);
    try {
      const { data: summary } = await api.get("/api/send/dashboard/summary");
      const fingerprint = JSON.stringify(summary.recent_interactions?.slice(0, 8) || []);
      if (fingerprint !== fingerprintRef.current || !hasLoadedRef.current) {
        fingerprintRef.current = fingerprint;
        setData(summary);
        setLastUpdated(new Date());
      }
      hasLoadedRef.current = true;
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard(false);
    const intervalId = setInterval(() => {
      if (!cancelled) fetchDashboard(true);
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [fetchDashboard]);

  return { data, loading, error, lastUpdated, refresh: () => fetchDashboard(true) };
}
