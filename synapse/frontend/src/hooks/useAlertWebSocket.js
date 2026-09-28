import { useCallback, useEffect, useRef, useState } from "react";
import api, { getWsBase } from "../api/axios.js";

const POLL_MS = 8000;
const RECONNECT_MS = 2500;
const SEEN_KEY = "synapse_seen_alerts";

/** Shared across React Strict Mode double-mounts so one alert ≠ two toasts */
const globalSeenAlertIds = (() => {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.slice(-100) : []);
  } catch {
    return new Set();
  }
})();

function persistSeenIds() {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...globalSeenAlertIds].slice(-100)));
  } catch {
    /* ignore */
  }
}

function markSeen(alertId) {
  if (!alertId) return false;
  if (globalSeenAlertIds.has(alertId)) return false;
  globalSeenAlertIds.add(alertId);
  persistSeenIds();
  return true;
}

function alertsWsUrl(token) {
  return `${getWsBase()}/ws/alerts?token=${encodeURIComponent(token)}`;
}

function alertPayloadFromApi(row) {
  return {
    event: "emotion_alert",
    alert_id: row.id,
    child_id: row.child_id,
    child_name: row.child_name,
    session_id: row.session_id,
    emotion: row.emotion_label,
    confidence: row.confidence,
    intensity: row.intensity,
    environment: row.environment,
    recipient_role: row.recipient_role,
    message_en: row.child_name
      ? `${row.child_name} may need support — detected ${row.emotion_label}.`
      : `Emotion alert: ${row.emotion_label}`,
    message_ar: row.child_name
      ? `قد يحتاج ${row.child_name} إلى دعم — تم رصد ${row.emotion_label}.`
      : `تنبيه: ${row.emotion_label}`,
  };
}

export function useAlertWebSocket({ enabled, token, onAlert }) {
  const [connected, setConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const onAlertRef = useRef(onAlert);
  const clearedBacklog = useRef(false);

  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  const dismissLatest = useCallback(() => setLatestAlert(null), []);

  const clearAlert = useCallback((alertId) => {
    markSeen(alertId);
    setLatestAlert(null);
  }, []);

  const deliverAlert = useCallback((msg) => {
    if (!msg?.alert_id) return;
    if (!markSeen(msg.alert_id)) return;
    setLatestAlert(msg);
    onAlertRef.current?.(msg);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("SyNAPSE Alert", {
          body: msg.message_en || `${msg.child_name}: ${msg.emotion}`,
          tag: "synapse-emotion-alert",
          renotify: false,
        });
      } catch {
        /* older browsers */
      }
    }
  }, []);

  const pollAlerts = useCallback(async () => {
    if (!enabled || !token) return;
    try {
      // One-time: clear historical spam so polling doesn't drip old alerts
      if (!clearedBacklog.current) {
        clearedBacklog.current = true;
        try {
          await api.post("/api/alerts/acknowledge-all");
        } catch {
          /* ignore */
        }
        return;
      }

      const { data } = await api.get("/api/alerts/", {
        params: { unacknowledged_only: true },
        timeout: 10000,
      });
      const rows = Array.isArray(data) ? data : [];
      // Newest only (API already collapses backlog)
      const newest = rows[0];
      if (newest?.id) deliverAlert(alertPayloadFromApi(newest));
    } catch {
      /* offline or auth */
    }
  }, [enabled, token, deliverAlert]);

  useEffect(() => {
    if (!enabled || !token) return undefined;

    let closed = false;

    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(alertsWsUrl(token));
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closed) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_MS);
        }
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.event === "emotion_alert") {
            deliverAlert(msg);
          }
        } catch {
          /* ignore */
        }
      };
    };

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    connect();
    pollAlerts();
    const pollId = setInterval(pollAlerts, POLL_MS);

    return () => {
      closed = true;
      clearInterval(pollId);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, token, deliverAlert, pollAlerts]);

  return { connected, latestAlert, dismissLatest, clearAlert };
}
