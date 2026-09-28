import { Link } from "react-router-dom";
import { useLang } from "../hooks/useLang.js";

export default function Unauthorized() {
  const { lang } = useLang();
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
      textAlign: 'center'
    }}>
      <style>{`
        :root {
          --g: #4a7a5a;
          --gd: #2c3e35;
          --cream: #f7f3ee;
          --text: #3a4a40;
          --muted: #7a8a80;
          --gl: #b5d5bf;
        }
      `}</style>
      <div style={{maxWidth: '480px'}}>
        <h1 style={{fontSize: '48px', fontWeight: '800', color: '#c97316', marginBottom: '12px'}}>
          {lang === "ar" ? "غير مصرح" : "Unauthorized"}
        </h1>
        <p style={{color: 'var(--muted)', maxWidth: '360px', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6', margin: '0 auto 32px'}}>
          {lang === "ar" ? "لا تملك صلاحية الوصول إلى هذه الصفحة." : "You do not have access to this area."}
        </p>
        <Link 
          to="/login" 
          style={{
            color: '#fff',
            textDecoration: 'none',
            padding: '12px 32px',
            background: 'var(--g)',
            borderRadius: '50px',
            fontWeight: '700',
            fontSize: '15px',
            display: 'inline-block',
            boxShadow: '0 4px 14px rgba(74, 122, 90, 0.35)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--gd)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--g)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {lang === "ar" ? "العودة لتسجيل الدخول" : "Back to login"}
        </Link>
      </div>
    </div>
  );
}
