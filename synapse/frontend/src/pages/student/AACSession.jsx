import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar.jsx";
import AACCard from "../../components/AACCard.jsx";
import EmotionBadge from "../../components/EmotionBadge.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLang } from "../../hooks/useLang.js";
import api, { getWsBase } from "../../api/axios.js";
import { isCautiousEmotion, EMOTION_MONITOR_INTERVAL_MS, EMOTION_MONITOR_FIRST_DELAY_MS } from "../../constants/emotionMonitor.js";
import { buildEmotionFormData } from "../../utils/emotionCapture.js";
import {
  cameraBlockedReason,
  defaultVideoConstraints,
  iosVideoConstraints,
  isIOS,
} from "../../utils/cameraSupport.js";

function wsUrl(sessionId) {
  return `${getWsBase()}/ws/session/${sessionId}`;
}

const CATEGORY_ORDER = ["core", "emotion", "topic"];

const CATEGORY_LABELS = {
  en: { core: "Core words", emotion: "How I feel", topic: "Topic", other: "More" },
  ar: { core: "كلمات أساسية", emotion: "مشاعري", topic: "الموضوع", other: "المزيد" },
};

function groupCardsByCategory(cards) {
  const groups = {};
  for (const card of cards) {
    const cat = card.category || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(card);
  }
  const order = [
    ...CATEGORY_ORDER,
    ...Object.keys(groups).filter((k) => !CATEGORY_ORDER.includes(k)),
  ];
  return order
    .filter((cat) => groups[cat]?.length)
    .map((cat) => ({ category: cat, cards: groups[cat] }));
}

