import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANG_EVENT, LANG_STORAGE_KEY } from '../hooks/useLang.js';

export default function Landing() {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('therapist');
  const [demoEmotion, setDemoEmotion] = useState('happy');
  const [speechText, setSpeechText] = useState('');
  const [scrollShadow, setScrollShadow] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANG_STORAGE_KEY) || 'en'); // 'en' or 'ar'

  const persistLang = (lng) => {
    setLanguage(lng);
    localStorage.setItem(LANG_STORAGE_KEY, lng);
    window.dispatchEvent(new Event(LANG_EVENT));
  };

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(LANG_STORAGE_KEY) || 'en');
    window.addEventListener(LANG_EVENT, sync);
    return () => window.removeEventListener(LANG_EVENT, sync);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "ar" ? "ar" : "en";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = {
    en: {
      signIn: 'Sign In',
      getStarted: 'Get Started →',
      whoItFor: 'Who It\'s For',
      howItWorks: 'How It Works',
      features: 'Features',
      demo: 'Demo',
      emotionAware: 'Emotion-Aware AAC System',
      helpingEvery: 'Helping every child',
      findVoice: 'find their voice',
      synapseDescript: 'SyNAPSE uses real-time facial emotion recognition and local AI to generate personalised AAC communication boards — giving nonverbal children a way to communicate that truly understands how they feel.',
      startFree: 'Start Free →',
      seeHow: 'See How It Works',
      liveCamera: 'LIVE CAMERA',
      deepfaceAi: 'DeepFace AI',
      llama: 'LLAMA 3.2',
      localAiFree: 'Local AI, Free',
      realTimeActive: 'Real-time emotion detection active',
      builtEveryone: 'Built for everyone in the journey',
      threeRoles: 'Three different roles, one unified platform',
      therapists: 'Therapists',
      senDept: 'SEN Department',
      caregivers: 'Caregivers',
      sessionAnalytics: 'Session Analytics',
      analyticsDesc: 'View real-time emotion distribution, track which AAC cards the child uses most, and see how emotional state influences communication.',
      aiReports: 'AI-Generated PDF Reports',
      reportsDesc: 'Automatically generate clinical session reports styled like the Communication Matrix — including emotion data, card usage, and AI narrative.',
      childProfile: 'Child Profile Management',
      profileDesc: 'Create and manage detailed child profiles including diagnosis, interests, communication level, and personalised AAC board preferences.',
      commMatrix: 'Communication Matrix Tracking',
      matrixDesc: 'Track each child\'s communication level (1–7) on the Communication Matrix and monitor progress across sessions over time.',
      deptOverview: 'Department Overview',
      overviewDesc: 'Access session reports for all children in your department. Export PDF summaries for IEP meetings, reviews, and EHCP documentation.',
      progressMon: 'Progress Monitoring',
      progressDesc: 'Longitudinal emotion and communication data helps identify patterns, regressions, and areas of growth across the academic year.',
      homeSessions: 'Home Sessions',
      homeDesc: 'Run AAC sessions at home in the same familiar interface the child uses in school — maintaining consistency across environments.',
      sessionSummaries: 'Session Summaries',
      summariesDesc: 'Receive clear, readable session summaries after each session — what emotions were detected, which cards were used, and therapist notes.',
      privacy: 'Privacy Guaranteed',
      privacyDesc: 'No video is ever stored. All processing happens on your device. Your child\'s data never leaves your home network.',
      fourSteps: 'Four steps to',
      meaningful: 'meaningful',
      communication: 'communication',
      wholeSystem: 'The whole system runs on your laptop — no internet needed after setup.',
      cameraDetects: 'Camera detects emotion',
      cameraDesc: 'DeepFace AI analyses the child\'s facial expression every 0.5 seconds — classifying into 7 emotions with confidence scores.',
      llamaGen: 'Llama 3.2 generates cards',
      llamaDesc: 'The local LLM creates 9 personalised AAC cards based on the detected emotion, child\'s age, diagnosis, and interests.',
      childTaps: 'Child taps to communicate',
      tapsDesc: 'The child taps a card. It speaks out loud via the browser\'s built-in Text-to-Speech. Every tap is logged for analytics.',
      pdfGen: 'PDF report generated',
      pdfDesc: 'At session end, click Generate Report. A clinical PDF — styled like the Communication Matrix — downloads automatically.',
      capabilities: 'Capabilities',
      everything: 'Everything you',
      need: 'need',
      nothingDont: 'nothing you don\'t',
      freeLocal: '100% free, 100% local, clinically meaningful.',
      emotionDetection: 'Real-Time Emotion Detection',
      emotionDesc: 'DeepFace CNN at 2fps via WebSocket. 7 emotion classes. Runs on CPU — no GPU needed. First run downloads model weights automatically.',
      localLlm: 'Local LLM — Llama 3.2',
      llamaLocalDesc: 'Ollama runs Llama 3.2 on your laptop. No API key, no subscription, no cloud. 2GB model download once. Personalised to each child.',
      clinicalPdf: 'AI Clinical PDF Reports',
      pdfReportDesc: 'Session reports styled like the Communication Matrix — with emotion tables, AAC card summaries, and AI-written clinical narrative.',
      matrixLevels: 'Communication Matrix Levels',
      levelsDesc: 'Track each child\'s communication level (1–7) mapped to the Communication Matrix framework used by SLPs and SEN departments.',
      threeRole: 'Three Role System',
      roleDesc: 'Therapist, SEN Department, and Caregiver accounts — each with tailored access, appropriate views, and relevant reporting.',
      privacyDesign: 'Privacy by Design',
      designDesc: 'Zero video storage. All AI runs locally. SQLite database stays on your machine. Aligned with UAE Federal Decree-Law No. 45/2021 (PDPL) for child health data.',
      interactive: 'Interactive',
      tryLiveDemo: 'Try the',
      liveDemo: 'live demo',
      clickEmotion: 'Click any emotion to see how the AAC board adapts. Tap the cards to hear them speak.',
      emotionDetector: 'Emotion Detector',
      happy: 'Happy',
      sad: 'Sad',
      fearful: 'Fearful',
      angry: 'Angry',
      surprised: 'Surprised',
      neutral: 'Neutral',
      aacBoard: 'AI-Generated AAC Board',
      adaptedFor: 'Adapted for:',
      age: 'Age 7',
      interests: 'Interests: Animals, Music',
      tapCard: 'Tap a card to hear it speak…',
      ready: 'Ready to give every child',
      readyVoice: 'a voice',
      synapseFree: 'SyNAPSE is 100% free and open-source. No API keys, no subscriptions, no cloud. Runs on any laptop.',
      getStartedBtn: 'Get Started Free',
      copyright: '© SyNAPSE 2026 · BTech Final Year Project · MAHE · SDG 3, 4, 10',
      builtWith: 'Built with 💚 for nonverbal children · DeepFace · Llama 3.2 · FastAPI · SQLite',
    },
    ar: {
      signIn: 'تسجيل الدخول',
      getStarted: '← ابدأ الآن',
      whoItFor: 'من هو موجه إليها',
      howItWorks: 'كيفية العمل',
      features: 'الميزات',
      demo: 'عرض توضيحي',
      emotionAware: 'نظام AAC يدرك المشاعر',
      helpingEvery: 'مساعدة كل طفل على',
      findVoice: 'إيجاد صوتهم',
      synapseDescript: 'يستخدم SyNAPSE التعرف الفوري على المشاعر من الوجه والذكاء الاصطناعي المحلي لإنشاء لوحات AAC مخصصة - مما يعطي الأطفال غير الناطقين طريقة للتواصل تفهم حقاً كيف يشعرون.',
      startFree: '← ابدأ مجاناً',
      seeHow: 'شاهد كيفية العمل',
      liveCamera: 'كاميرا مباشرة',
      deepfaceAi: 'ذكاء DeepFace',
      llama: 'لاما 3.2',
      localAiFree: 'ذكاء محلي، مجاني',
      realTimeActive: 'كشف المشاعر في الوقت الفعلي نشط',
      builtEveryone: 'مبني للجميع في الرحلة',
      threeRoles: 'ثلاث أدوار مختلفة، منصة واحدة موحدة',
      therapists: 'المعالجون',
      senDept: 'قسم التعليم الخاص',
      caregivers: 'مقدمو الرعاية',
      sessionAnalytics: 'تحليلات الجلسة',
      analyticsDesc: 'عرض توزيع المشاعر في الوقت الفعلي، وتتبع بطاقات AAC التي يستخدمها الطفل أكثر، ورؤية كيف تؤثر الحالة العاطفية على التواصل.',
      aiReports: 'تقارير PDF التي ينشئها الذكاء الاصطناعي',
      reportsDesc: 'إنشاء تقارير جلسات سريرية تلقائياً بنمط Communication Matrix - بما في ذلك بيانات المشاعر، ملخصات البطاقات، والسرد السريري بالذكاء الاصطناعي.',
      childProfile: 'إدارة ملف الطفل',
      profileDesc: 'إنشاء وإدارة ملفات تفصيلية للطفل تشمل التشخيص والاهتمامات ومستوى التواصل وتفضيلات لوحة AAC المخصصة.',
      commMatrix: 'تتبع مصفوفة التواصل',
      matrixDesc: 'تتبع مستوى تواصل كل طفل (1-7) على مصفوفة التواصل ومراقبة التقدم عبر الجلسات بمرور الوقت.',
      deptOverview: 'نظرة عامة على القسم',
      overviewDesc: 'قم بالوصول إلى تقارير الجلسات لجميع الأطفال في قسمك. تصدير ملخصات PDF لاجتماعات IEP والمراجعات والتوثيق EHCP.',
      progressMon: 'مراقبة التقدم',
      progressDesc: 'تساعد بيانات المشاعر والتواصل الطولية في تحديد الأنماط والانحدارات ومجالات النمو على مدار السنة الأكاديمية.',
      homeSessions: 'الجلسات المنزلية',
      homeDesc: 'قم بإجراء جلسات AAC في المنزل في نفس الواجهة المألوفة التي يستخدمها الطفل في المدرسة - مع الحفاظ على التناسق عبر البيئات.',
      sessionSummaries: 'ملخصات الجلسة',
      summariesDesc: 'تلقي ملخصات جلسات واضحة وقابلة للقراءة بعد كل جلسة - المشاعر المكتشفة، والبطاقات المستخدمة، وملاحظات المعالج.',
      privacy: 'الخصوصية مضمونة',
      privacyDesc: 'لا يتم تخزين أي فيديو. تتم معالجة جميع الذكاء الاصطناعي محلياً. قاعدة بيانات SQLite تبقى على جهازك. متوافق مع المرسوم بقانون اتحادي رقم 45 لسنة 2021 (حماية البيانات الشخصية) لبيانات صحة الطفل.',
      fourSteps: 'أربع خطوات إلى',
      meaningful: 'تواصل',
      communication: 'ذي مغزى',
      wholeSystem: 'يعمل النظام بأكمله على الكمبيوتر المحمول الخاص بك - لا يوجد إنترنت مطلوب بعد الإعداد.',
      cameraDetects: 'الكاميرا تكتشف المشاعر',
      cameraDesc: 'يقوم ذكاء DeepFace بتحليل تعبير وجه الطفل كل 0.5 ثانية - تصنيفها إلى 7 مشاعر مع درجات الثقة.',
      llamaGen: 'لاما 3.2 توليد البطاقات',
      llamaDesc: 'ينشئ نموذج اللغة المحلي 9 بطاقات AAC مخصصة بناءً على المشاعر المكتشفة وعمر الطفل والتشخيص والاهتمامات.',
      childTaps: 'يضغط الطفل للتواصل',
      tapsDesc: 'يضغط الطفل على بطاقة. تتحدث بصوت عالٍ عبر Text-to-Speech المدمج في المتصفح. يتم تسجيل كل نقرة للتحليلات.',
      pdfGen: 'تم إنشاء تقرير PDF',
      pdfDesc: 'في نهاية الجلسة، انقر على إنشاء التقرير. يتم تنزيل ملف PDF سريري - يصممه Communication Matrix - تلقائياً.',
      capabilities: 'الإمكانيات',
      everything: 'كل ما',
      need: 'تحتاجه',
      nothingDont: 'بلا أي شيء آخر',
      freeLocal: '100% مجاني، 100% محلي، سريرياً ذي مغزى.',
      emotionDetection: 'كشف المشاعر في الوقت الفعلي',
      emotionDesc: 'DeepFace CNN بسرعة 2fps عبر WebSocket. 7 فئات عاطفية. يعمل على وحدة المعالجة المركزية - لا توجد بطاقة GPU مطلوبة. يتم تنزيل أوزان النموذج في البداية تلقائياً.',
      localLlm: 'نموذج لغة محلي - لاما 3.2',
      llamaLocalDesc: 'يعمل Ollama بلاما 3.2 على الكمبيوتر المحمول الخاص بك. لا يوجد مفتاح API، لا اشتراك، لا سحابة. تنزيل نموذج 2GB مرة واحدة. مخصص لكل طفل.',
      clinicalPdf: 'تقارير PDF السريرية بالذكاء الاصطناعي',
      pdfReportDesc: 'تقارير الجلسات المصممة مثل Communication Matrix - مع جداول المشاعر وملخصات بطاقات AAC والسرد السريري المكتوب بالذكاء الاصطناعي.',
      matrixLevels: 'مستويات مصفوفة التواصل',
      levelsDesc: 'تتبع مستوى تواصل كل طفل (1-7) الممapped إلى إطار عمل Communication Matrix الذي يستخدمه SLPs والأقسام الخاصة.',
      threeRole: 'نظام ثلاث أدوار',
      roleDesc: 'حسابات المعالج وقسم التعليم الخاص ومقدم الرعاية - لكل منها وصول مخصص وآراء مناسبة والإبلاغ ذي الصلة.',
      privacyDesign: 'الخصوصية حسب التصميم',
      designDesc: 'صفر تخزين فيديو. يعمل جميع الذكاء الاصطناعي محلياً. قاعدة بيانات SQLite تبقى على جهازك. متوافق مع المرسوم بقانون اتحادي رقم 45 لسنة 2021 (حماية البيانات الشخصية) لبيانات صحة الطفل.',
      interactive: 'تفاعلي',
      tryLiveDemo: 'جرب',
      liveDemo: 'العرض المباشر',
      clickEmotion: 'انقر على أي عاطفة لرؤية كيفية تكيف لوحة AAC. اضغط على البطاقات لسماعها تتحدث.',
      emotionDetector: 'كاشف المشاعر',
      happy: 'سعيد',
      sad: 'حزين',
      fearful: 'خائف',
      angry: 'غاضب',
      surprised: 'مندهش',
      neutral: 'محايد',
      aacBoard: 'لوحة AAC التي ينشئها الذكاء الاصطناعي',
      adaptedFor: 'مكيف ل:',
      age: 'العمر 7',
      interests: 'الاهتمامات: الحيوانات، الموسيقى',
      tapCard: 'اضغط على بطاقة لسماعها تتحدث…',
      ready: 'هل أنت مستعد لمنح كل طفل',
      readyVoice: 'صوتاً',
      synapseFree: 'SyNAPSE مجاني وموضوع مفتوح المصدر بنسبة 100%. لا توجد مفاتيح API، لا اشتراكات، لا سحابة. يعمل على أي كمبيوتر محمول.',
      getStartedBtn: 'ابدأ مجاناً',
      copyright: '© SyNAPSE 2026 · مشروع BTech النهائي · MAHE · SDG 3, 4, 10',
      builtWith: 'تم البناء بـ 💚 للأطفال غير الناطقين · DeepFace · Llama 3.2 · FastAPI · SQLite',
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollShadow(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSpeechText(t[language].tapCard);
  }, [language]);

  const switchRole = (role) => {
    setCurrentRole(role);
  };

  const emotionData = {
    happy: { emoji: '😊', label: t[language].happy, face: '😊', bars: { joy: 95, surprise: 40, neutral: 15 } },
    sad: { emoji: '😢', label: t[language].sad, face: '😢', bars: { sadness: 90, neutral: 30, fear: 20 } },
    fearful: { emoji: '😨', label: t[language].fearful, face: '😨', bars: { fear: 85, surprise: 60, angry: 25 } },
    angry: { emoji: '😠', label: t[language].angry, face: '😠', bars: { angry: 92, neutral: 35, disgust: 55 } },
    surprised: { emoji: '😲', label: t[language].surprised, face: '😲', bars: { surprise: 88, fear: 45, neutral: 25 } },
    neutral: { emoji: '😐', label: t[language].neutral, face: '😐', bars: { neutral: 80, joy: 20, sadness: 15 } },
  };

  const aacCards = {
    happy: [t[language].happy, 'That is funny', 'I like that', 'I want to play', 'That makes me smile', 'I love it', 'Good job', 'Yay!', 'Thank you'],
    sad: [t[language].sad, 'I need a hug', 'I am tired', 'I want to rest', 'That makes me sad', 'I miss...', 'Help me', 'I do not like that', 'Can we stop?'],
    fearful: [t[language].fearful, 'That scares me', 'Help me please', 'I am worried', 'Is it safe?', 'Stay with me', 'I do not understand', 'Go away', 'Protect me'],
    angry: [t[language].angry, 'That is not fair', 'Stop that', 'I do not want to', 'Leave me alone', 'That hurt me', 'I am frustrated', 'No', 'I need space'],
    surprised: [t[language].surprised, 'I did not expect that', 'That is cool', 'Amazing', 'What is that?', 'Tell me more', 'How did you do that?', 'Interesting', 'Show me again'],
    neutral: ['Hello', 'Thank you', 'Please', 'Yes', 'No', 'Help', 'More', 'Stop', 'Okay'],
  };

  const handleCardTap = (text) => {
    setSpeechText(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="landing" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
          --sky: #daeef8;
          --blush: #fce8e0;
          --sun: #fdf0cd;
          --lav: #ede8f8;
          --r: 14px;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: 'Nunito', sans-serif;
          background: var(--cream);
          color: var(--text);
          overflow-x: hidden;
        }
        button {
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
        }
        img {
          display: block;
          max-width: 100%;
        }

        /* ═══ LANG SWITCHER ═══ */
        .lang-switch {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 300;
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-radius: 50px;
          padding: 8px 12px;
          box-shadow: 0 4px 14px rgba(74, 122, 90, 0.2);
        }
        [dir="rtl"] .lang-switch {
          left: 20px;
          right: auto;
        }
        .lang-btn {
          background: transparent;
          border: none;
          font-weight: 700;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--muted);
        }
        .lang-btn.active {
          background: var(--g);
          color: #fff;
        }
        .lang-btn:hover {
          color: var(--g);
        }

        /* ═══ LANDING NAV ═══ */
        #lnav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          background: rgba(250, 252, 249, 0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #d8e8de;
          padding: 0 48px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: box-shadow 0.3s;
        }
        #lnav.s {
          box-shadow: 0 4px 24px rgba(74, 122, 90, 0.1);
        }
        .ln-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .ln-logo-ic {
          width: 52px;
          height: 52px;
          object-fit: contain;
        }
        .ln-logo-t {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: var(--gd);
          font-style: italic;
        }
        .ln-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }
        .ln-links a {
          text-decoration: none;
          color: var(--muted);
          font-weight: 600;
          font-size: 14px;
          transition: color 0.2s;
        }
        .ln-links a:hover {
          color: var(--g);
        }
        .ln-btns {
          display: flex;
          gap: 10px;
        }
        .btn-ghost {
          background: transparent;
          color: var(--g);
          border: 2px solid var(--g);
          border-radius: 50px;
          padding: 8px 20px;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.2s;
        }
        .btn-ghost:hover {
          background: var(--g);
          color: #fff;
        }
        .btn-solid {
          background: var(--g);
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 9px 22px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 4px 14px rgba(74, 122, 90, 0.35);
          transition: all 0.2s;
        }
        .btn-solid:hover {
          background: var(--gd);
          transform: translateY(-1px);
        }

        /* ═══ HERO ═══ */
        #hero {
          min-height: 100vh;
          padding-top: 68px;
          background: var(--cream);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 48px;
          padding-right: 48px;
          gap: 48px;
        }
        @media (max-width: 900px) {
          #hero {
            grid-template-columns: 1fr;
            padding: 100px 24px 60px;
          }
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gp);
          color: var(--g);
          border-radius: 50px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .hero-h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 5.5vw, 72px);
          color: var(--dark);
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .hero-h1 em {
          color: var(--g);
          font-style: italic;
        }
        .hero-p {
          font-size: 17px;
          color: var(--muted);
          line-height: 1.75;
          max-width: 460px;
          margin-bottom: 36px;
        }
        .hero-btns {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .hero-img-wrap {
          position: relative;
          padding: 20px;
        }
        .hero-img-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .hero-photo {
          border-radius: 20px;
          overflow: hidden;
          background: var(--gp);
          aspect-ratio: 3/4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
        }
        .hero-photo.tall {
          grid-row: span 2;
          aspect-ratio: auto;
        }
        .hero-badge {
          position: absolute;
          bottom: 30px;
          left: 10px;
          background: #fff;
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          color: var(--gd);
        }
        [dir="rtl"] .hero-badge {
          left: auto;
          right: 10px;
        }
        .hero-badge-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4CAF50;
          animation: blink 1.5s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ═══ WAVY DIVIDER ═══ */
        .wave {
          width: 100%;
          display: block;
          margin-bottom: -2px;
        }

        /* ═══ ROLES SECTION ═══ */
        #roles {
          background: var(--gd);
          padding: 80px 48px;
        }
        .roles-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .roles-h {
          font-family: 'Playfair Display', serif;
          font-size: clamp(30px, 4vw, 48px);
          color: #fff;
          text-align: center;
          margin-bottom: 12px;
        }
        .roles-sub {
          color: rgba(255, 255, 255, 0.65);
          text-align: center;
          font-size: 16px;
          margin-bottom: 48px;
        }
        .roles-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .rtab {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          padding: 10px 24px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
        }
        .rtab.on, .rtab:hover {
          background: var(--sun);
          color: var(--dark);
          border-color: var(--sun);
        }
        .role-panel {
          display: none;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }
        .role-panel.on {
          display: grid;
        }
        @media (max-width: 700px) {
          .role-panel.on {
            grid-template-columns: 1fr;
          }
        }
        .rcard {
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.2s;
        }
        .rcard:hover {
          background: rgba(255, 255, 255, 0.13);
          transform: translateY(-4px);
        }
        .rcard-icon {
          font-size: 36px;
          margin-bottom: 14px;
        }
        .rcard-title {
          font-size: 17px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .rcard-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.65;
        }

        /* ═══ HOW IT WORKS ═══ */
        #how {
          padding: 80px 48px;
          background: var(--white);
        }
        .how-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .sec-tag {
          display: inline-block;
          background: var(--gp);
          color: var(--g);
          border-radius: 50px;
          padding: 5px 16px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .sec-h {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 4vw, 48px);
          color: var(--dark);
          margin-bottom: 12px;
        }
        .sec-h span {
          color: var(--g);
        }
        .sec-sub {
          font-size: 16px;
          color: var(--muted);
          max-width: 560px;
          line-height: 1.7;
          margin-bottom: 48px;
        }
        .how-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }
        .how-step {
          padding: 28px;
          background: var(--cream);
          border-radius: 20px;
          border: 1.5px solid var(--gl);
          position: relative;
          transition: all 0.2s;
        }
        .how-step:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 36px rgba(74, 122, 90, 0.15);
        }
        .how-num {
          position: absolute;
          top: -14px;
          left: 24px;
          background: var(--g);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }
        .how-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }
        .how-title {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .how-desc {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
        }

        /* ═══ FEATURES ═══ */
        #features {
          padding: 80px 48px;
          background: var(--cream);
        }
        .feat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 800px) {
          .feat-grid {
            grid-template-columns: 1fr;
          }
        }
        .fcard {
          border-radius: 20px;
          padding: 30px 24px;
          transition: all 0.2s;
        }
        .fcard:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
        }
        .fc1 { background: var(--sky); }
        .fc2 { background: var(--blush); }
        .fc3 { background: var(--lav); }
        .fc4 { background: var(--sun); }
        .fc5 { background: #d4f0e8; }
        .fc6 { background: var(--gl); }
        .f-icon {
          font-size: 40px;
          margin-bottom: 14px;
        }
        .f-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
          color: var(--dark);
        }
        .f-desc {
          font-size: 14px;
          color: var(--text);
          line-height: 1.65;
        }

        /* ═══ INTERACTIVE DEMO ═══ */
        #demo {
          background: var(--gd);
          padding: 80px 48px;
          color: #fff;
        }
        .demo-wrap {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 800px) {
          .demo-wrap {
            grid-template-columns: 1fr;
          }
        }
        .demo-box {
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 32px;
        }
        .demo-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          opacity: 0.9;
        }
        .emo-face {
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 54px;
          border: 2.5px solid rgba(255, 255, 255, 0.25);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .emo-lbl {
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-style: italic;
          margin-bottom: 18px;
        }
        .emo-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .ebar {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ebar-lbl {
          width: 70px;
          font-size: 12px;
          font-weight: 600;
          opacity: 0.8;
          text-transform: capitalize;
        }
        .ebar-track {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .ebar-fill {
          height: 100%;
          border-radius: 8px;
          transition: width 0.5s ease;
          background: var(--sun);
        }
        .ebar-pct {
          width: 32px;
          font-size: 12px;
          font-weight: 700;
          text-align: right;
          opacity: 0.8;
        }
        .emo-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .ebtn {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ebtn.on, .ebtn:hover {
          background: var(--sun);
          color: var(--dark);
          border-color: var(--sun);
        }
        .aac-ctx {
          font-size: 12px;
          opacity: 0.55;
          margin-bottom: 18px;
          font-style: italic;
        }
        .daac-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .daac {
          background: rgba(255, 255, 255, 0.1);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          padding: 14px 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }
        .daac:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        .d-speech {
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          min-height: 44px;
          font-style: italic;
          opacity: 0.75;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* ═══ CTA ═══ */
        #cta {
          background: linear-gradient(135deg, var(--g), var(--gd));
          padding: 80px 48px;
          text-align: center;
        }
        .cta-h {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 4vw, 52px);
          color: #fff;
          margin-bottom: 16px;
        }
        .cta-h em {
          color: var(--sun);
          font-style: italic;
        }
        .cta-p {
          color: rgba(255, 255, 255, 0.75);
          font-size: 17px;
          max-width: 520px;
          margin: 0 auto 36px;
          line-height: 1.7;
        }
        .cta-btns {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-wh {
          background: #fff;
          color: var(--g);
          border: none;
          border-radius: 50px;
          padding: 14px 36px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          transition: all 0.2s;
        }
        .btn-wh:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
        }
        .btn-ow {
          background: transparent;
          color: #fff;
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 50px;
          padding: 14px 36px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ow:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #fff;
        }

        /* ═══ FOOTER ═══ */
        footer {
          background: var(--dark);
          color: rgba(255, 255, 255, 0.55);
          padding: 48px;
          font-size: 13px;
        }
        .foot-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        @media (max-width: 700px) {
          #lnav {
            padding: 0 20px;
          }
          .ln-links {
            display: none;
          }
          #roles, #how, #features, #demo, #cta {
            padding: 60px 20px;
          }
        }
      `}</style>

      {/* Language Switcher */}
      <div className="lang-switch">
        <button 
          className={`lang-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => persistLang('en')}
        >
          EN
        </button>
        <span style={{color: 'var(--muted)', fontWeight: '700'}}>|</span>
        <button 
          className={`lang-btn ${language === 'ar' ? 'active' : ''}`}
          onClick={() => persistLang('ar')}
        >
          AR
        </button>
      </div>

      <nav id="lnav" className={scrollShadow ? 's' : ''}>
        <a className="ln-logo" href="#landing">
          <img className="ln-logo-ic" src="/synapse-logo.png" alt="SyNAPSE logo" />
          <span className="ln-logo-t">SyNAPSE</span>
        </a>
        <ul className="ln-links">
          <li><a href="#roles">{t[language].whoItFor}</a></li>
          <li><a href="#how">{t[language].howItWorks}</a></li>
          <li><a href="#features">{t[language].features}</a></li>
          <li><a href="#demo">{t[language].demo}</a></li>
        </ul>
        <div className="ln-btns">
          <button className="btn-ghost" onClick={() => navigate('/login')}>{t[language].signIn}</button>
          <button className="btn-solid" onClick={() => navigate('/signup')}>{t[language].getStarted}</button>
        </div>
      </nav>

      {/* HERO */}
      <div id="hero">
        <div>
          <div className="hero-tag">🌱 {t[language].emotionAware}</div>
          <h1 className="hero-h1">{t[language].helpingEvery}<br/><em>{t[language].findVoice}</em></h1>
          <p className="hero-p">{t[language].synapseDescript}</p>
          <div className="hero-btns">
            <button className="btn-solid" style={{padding:'13px 32px',fontSize:'15px'}} onClick={() => navigate('/signup')}>{t[language].startFree}</button>
            <button className="btn-ghost" style={{padding:'12px 28px',fontSize:'15px'}} onClick={() => document.getElementById('how').scrollIntoView({behavior:'smooth'})}>{t[language].seeHow}</button>
          </div>
        </div>
        <div className="hero-img-wrap">
          <div className="hero-img-grid">
            <div className="hero-photo tall" style={{background:'var(--gp)'}}>
              <svg viewBox="0 0 200 300" width="160" xmlns="http://www.w3.org/2000/svg">
                <rect x="40" y="160" width="120" height="120" rx="10" fill="#b5d5bf"/>
                <circle cx="100" cy="90" r="50" fill="#f5d5b0"/>
                <path d="M60,80 Q70,55 100,60 Q130,55 140,80" fill="#c8853a"/>
                <rect x="30" y="180" width="140" height="80" rx="8" fill="#4a7a5a"/>
                <rect x="60" y="200" width="80" height="50" rx="6" fill="#fff" opacity="0.9"/>
                <text x="100" y="220" textAnchor="middle" fontSize="20">😊</text>
                <text x="100" y="240" textAnchor="middle" fontSize="10" fill="#4a7a5a" fontWeight="bold">{t[language].happy}</text>
              </svg>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div className="hero-photo" style={{background:'var(--sky)',aspectRatio:'1',alignItems:'center',justifyContent:'center'}}>
                <svg viewBox="0 0 120 120" width="100" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="100" height="100" rx="14" fill="#fff" opacity="0.7"/>
                  <text x="60" y="52" textAnchor="middle" fontSize="28">📷</text>
                  <text x="60" y="75" textAnchor="middle" fontSize="10" fill="#4a7a5a" fontWeight="bold">{t[language].liveCamera}</text>
                  <text x="60" y="90" textAnchor="middle" fontSize="9" fill="#7a8a80">{t[language].deepfaceAi}</text>
                </svg>
              </div>
              <div className="hero-photo" style={{background:'var(--blush)',aspectRatio:'1'}}>
                <svg viewBox="0 0 120 120" width="100" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="100" height="100" rx="14" fill="#fff" opacity="0.7"/>
                  <text x="60" y="50" textAnchor="middle" fontSize="28">🦙</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#4a7a5a" fontWeight="bold">{t[language].llama}</text>
                  <text x="60" y="87" textAnchor="middle" fontSize="9" fill="#7a8a80">{t[language].localAiFree}</text>
                </svg>
              </div>
            </div>
          </div>
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            {t[language].realTimeActive}
          </div>
        </div>
      </div>

      {/* WAVY DIVIDER */}
      <svg className="wave" viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#2c3e35"/>
      </svg>

      {/* ═══ ROLES SECTION ═══ */}
      <section id="roles">
        <div className="roles-inner">
          <h2 className="roles-h">{t[language].builtEveryone}</h2>
          <p className="roles-sub">{t[language].threeRoles}</p>
          <div className="roles-tabs">
            <button className={`rtab ${currentRole === 'therapist' ? 'on' : ''}`} onClick={() => switchRole('therapist')}>🧑‍⚕️ {t[language].therapists}</button>
            <button className={`rtab ${currentRole === 'sen' ? 'on' : ''}`} onClick={() => switchRole('sen')}>🏫 {t[language].senDept}</button>
            <button className={`rtab ${currentRole === 'caregiver' ? 'on' : ''}`} onClick={() => switchRole('caregiver')}>❤️ {t[language].caregivers}</button>
          </div>

          {currentRole === 'therapist' && (
            <div className="role-panel on">
              <div className="rcard"><div className="rcard-icon">📊</div><div className="rcard-title">{t[language].sessionAnalytics}</div><div className="rcard-desc">{t[language].analyticsDesc}</div></div>
              <div className="rcard"><div className="rcard-icon">📄</div><div className="rcard-title">{t[language].aiReports}</div><div className="rcard-desc">{t[language].reportsDesc}</div></div>
              <div className="rcard"><div className="rcard-icon">🧒</div><div className="rcard-title">{t[language].childProfile}</div><div className="rcard-desc">{t[language].profileDesc}</div></div>
            </div>
          )}

          {currentRole === 'sen' && (
            <div className="role-panel on">
              <div className="rcard"><div className="rcard-icon">📋</div><div className="rcard-title">{t[language].commMatrix}</div><div className="rcard-desc">{t[language].matrixDesc}</div></div>
              <div className="rcard"><div className="rcard-icon">🏫</div><div className="rcard-title">{t[language].deptOverview}</div><div className="rcard-desc">{t[language].overviewDesc}</div></div>
              <div className="rcard"><div className="rcard-icon">📈</div><div className="rcard-title">{t[language].progressMon}</div><div className="rcard-desc">{t[language].progressDesc}</div></div>
            </div>
          )}

          {currentRole === 'caregiver' && (
            <div className="role-panel on">
              <div className="rcard"><div className="rcard-icon">🏠</div><div className="rcard-title">{t[language].homeSessions}</div><div className="rcard-desc">{t[language].homeDesc}</div></div>
              <div className="rcard"><div className="rcard-icon">💌</div><div className="rcard-title">{t[language].sessionSummaries}</div><div className="rcard-desc">{t[language].summariesDesc}</div></div>
              <div className="rcard"><div className="rcard-icon">🔒</div><div className="rcard-title">{t[language].privacy}</div><div className="rcard-desc">{t[language].privacyDesc}</div></div>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="how-inner">
          <span className="sec-tag">{t[language].howItWorks}</span>
          <h2 className="sec-h">{t[language].fourSteps} <span>{t[language].meaningful}</span> {t[language].communication}</h2>
          <p className="sec-sub">{t[language].wholeSystem}</p>
          <div className="how-steps">
            <div className="how-step"><div className="how-num">1</div><div className="how-icon">📷</div><div className="how-title">{t[language].cameraDetects}</div><div className="how-desc">{t[language].cameraDesc}</div></div>
            <div className="how-step"><div className="how-num">2</div><div className="how-icon">🦙</div><div className="how-title">{t[language].llamaGen}</div><div className="how-desc">{t[language].llamaDesc}</div></div>
            <div className="how-step"><div className="how-num">3</div><div className="how-icon">🃏</div><div className="how-title">{t[language].childTaps}</div><div className="how-desc">{t[language].tapsDesc}</div></div>
            <div className="how-step"><div className="how-num">4</div><div className="how-icon">📄</div><div className="how-title">{t[language].pdfGen}</div><div className="how-desc">{t[language].pdfDesc}</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="how-inner">
          <span className="sec-tag">{t[language].capabilities}</span>
          <h2 className="sec-h">{t[language].everything} <span>{t[language].need}</span>, {t[language].nothingDont}</h2>
          <p className="sec-sub">{t[language].freeLocal}</p>
          <div className="feat-grid">
            <div className="fcard fc1"><div className="f-icon">🎭</div><div className="f-title">{t[language].emotionDetection}</div><div className="f-desc">{t[language].emotionDesc}</div></div>
            <div className="fcard fc2"><div className="f-icon">🦙</div><div className="f-title">{t[language].localLlm}</div><div className="f-desc">{t[language].llamaLocalDesc}</div></div>
            <div className="fcard fc3"><div className="f-icon">📄</div><div className="f-title">{t[language].clinicalPdf}</div><div className="f-desc">{t[language].pdfReportDesc}</div></div>
            <div className="fcard fc4"><div className="f-icon">🗂️</div><div className="f-title">{t[language].matrixLevels}</div><div className="f-desc">{t[language].levelsDesc}</div></div>
            <div className="fcard fc5"><div className="f-icon">👥</div><div className="f-title">{t[language].threeRole}</div><div className="f-desc">{t[language].roleDesc}</div></div>
            <div className="fcard fc6"><div className="f-icon">🔒</div><div className="f-title">{t[language].privacyDesign}</div><div className="f-desc">{t[language].designDesc}</div></div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <section id="demo">
        <div className="demo-wrap">
          <div>
            <span className="sec-tag" style={{background:'rgba(255,255,255,.15)',color:'var(--sun)'}}>{t[language].interactive}</span>
            <h2 className="sec-h" style={{color:'#fff',marginTop:'8px'}}>{t[language].tryLiveDemo} <span style={{color:'var(--sun)'}}>{t[language].liveDemo}</span></h2>
            <p style={{color:'rgba(255,255,255,.65)',fontSize:'15px',lineHeight:'1.7',marginTop:'10px'}}>{t[language].clickEmotion}</p>
            <div className="demo-box" style={{marginTop:'28px'}}>
              <div className="demo-title">🎭 {t[language].emotionDetector}</div>
              <div className="emo-face">{emotionData[demoEmotion].face}</div>
              <div className="emo-lbl">{emotionData[demoEmotion].label}</div>
              <div className="emo-bars">
                {Object.entries(emotionData[demoEmotion].bars).map(([label, value]) => (
                  <div key={label} className="ebar">
                    <div className="ebar-lbl">{label}</div>
                    <div className="ebar-track"><div className="ebar-fill" style={{width:`${value}%`}}></div></div>
                    <div className="ebar-pct">{value}%</div>
                  </div>
                ))}
              </div>
              <div className="emo-btns">
                {['happy', 'sad', 'fearful', 'angry', 'surprised', 'neutral'].map(emo => (
                  <button key={emo} className={`ebtn ${demoEmotion === emo ? 'on' : ''}`} onClick={() => setDemoEmotion(emo)}>
                    {emotionData[emo].emoji} {emotionData[emo].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="demo-box">
            <div className="demo-title">🃏 {t[language].aacBoard}</div>
            <div className="aac-ctx">{t[language].adaptedFor} {emotionData[demoEmotion].label} · {t[language].age} · {t[language].interests}</div>
            <div className="daac-grid">
              {aacCards[demoEmotion].map((card, idx) => (
                <div key={idx} className="daac" onClick={() => handleCardTap(card)}>
                  <div className="daac-lbl">{card}</div>
                </div>
              ))}
            </div>
            <div className="d-speech">{speechText}</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <h2 className="cta-h">{t[language].ready}<br/>{t[language].readyVoice}?</h2>
        <p className="cta-p">{t[language].synapseFree}</p>
        <div className="cta-btns">
          <button className="btn-wh" onClick={() => navigate('/signup')}>🚀 {t[language].getStartedBtn}</button>
          <button className="btn-ow" onClick={() => navigate('/login')}>{t[language].signIn} →</button>
        </div>
      </section>

      <footer>
        <div className="foot-inner">
          <span>{t[language].copyright}</span>
          <span>{t[language].builtWith}</span>
        </div>
      </footer>
    </div>
  );
}
