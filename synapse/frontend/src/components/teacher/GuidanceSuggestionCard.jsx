import { X } from "lucide-react";

export default function GuidanceSuggestionCard({ suggestion, onUse, onDismiss }) {
  return (
    <div
      style={{
        borderRadius: "14px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{flex: 1}}>
          <div style={{fontSize: "12px", color: "#7a8a80", fontWeight: "600", marginBottom: "4px"}}>
            {suggestion.type}
          </div>
          <div style={{fontSize: "13px", color: "#3a4a40", lineHeight: "1.4"}}>
            {suggestion.text}
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#7a8a80",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#4a7a5a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#7a8a80";
          }}
        >
          <X size={16} />
        </button>
      </div>

      <button
        onClick={onUse}
        style={{
          borderRadius: "10px",
          background: "#4a7a5a",
          color: "#fff",
          border: "none",
          padding: "8px 12px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s",
          width: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#2c3e35";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#4a7a5a";
        }}
      >
        Use This
      </button>
    </div>
  );
}