export default function AACSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLang();
  const topic = location.state?.topic || "school";
  const childIdOverride = location.state?.childId;

  const webcamRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [cards, setCards] = useState([]);
  const [emotion, setEmotion] = useState({ label: "neutral", confidence: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [emotionDetecting, setEmotionDetecting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [supportNote, setSupportNote] = useState(null);
  const wsRef = useRef(null);
  const emotionBusyRef = useRef(false);

  const cameraBlocked = cameraBlockedReason(lang);
  const videoConstraints = isIOS() ? iosVideoConstraints() : defaultVideoConstraints();

  const childId = childIdOverride || (user?.role === "student" ? user?.id : null);

  const startSession = useCallback(async () => {
    if (!childId) {
      toast.error(lang === "ar" ? "لم يتم تحديد الطفل" : "No child selected");
      navigate("/student/topics");
      return;
    }
    const { data } = await api.post("/api/sessions/start", {
      child_id: childId,
      session_type: "classroom",
      topic,
    });
    setSessionId(data.id);
  }, [childId, topic, navigate, lang]);

  const loadCards = useCallback(
    async (emo, sid) => {
      const { data } = await api.post("/api/cards/generate", {
        session_id: sid,
        emotion: emo,
        child_id: childId,
        topic,
      });
      setCards(data.cards || []);
    },
    [childId, topic]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await startSession();
      } catch {
        if (!cancelled) toast.error(lang === "ar" ? "تعذر بدء الجلسة" : "Could not start session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startSession, lang]);

  useEffect(() => {
    if (!sessionId) return;
    const socket = new WebSocket(wsUrl(sessionId));
    wsRef.current = socket;
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === "emotion_detected" && msg.emotion) {
          setEmotion({ label: msg.emotion, confidence: msg.confidence ?? 0 });
        }
        if (msg.event === "support_message" && msg.payload) {
          const text =
            lang === "ar"
              ? msg.payload.message_ar || msg.payload.message_en
              : msg.payload.message_en || msg.payload.message_ar;
          const from =
            msg.payload.from_role === "caregiver"
              ? lang === "ar"
                ? "ولي الأمر"
                : "Caregiver"
              : lang === "ar"
                ? "المعلم"
                : "Teacher";
          setSupportNote({ from, text });
          toast.success(`${from}: ${text}`, { duration: 10000, icon: "💬" });
          try {
            if (typeof window !== "undefined" && window.speechSynthesis && text) {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(text);
              u.lang = lang === "ar" ? "ar-AE" : "en-US";
              window.speechSynthesis.speak(u);
            }
          } catch {
            /* TTS optional */
          }
        }
      } catch {
        /* ignore */
      }
    };
    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [sessionId, lang]);

  useEffect(() => {
    if (!sessionId || !childId) return;
    loadCards(emotion.label, sessionId).catch(() => {});
  }, [sessionId, childId, emotion.label, loadCards]);

  const captureEmotion = useCallback(async ({ silent = false } = {}) => {
    if (!sessionId || !webcamRef.current || emotionBusyRef.current) return;
    emotionBusyRef.current = true;
    setEmotionDetecting(true);
    try {
      const fd = await buildEmotionFormData(sessionId, webcamRef);
      if (!fd) {
        if (!silent) throw new Error("no shot");
        return;
      }
      const { data } = await api.post("/api/emotion/detect", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000,
      });
      setEmotion({ label: data.emotion, confidence: data.confidence });
      if (isCautiousEmotion(data.emotion, data.confidence)) {
        loadCards(data.emotion, sessionId).catch(() => {});
        toast(
          lang === "ar"
            ? "تم إبلاغ المعلم/ولي الأمر — استخدم البطاقات للتواصل"
            : "Your teacher/caregiver has been alerted — use the cards to communicate",
          { icon: "💛", duration: 5000 }
        );
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else if (!silent) {
        toast.success(lang === "ar" ? "تم تحديث المشاعر" : "Mood updated");
      }
    } catch {
      if (!silent) toast.error(lang === "ar" ? "تعذر قراءة المشاعر" : "Could not read mood");
    } finally {
      emotionBusyRef.current = false;
      setEmotionDetecting(false);
    }
  }, [sessionId, lang, loadCards]);

  // Auto mood check every ~2.5 minutes (first check after camera settles)
  const captureEmotionRef = useRef(captureEmotion);
  useEffect(() => {
    captureEmotionRef.current = captureEmotion;
  }, [captureEmotion]);

  useEffect(() => {
    if (!sessionId || cameraBlocked) return undefined;
    let intervalId;
    const timeoutId = setTimeout(() => {
      captureEmotionRef.current({ silent: true });
      intervalId = setInterval(() => {
        captureEmotionRef.current({ silent: true });
      }, EMOTION_MONITOR_INTERVAL_MS);
    }, EMOTION_MONITOR_FIRST_DELAY_MS);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, cameraBlocked]);

  const onSelectCard = async (card) => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await api.post("/api/cards/select", {
        session_id: sessionId,
        card_id: card.id,
        card_label: card.label,
        card_label_ar: card.label_ar,
        card_category: card.category,
        emotion_at_selection: emotion.label,
      });
      if (navigator.vibrate) navigator.vibrate(50);
      toast.success(lang === "ar" ? "تم الإرسال" : "Sent");
    } catch {
      toast.error(lang === "ar" ? "فشل الإرسال" : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) {
      navigate("/student/celebration", { state: { topic } });
      return;
    }
    try {
      await api.post(`/api/sessions/${sessionId}/end`);
    } catch {
      /* still leave */
    }
    navigate("/student/celebration", { state: { topic } });
  };

  if (loading || !sessionId) {
    return (
      <>
        <style>{`
          :root {
            --g: #4a7a5a;
            --gl: #b5d5bf;
            --gp: #e8f4ec;
            --gd: #2c3e35;
            --cream: #f7f3ee;
            --white: #fff;
            --dark: #1e2d26;
            --text: #3a4a40;
            --muted: #7a8a80;
            --r: 14px;
          }
          body {
            background: var(--cream);
            color: var(--text);
          }
        `}</style>
        <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream)'}}>
          <Navbar />
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
            <LoadingSpinner />
            <p style={{fontSize: '14px', fontWeight: 600, color: '#7a8a80'}}>
              {lang === "ar" ? "جاري بدء الجلسة وتحميل البطاقات…" : "Starting session & loading cards…"}
            </p>
          </div>
        </div>
      </>
    );
  }

  const topicLabel =
    lang === "ar"
      ? { school: "المدرسة", home: "المنزل", play: "اللعب", feelings: "المشاعر", food: "الطعام" }[topic] || topic
      : topic.charAt(0).toUpperCase() + topic.slice(1);
  const labels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
  const cardGroups = groupCardsByCategory(cards);

  return (
    <>
      <style>{`
        body { background: #f7f3ee; color: #3a4a40; }
        .student-session-btn-primary {
          border-radius: 12px; background: #4a7a5a; color: #fff; padding: 10px 14px;
          font-size: 13px; font-weight: 700; border: none; cursor: pointer; width: 100%;
        }
        .student-session-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .student-session-btn-secondary {
          border-radius: 12px; border: 1.5px solid #b5d5bf; background: #fff; color: #3a4a40;
          padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer; width: 100%;
        }
        .student-session-meta { font-size: 11px; color: #7a8a80; margin: 0; line-height: 1.4; }
      `}</style>
      <div className="student-session-page" dir={lang === "ar" ? "rtl" : "ltr"}>
        <Navbar title={lang === "ar" ? "جلسة AAC" : "AAC session"} />
        {supportNote && (
          <div
            role="status"
            style={{
              margin: "12px 16px 0",
              padding: "12px 16px",
              borderRadius: "14px",
              border: "2px solid #4a7a5a",
              background: "#e8f4ec",
              color: "#1e2d26",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#4a7a5a", marginBottom: 4 }}>
              {lang === "ar" ? `رسالة من ${supportNote.from}` : `Message from ${supportNote.from}`}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.45 }}>{supportNote.text}</div>
            <button
              type="button"
              onClick={() => setSupportNote(null)}
              style={{
                marginTop: 8,
                border: "none",
                background: "transparent",
                color: "#5a6a60",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {lang === "ar" ? "إخفاء" : "Dismiss"}
            </button>
          </div>
        )}
        <div className="student-session-body">
          <aside className="student-session-camera" aria-label={lang === "ar" ? "الكاميرا" : "Camera"}>
            <div className="student-session-camera-frame">
              {cameraBlocked ? (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    minHeight: "200px",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#7a4a00",
                    background: "#fff8e6",
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "28px" }}>📷</p>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{cameraBlocked}</p>
                    <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#7a8a80" }}>
                      {lang === "ar"
                        ? "البطاقات تعمل بدون كاميرا — اضغط «تحديث المشاعر» لن يعمل حتى HTTPS"
                        : "AAC cards still work — mood detection needs HTTPS on iPad"}
                    </p>
                  </div>
                </div>
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  mirrored
                  onUserMedia={() => setCameraError(null)}
                  onUserMediaError={(err) => {
                    const name = err?.name || "Error";
                    setCameraError(name);
                    toast.error(
                      lang === "ar"
                        ? `الكاميرا: ${name} — اسمح بالوصول في إعدادات Safari`
                        : `Camera: ${name} — allow access in Safari settings`,
                      { duration: 6000 }
                    );
                  }}
                  videoProps={{ playsInline: true, muted: true, autoPlay: true }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            {cameraError && !cameraBlocked && (
              <p className="student-session-meta" style={{ color: "#b45309", marginTop: "6px" }}>
                {lang === "ar" ? `خطأ الكاميرا: ${cameraError}` : `Camera error: ${cameraError}`}
              </p>
            )}
            <div className="student-session-controls">
              <EmotionBadge label={emotion.label} confidence={emotion.confidence} analyzing={emotionDetecting} />
              <div className="student-session-controls-row">
                <button
                  type="button"
                  className="student-session-btn-primary"
                  disabled={busy || emotionDetecting || !!cameraBlocked}
                  onClick={() => captureEmotion({ silent: false })}
                >
                  {emotionDetecting
                    ? lang === "ar"
                      ? "جاري التحليل…"
                      : "Analyzing…"
                    : lang === "ar"
                      ? "تحديث المشاعر"
                      : "Update mood"}
                </button>
              </div>
              <p className="student-session-meta">
                {lang === "ar"
                  ? "فحص تلقائي كل ٢–٣ دقائق (يمكنك التحديث يدوياً أيضاً)"
                  : "Auto-checks every 2–3 min (you can still tap Update mood)"}
              </p>
              <button type="button" className="student-session-btn-secondary" onClick={endSession}>
                {lang === "ar" ? "إنهاء الجلسة" : "Finish session"}
              </button>
            </div>
          </aside>

          <section className="student-session-cards-panel" aria-label={lang === "ar" ? "بطاقات التواصل" : "Communication cards"}>
            <div className="student-session-cards-header">
              <h2>{lang === "ar" ? "اختر بطاقة" : "Tap a card to speak"}</h2>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#4a7a5a" }}>
                {lang === "ar" ? "الموضوع" : "Topic"}: {topicLabel}
              </span>
            </div>
            {cardGroups.map(({ category, cards: sectionCards }) => (
              <div key={category} className="student-card-section">
                <h3 className="student-card-section-title">
                  {labels[category] || labels.other}
                </h3>
                <div className="student-session-aac-grid">
                  {sectionCards.map((c) => (
                    <AACCard key={c.id} card={c} lang={lang} onSelect={onSelectCard} disabled={busy} />
                  ))}
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <p style={{ color: "#7a8a80", fontWeight: 600 }}>
                {lang === "ar" ? "جاري تحميل البطاقات…" : "Loading cards…"}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
