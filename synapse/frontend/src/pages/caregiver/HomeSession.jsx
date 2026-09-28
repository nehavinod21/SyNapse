import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AACCard from "../../components/AACCard.jsx";
import EmotionBadge from "../../components/EmotionBadge.jsx";
import { useLang } from "../../hooks/useLang.js";
import api from "../../api/axios.js";

export default function HomeSession() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const childId = location.state?.childId;

  const [sessionId, setSessionId] = useState(null);
  const [cards, setCards] = useState([]);
  const [emotion, setEmotion] = useState({ label: "neutral", confidence: 0 });

  useEffect(() => {
    if (!childId) {
      toast.error(lang === "ar" ? "اختر طفلاً من لوحة التحكم" : "Pick a child from dashboard");
      navigate("/caregiver/dashboard");
      return;
    }
    (async () => {
      try {
        const { data } = await api.post("/api/sessions/start", {
          child_id: childId,
          session_type: "home",
          topic: "home",
        });
        setSessionId(data.id);
        const gen = await api.post("/api/cards/generate", {
          session_id: data.id,
          emotion: "neutral",
          child_id: childId,
          topic: "home",
        });
        setCards(gen.data.cards || []);
      } catch {
        toast.error(lang === "ar" ? "تعذر بدء الجلسة" : "Could not start session");
      }
    })();
  }, [childId, navigate, lang]);

  const onSelect = async (card) => {
    if (!sessionId) return;
    await api.post("/api/cards/select", {
      session_id: sessionId,
      card_id: card.id,
      card_label: card.label,
      card_label_ar: card.label_ar,
      card_category: card.category,
      emotion_at_selection: emotion.label,
    });
    toast.success(lang === "ar" ? "تم" : "OK");
  };

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <h1 className={`mb-4 text-xl font-extrabold text-[#1e2d26] ${lang === "ar" ? "text-right" : ""}`}>
        {lang === "ar" ? "جلسة منزلية" : "Home session"}
      </h1>
      <div className={`mb-4 flex items-center gap-3 ${lang === "ar" ? "flex-row-reverse justify-end" : ""}`}>
        <EmotionBadge label={emotion.label} confidence={emotion.confidence} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {cards.map((c) => (
          <AACCard key={c.id} card={c} lang={lang} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
