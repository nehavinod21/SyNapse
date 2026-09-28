import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import SDGBadges from "../components/SDGBadges.jsx";
import { useLang } from "../hooks/useLang.js";
import api, { API_BASE_URL } from "../api/axios.js";

function rolePath(role) {
  switch (role) {
    case "student":
      return "/student/splash";
    case "teacher":
      return "/teacher/dashboard";
    case "send_officer":
      return "/send-officer/dashboard";
    case "caregiver":
      return "/caregiver/dashboard";
    default:
      return "/login";
  }
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiOk, setApiOk] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/health", { timeout: 8000 })
      .then(() => {
        if (!cancelled) setApiOk(true);
      })
      .catch(() => {
        if (!cancelled) setApiOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const apiLabel = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const ipadUrl =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? `${window.location.protocol}//${window.location.hostname}:5180/login`
      : "http://<your-wifi-ip>:5180/login";

  const from = location.state?.from?.pathname;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(username, password);
      toast.success(lang === "ar" ? "تم تسجيل الدخول" : "Signed in");
      navigate(from && from !== "/login" ? from : rolePath(u.role), { replace: true });
    } catch {
      toast.error(lang === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: '#f7f3ee',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <style>{`
        :root {
          --g: #4a7a5a;
          --gd: #2c3e35;
          --cream: #f7f3ee;
          --text: #3a4a40;
          --muted: #7a8a80;
          --gl: #b5d5bf;
          --gp: #e8f4ec;
          --r: 14px;
        }
      `}</style>
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{width: '100%', maxWidth: '420px'}}
      >
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <h1 style={{fontSize: '42px', fontWeight: '800', color: 'var(--gd)', letterSpacing: '-0.5px'}}>SyNAPSE</h1>
          <p style={{color: 'var(--muted)', marginTop: '8px', fontSize: '14px', fontWeight: '500'}}>
            {lang === "ar"
              ? "منصة تواصل معزّزة بالعاطفة — MAHE Dubai"
              : "Emotion-aware AAC — MAHE Dubai"}
          </p>
          {apiOk === false && (
            <div
              style={{
                marginTop: '16px',
                borderRadius: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 14px',
                fontSize: '12px',
                lineHeight: 1.5,
                textAlign: 'left',
              }}
            >
              {lang === "ar" ? (
                <>
                  <strong>تعذر الاتصال بالخادم.</strong> تأكد أن الكمبيوتر والآيباد على نفس Wi‑Fi، وأن الخادم يعمل على المنفذ 8000.
                  <br />
                  <code style={{ fontSize: '11px' }}>{apiLabel}</code>
                </>
              ) : (
                <>
                  <strong>Cannot reach the API.</strong> Start backend on port 8000; check <code style={{ fontSize: '11px' }}>.env.local</code>.
                  <br />
                  <code style={{ fontSize: '11px' }}>{apiLabel}</code>
                </>
              )}
            </div>
          )}
          {apiOk === true && (
            <div
              style={{
                marginTop: '16px',
                borderRadius: '12px',
                background: '#e8f4ec',
                border: '1px solid #b5d5bf',
                color: '#2c3e35',
                padding: '12px 14px',
                fontSize: '12px',
                lineHeight: 1.5,
                textAlign: 'left',
              }}
            >
              {lang === "ar" ? (
                <>
                  <strong>الآيباد:</strong> افتح{" "}
                  <code style={{ fontSize: '11px' }}>{ipadUrl}</code>
                  <br />
                  <span style={{ fontSize: '11px' }}>شغّل <code>npm run ipad:lan</code> — المنفذ <strong>5180</strong> (ليس 8000)</span>
                </>
              ) : (
                <>
                  <strong>iPad:</strong> open{" "}
                  <code style={{ fontSize: '11px' }}>{ipadUrl}</code>
                  <br />
                  <span style={{ fontSize: '11px' }}>Run <code>npm run ipad:lan</code> on PC — use port <strong>5180</strong> (not 8000)</span>
                </>
              )}
            </div>
          )}
        </div>
        <form onSubmit={onSubmit} style={{
          borderRadius: '20px',
          border: '1.5px solid var(--gl)',
          background: '#fff',
          padding: '32px',
          boxShadow: '0 8px 24px rgba(74, 122, 90, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '700'}}>
              {lang === "ar" ? "اسم المستخدم" : "Username"}
            </label>
            <input
              style={{
                width: '100%',
                borderRadius: '12px',
                background: '#f7f3ee',
                border: '1.5px solid var(--gl)',
                padding: '10px 14px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--text)',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--g)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gl)'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '700'}}>
              {lang === "ar" ? "كلمة المرور" : "Password"}
            </label>
            <input
              type="password"
              style={{
                width: '100%',
                borderRadius: '12px',
                background: '#f7f3ee',
                border: '1.5px solid var(--gl)',
                padding: '10px 14px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--text)',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--g)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gl)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              borderRadius: '50px',
              background: busy ? 'rgba(74, 122, 90, 0.5)' : 'var(--g)',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(74, 122, 90, 0.35)'
            }}
            onMouseEnter={(e) => !busy && (e.target.style.background = '#2c3e35')}
            onMouseLeave={(e) => !busy && (e.target.style.background = 'var(--g)')}
          >
            {busy ? "…" : lang === "ar" ? "دخول" : "Sign in"}
          </button>
          <p style={{fontSize: '11px', color: 'var(--muted)', textAlign: 'center', fontWeight: '500'}}>
            {lang === "ar" ? "حسابات تجريبية: teacher / sendofficer / caregiver / student — demo1234" : "Demo: teacher, sendofficer, caregiver, student — password demo1234"}
          </p>
        </form>
        <SDGBadges lang={lang} />
        <p style={{textAlign: 'center', fontSize: '14px', color: 'var(--muted)', marginTop: '16px'}}>
          <Link to="/signup" style={{color: 'var(--g)', textDecoration: 'none', fontWeight: '700'}}>
            {lang === "ar" ? "لا تملك حسابًا؟ سجّل الآن" : "Don't have an account? Sign up"}
          </Link>
        </p>
        <p style={{textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '24px'}}>
          <Link to="/unauthorized" style={{color: 'var(--muted)', textDecoration: 'none'}}>
            {lang === "ar" ? "صفحة غير مصرح" : "Unauthorized page"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
