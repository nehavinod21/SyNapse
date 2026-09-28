import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar.jsx";
import { useLang } from "../../hooks/useLang.js";

export default function CelebrationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLang();
  const topic = location.state?.topic || "";

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
        <Navbar title={lang === "ar" ? "أحسنت" : "Great job"} />
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'}}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{fontSize: '80px', marginBottom: '24px'}}>🎉</div>
            <h1 style={{fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: '800', color: 'var(--g)', marginBottom: '16px', fontFamily: "'Playfair Display', serif", textAlign: 'center', lineHeight: 1.15}}>
              {lang === "ar" ? "أحسنت!" : "You did it!"}
            </h1>
            <p style={{color: 'var(--muted)', marginBottom: '32px', maxWidth: '480px', fontSize: 'clamp(16px, 2.5vw, 20px)', lineHeight: '1.6', textAlign: 'center', margin: '0 auto 32px'}}>
              {lang === "ar"
                ? `أنهيت جلسة حول: ${topic || "—"}`
                : `You finished a session about: ${topic || "—"}`}
            </p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center'}}>
              <button
                type="button"
                onClick={() => navigate("/student/topics")}
                style={{borderRadius: '12px', background: 'var(--g)', color: '#fff', padding: '12px 24px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(74, 122, 90, 0.35)'}}
                onMouseEnter={(e) => {e.target.style.background = 'var(--gd)'; e.target.style.transform = 'translateY(-2px)';}}
                onMouseLeave={(e) => {e.target.style.background = 'var(--g)'; e.target.style.transform = 'translateY(0)';}}
              >
                {lang === "ar" ? "موضوع جديد" : "Another topic"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/student/splash")}
                style={{borderRadius: '12px', border: '1.5px solid var(--gl)', background: 'transparent', color: 'var(--text)', padding: '12px 24px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s'}}
                onMouseEnter={(e) => {e.target.style.background = 'var(--gp)'; e.target.style.borderColor = 'var(--g)';}}
                onMouseLeave={(e) => {e.target.style.background = 'transparent'; e.target.style.borderColor = 'var(--gl)';}}
              >
                {lang === "ar" ? "القائمة" : "Home"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
