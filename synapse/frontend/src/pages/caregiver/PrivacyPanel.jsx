import Navbar from "../../components/Navbar.jsx";
import { useLang } from "../../hooks/useLang.js";

export default function PrivacyPanel() {
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
      `}</style>
      <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream)'}}>
        <Navbar title={lang === "ar" ? "الخصوصية" : "Privacy"} />
        <div style={{maxWidth: '700px', margin: '0 auto', padding: '32px 24px', width: '100%'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{borderRadius: '16px', border: '1.5px solid var(--gl)', background: '#fff', padding: '24px', boxShadow: '0 2px 8px rgba(74, 122, 90, 0.08)'}}>
              <h2 style={{fontSize: '18px', fontWeight: '800', color: 'var(--dark)', marginBottom: '12px'}}>{lang === "ar" ? "تخزين الكاميرا" : "Camera Storage"}</h2>
              <p style={{color: 'var(--text)', fontSize: '15px', lineHeight: '1.6'}}>
                {lang === "ar"
                  ? "لا يخزن SyNAPSE صور الكاميرا بشكل دائم. يتم تحليل المشاعر محلياً عبر النموذج، وتُسجَّل الملخصات فقط."
                  : "SyNAPSE does not permanently store camera images. Emotion analysis runs locally; only summaries are logged."}
              </p>
            </div>
            <div style={{borderRadius: '16px', border: '1.5px solid var(--gl)', background: '#fff', padding: '24px', boxShadow: '0 2px 8px rgba(74, 122, 90, 0.08)'}}>
              <h2 style={{fontSize: '18px', fontWeight: '800', color: 'var(--dark)', marginBottom: '12px'}}>{lang === "ar" ? "بيانات المستخدم" : "User Data"}</h2>
              <p style={{color: 'var(--text)', fontSize: '15px', lineHeight: '1.6'}}>
                {lang === "ar"
                  ? "البيانات تبقى على جهاز التطوير الخاص بك (SQLite) ويمكن نقلها بمسؤولية وفق سياسات المدرسة وولي الأمر."
                  : "Data stays on your developer machine (SQLite) and should be handled per school and caregiver policies."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
