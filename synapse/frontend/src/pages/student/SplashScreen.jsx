import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar.jsx";
import SDGBadges from "../../components/SDGBadges.jsx";
import { useLang } from "../../hooks/useLang.js";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { lang } = useLang();

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
        .student-splash-bg {
          position: relative;
          background-image: url('/student-start-bg.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .student-splash-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(247, 243, 238, 0.78);
          backdrop-filter: blur(1px);
        }
        .student-splash-content {
          position: relative;
          z-index: 1;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 10px 35px rgba(44, 62, 53, 0.14);
          padding: 28px 24px;
        }
      `}</style>
      <div className="student-splash-bg" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
        <Navbar title={lang === "ar" ? "ترحيب" : "Welcome"} />
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', width: '100%'}}>
          <motion.div className="student-splash-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <img
              src="/synapse-logo.png"
              alt="SyNAPSE logo"
              style={{width: '156px', height: '156px', objectFit: 'contain', margin: '0 auto 24px'}}
            />
            <h1 style={{fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: '800', color: 'var(--dark)', marginBottom: '16px', fontFamily: "'Playfair Display', serif", textAlign: 'center', lineHeight: 1.15}}>
              {lang === "ar" ? "مرحباً بك في SyNAPSE" : "Welcome to SyNAPSE"}
            </h1>
            <p style={{color: 'var(--muted)', marginBottom: '32px', fontSize: 'clamp(16px, 2.5vw, 20px)', lineHeight: '1.6', textAlign: 'center'}}>
              {lang === "ar"
                ? "اختر موضوعاً وابدأ التواصل بالبطاقات."
                : "Pick a topic and communicate with picture cards."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/student/topics")}
              style={{borderRadius: '50px', background: 'var(--g)', color: '#fff', padding: '14px 36px', fontSize: '16px', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(74, 122, 90, 0.35)', transition: 'all 0.2s'}}
              onMouseEnter={(e) => {e.target.style.background = 'var(--gd)'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 28px rgba(74, 122, 90, 0.5)';}}
              onMouseLeave={(e) => {e.target.style.background = 'var(--g)'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(74, 122, 90, 0.35)';}}
            >
              {lang === "ar" ? "ابدأ" : "Start"}
            </button>
          </motion.div>
          <SDGBadges lang={lang} />
        </div>
      </div>
    </>
  );
}
