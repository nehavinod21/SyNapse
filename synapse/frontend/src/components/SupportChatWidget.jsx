import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import api from "../api/axios.js";

const SUGGESTIONS = [
  "What is SyNAPSE?",
  "How do alerts work?",
  "Is video data stored?",
  "Who can use this system?",
];

function localFaqAnswer(message) {
  const q = String(message || "").toLowerCase();
  if (q.includes("what is synapse") || q.includes("about") || q.includes("project")) {
    return "SyNAPSE is an emotion-aware AAC platform for minimally verbal neurodiverse children. It helps children communicate using adaptive bilingual cards and supports teachers, caregivers, and SEND officers.";
  }
  if (q.includes("who can use") || q.includes("roles") || q.includes("users")) {
    return "SyNAPSE supports 4 roles: Student, Teacher, Caregiver, and SEND Officer. Each role has a dedicated dashboard and workflow.";
  }
  if (q.includes("video") || q.includes("privacy") || q.includes("data stored")) {
    return "No, SyNAPSE does not permanently store camera images or video. Frames are processed temporarily for emotion detection, then discarded. Only session metadata is logged.";
  }
  if (q.includes("alert")) {
    return "Alerts are sent when cautious emotions (sad, angry, fear, disgust) are detected with confidence >= 0.45. Teacher gets alerts in school sessions, caregiver in home sessions.";
  }
  if (q.includes("tech") || q.includes("stack") || q.includes("built")) {
    return "SyNAPSE is built with FastAPI, React, SQLite, DeepFace, Ollama (Llama 3), WebSockets, and ReportLab. It also supports PWA and Android packaging.";
  }
  return "I can help with project questions about features, roles, alerts, privacy, reports, and tech stack. Try: 'How do alerts work?'";
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I am the SyNAPSE support bot. Ask me anything about this project.",
    },
  ]);

  const sendMessage = async (raw) => {
    const msg = (raw ?? input).trim();
    if (!msg || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/support/chat", { message: msg });
      setMessages((prev) => [...prev, { role: "bot", text: data?.answer || "I could not find an answer right now." }]);
    } catch {
      const fallback = localFaqAnswer(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `${fallback}\n\n(Offline support mode: backend chat is temporarily unavailable.)`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      {open ? (
        <div className="w-[340px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-[#1a3a5c] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <img src="/synapse-logo.png" alt="SyNAPSE logo" className="h-6 w-6 object-contain" />
              <div className="text-sm font-semibold">SyNAPSE Support</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10">
              <X size={16} />
            </button>
          </div>

          <div className="h-80 overflow-y-auto bg-slate-50 p-3 space-y-2">
            {messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}`}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-[#4a7a5a] text-white"
                    : "mr-auto bg-white border border-slate-200 text-slate-700"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[90%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-2">
            <div className="mb-2 flex flex-wrap gap-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask about this project..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#4a7a5a]"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#4a7a5a] text-white disabled:opacity-60"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-4 py-3 text-white shadow-lg hover:bg-[#234f7e]"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-semibold">Need help?</span>
        </button>
      )}
    </div>
  );
}

