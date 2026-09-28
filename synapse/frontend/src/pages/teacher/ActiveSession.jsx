import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import EmotionBadge from "../../components/EmotionBadge.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useLang } from "../../hooks/useLang.js";
import api, { getWsBase } from "../../api/axios.js";

export default function ActiveSession() {
  const { child_id } = useParams();
  const { lang } = useLang();
  const [sessionId, setSessionId] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const wsUrl = useMemo(() => {
    if (!sessionId) return null;
    return `${getWsBase()}/ws/session/${sessionId}`;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post("/api/sessions/start", {
          child_id,
          session_type: "classroom",
          topic: "school",
        });
        if (!cancelled) setSessionId(data.id);
      } catch {
        toast.error(lang === "ar" ? "تعذر بدء الجلسة" : "Could not start session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [child_id, lang]);

  useEffect(() => {
    if (!wsUrl) return;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (ev) => {
      try {
        setLastEvent(JSON.parse(ev.data));
      } catch {
        setLastEvent({ raw: ev.data });
      }
    };
    return () => socket.close();
  }, [wsUrl]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <h1 className={`text-xl font-extrabold text-[#1e2d26] ${lang === "ar" ? "text-right" : ""}`}>
        {lang === "ar" ? "جلسة مباشرة" : "Live session"}
      </h1>
      <div className="flex flex-col gap-4">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <p style={{fontSize: '13px', color: 'var(--muted)', fontWeight: '500'}}>
                {lang === "ar" ? "معرف الجلسة" : "Session"}: {sessionId}
              </p>
              {lastEvent?.emotion && (
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <EmotionBadge label={lastEvent.emotion} confidence={lastEvent.confidence} />
                </div>
              )}
              <pre style={{fontSize: '12px', background: '#fff', border: '1.5px solid var(--gl)', borderRadius: '12px', padding: '16px', overflowX: 'auto', maxHeight: '320px', color: 'var(--text)', fontFamily: "'Monaco', monospace"}}>
                {JSON.stringify(lastEvent, null, 2)}
              </pre>
            </>
          )}
      </div>
    </div>
  );
}
