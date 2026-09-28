import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import SDGBadges from "../components/SDGBadges.jsx";
import { useLang } from "../hooks/useLang.js";

function roleLabel(role, lang) {
  switch (role) {
    case "student":
      return lang === "ar" ? "طالب" : "Student";
    case "teacher":
      return lang === "ar" ? "معلم" : "Teacher";
    case "send_officer":
      return lang === "ar" ? "ضابط إرسال" : "Send officer";
    case "caregiver":
      return lang === "ar" ? "ولي أمر" : "Caregiver";
    default:
      return role;
  }
}

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLang();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(lang === "ar" ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        username,
        email,
        password,
        full_name: fullName,
        role,
      };
      await api.post("/auth/register", payload);
      toast.success(lang === "ar" ? "تم التسجيل بنجاح" : "Registered successfully");
      await login(username, password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const axiosMessage = err?.response?.data?.detail;
      const message =
        typeof axiosMessage === "string"
          ? axiosMessage
          : err instanceof Error
          ? err.message
          : String(err);
      toast.error(message || (lang === "ar" ? "فشل التسجيل" : "Registration failed"));
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
              ? "أنشئ حسابًا جديدًا لتخزين تسجيلات المستخدم"
              : "Create a new account to store credentials"}
          </p>
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
              {lang === "ar" ? "البريد الإلكتروني" : "Email"} (Optional)
            </label>
            <input
              type="text"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '700'}}>
              {lang === "ar" ? "الاسم الكامل" : "Full name"}
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '700'}}>
              {lang === "ar" ? "الدور" : "Role"}
            </label>
            <select
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
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--g)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gl)'}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="student">{roleLabel("student", lang)}</option>
              <option value="teacher">{roleLabel("teacher", lang)}</option>
              <option value="send_officer">{roleLabel("send_officer", lang)}</option>
              <option value="caregiver">{roleLabel("caregiver", lang)}</option>
            </select>
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
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label style={{display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '700'}}>
              {lang === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
            {busy ? "…" : lang === "ar" ? "تسجيل" : "Sign up"}
          </button>
        </form>
        <SDGBadges lang={lang} />
        <p style={{textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '32px'}}>
          <Link to="/login" style={{color: 'var(--g)', textDecoration: 'none', fontWeight: '700'}}>
            {lang === "ar" ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
