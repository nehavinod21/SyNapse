import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";

export default function EmotionAlertBanner({ alert, lang, onDismiss, onAcknowledge }) {
  if (!alert) return null;

  const message = lang === "ar" ? alert.message_ar : alert.message_en;
  const path =
    alert.recipient_role === "caregiver"
      ? `/caregiver/sessions/${alert.session_id}/live`
      : `/teacher/sessions/${alert.session_id}/live`;

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-start gap-3 rounded-2xl border-2 border-amber-500 bg-amber-50 px-4 py-3 shadow-sm"
    >
      <AlertTriangle className="h-6 w-6 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-amber-950">
          {lang === "ar" ? "تنبيه عاطفي فوري" : "Immediate emotion alert"}
        </p>
        <p className="mt-1 text-sm font-medium text-amber-900">{message}</p>
        <p className="mt-2 text-xs text-amber-800">
          {lang === "ar"
            ? "شجّع الطفل على استخدام بطاقات AAC للتواصل."
            : "Encourage the child to use AAC cards to communicate."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to={path}
            state={{ childId: alert.child_id, sessionId: alert.session_id }}
            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            {lang === "ar" ? "فتح الجلسة / البطاقات" : "Open session & AAC cards"}
          </Link>
          <button
            type="button"
            onClick={onAcknowledge}
            className="rounded-xl border border-amber-600 bg-white px-3 py-2 text-xs font-bold text-amber-900"
          >
            {lang === "ar" ? "اطّلاع + طمأنة الطالب" : "Acknowledge & reassure student"}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-amber-800 hover:bg-amber-100"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
