import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar.jsx";
import { useLang } from "../../hooks/useLang.js";

const TOPICS = [
  { id: "school", en: "School", ar: "المدرسة", emoji: "🏫" },
  { id: "home", en: "Home", ar: "المنزل", emoji: "🏠" },
  { id: "feelings", en: "Feelings", ar: "المشاعر", emoji: "💛" },
  { id: "play", en: "Play", ar: "اللعب", emoji: "🧸" },
  { id: "food", en: "Food", ar: "الطعام", emoji: "🍎" },
  { id: "body", en: "Body", ar: "الجسم", emoji: "🫀" },
];

export default function TopicSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLang();
  const childId = location.state?.childId;

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
        .student-topic-bg {
          position: relative;
          background-image: url('/student-start-bg.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .student-topic-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(247, 243, 238, 0.78);
          backdrop-filter: blur(1px);
        }
        .student-topic-content {
          position: relative;
          z-index: 1;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 10px 35px rgba(44, 62, 53, 0.14);
          padding: 24px 20px;
        }
      `}</style>
      <div className="student-topic-bg" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
        <Navbar title={lang === "ar" ? "اختر الموضوع" : "Choose topic"} />
        <div style={{maxWidth: '900px', margin: '0 auto', padding: '32px 24px', width: '100%'}}>
          <div className="student-topic-content">
            <h2 style={{fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '800', color: 'var(--dark)', marginBottom: '12px', textAlign: 'center', lineHeight: 1.2, fontFamily: "'Playfair Display', serif"}}>
              {lang === "ar" ? "اختر موضوعاً" : "Choose a topic"}
            </h2>
            <p style={{fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--muted)', marginBottom: '32px', textAlign: 'center', fontWeight: 600}}>
              {lang === "ar" ? "ما الذي تريد التحدث عنه؟" : "What do you want to talk about?"}
            </p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px'}}>
              {TOPICS.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  type="button"
                  onClick={() => navigate("/student/session", { state: { topic: t.id, childId } })}
                  style={{
                    borderRadius: '20px',
                    border: '1.5px solid var(--gl)',
                    background: '#fff',
                    padding: '28px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(74, 122, 90, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--g)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(74, 122, 90, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gl)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 122, 90, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{fontSize: '54px', lineHeight: 1}}>{t.emoji}</div>
                  <div style={{fontWeight: '800', color: 'var(--dark)', fontSize: '17px'}}>{lang === "ar" ? t.ar : t.en}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
