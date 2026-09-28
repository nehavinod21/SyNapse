import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getWsBase } from "../api/axios.js";

function wsUrl(sessionId) {
  return `${getWsBase()}/ws/session/${sessionId}`;
}

function normalizeEntry(payload) {
  if (!payload || typeof payload !== "object") return null;
  return {
    timestamp: payload.timestamp ?? new Date().toISOString(),
    speaker: String(payload.speaker ?? "system"),
    message: String(payload.message ?? ""),
  };
}

export function useTeacherLiveSession(sessionId) {
  const [liveSession, setLiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    const load = () =>
      api
        .get(`/teacher/sessions/${sessionId}/live`)
        .then((r) => {
          if (!cancelled) {
            setLiveSession(r.data);
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
    const poll = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const socket = new WebSocket(wsUrl(sessionId));
    socket.onopen = () => setWsConnected(true);
    socket.onclose = () => setWsConnected(false);
    socket.onerror = () => setWsConnected(false);
    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const event = data.event;

        if (event === "signal_update" && data.payload) {
          setLiveSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              signal_intensity: data.payload.signal_intensity ?? prev.signal_intensity,
              z_score: data.payload.z_score ?? prev.z_score,
              engagement_score: data.payload.engagement_score ?? prev.engagement_score,
            };
          });
          return;
        }

        if (event === "emotion_detected") {
          const intensity = typeof data.intensity === "number" ? data.intensity : 5;
          setLiveSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              signal_intensity: Math.min(1, Math.max(0, intensity / 10)),
              engagement_score: intensity,
              latest_emotion: data.emotion || prev.latest_emotion,
              latest_confidence: typeof data.confidence === "number" ? data.confidence : prev.latest_confidence,
            };
          });
          return;
        }

        if (event === "card_selected") {
          const label = data.card_label || data.label;
          if (!label) return;
          setLiveSession((prev) => {
            if (!prev) return prev;
            const recent = [...(prev.recent_cards || []), label].slice(-6);
            return {
              ...prev,
              recent_cards: recent,
              turn_index: (prev.turn_index || 0) + 1,
            };
          });
          return;
        }

        if (event === "transcript_append" && data.payload) {
          const entry = normalizeEntry(data.payload);
          if (!entry) return;
          setLiveSession((prev) => {
            if (!prev) return prev;
            const next = [...(prev.transcript || []), entry];
            return { ...prev, transcript: next.slice(-40) };
          });
          return;
        }

        if (event === "turn_advanced" && data.payload) {
          setLiveSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              turn_index: data.payload.turn_index ?? prev.turn_index,
              turn_target: data.payload.turn_target ?? prev.turn_target,
            };
          });
          return;
        }

        if (event === "guidance_update" && Array.isArray(data.payload?.suggestions)) {
          setLiveSession((prev) => {
            if (!prev) return prev;
            return { ...prev, guidance_suggestions: data.payload.suggestions.slice(0, 3) };
          });
        }
      } catch {
        /* ignore */
      }
    };
    return () => socket.close();
  }, [sessionId]);

  const pauseSession = useCallback(async () => {
    if (!sessionId) return;
    setActionLoading(true);
    try {
      await api.post(`/teacher/sessions/${sessionId}/pause`);
    } finally {
      setActionLoading(false);
    }
  }, [sessionId]);

  const nextTurn = useCallback(async () => {
    if (!sessionId) return;
    setActionLoading(true);
    try {
      await api.post(`/teacher/sessions/${sessionId}/next-turn`);
    } finally {
      setActionLoading(false);
    }
  }, [sessionId]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    setActionLoading(true);
    try {
      await api.post(`/teacher/sessions/${sessionId}/end`);
    } finally {
      setActionLoading(false);
    }
  }, [sessionId]);

  const useGuidance = useCallback(
    async (guidanceId) => {
      if (!sessionId) return;
      await api.post(`/teacher/sessions/${sessionId}/guidance/${guidanceId}/use`);
    },
    [sessionId]
  );

  const dismissGuidance = useCallback(
    async (guidanceId) => {
      if (!sessionId) return;
      await api.post(`/teacher/sessions/${sessionId}/guidance/${guidanceId}/dismiss`);
      setLiveSession((prev) => {
        if (!prev?.guidance_suggestions) return prev;
        return {
          ...prev,
          guidance_suggestions: prev.guidance_suggestions.filter((g) => g.id !== guidanceId),
        };
      });
    },
    [sessionId]
  );

  const sendMessage = useCallback(
    async (text) => {
      if (!sessionId || !text.trim()) return;
      setActionLoading(true);
      try {
        await api.post(`/teacher/sessions/${sessionId}/message`, { message: text.trim() });
      } finally {
        setActionLoading(false);
      }
    },
    [sessionId]
  );

  const elapsedLabel = useMemo(() => {
    const sec = liveSession?.duration_seconds ?? 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [liveSession?.duration_seconds]);

  return {
    liveSession,
    loading,
    error,
    wsConnected,
    actionLoading,
    pauseSession,
    nextTurn,
    endSession,
    useGuidance,
    dismissGuidance,
    sendMessage,
    elapsedLabel,
    setLiveSession,
  };
}
