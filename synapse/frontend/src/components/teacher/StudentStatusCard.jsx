import StatusBadge from "./StatusBadge";

export default function StudentStatusCard({ student, onViewProfile, onStartSession, onViewReport }) {
  const formatDate = (date) => {
    if (!date) return "Never";
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    const days = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        borderRadius: "16px",
        border: "1.5px solid #e0e8e4",
        background: "#fff",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        transition: "all 0.2s",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(74, 122, 90, 0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(74, 122, 90, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div>
            <div style={{ fontWeight: "800", color: "#1e2d26", fontSize: "16px" }}>
              {student.name}
            </div>
            <div style={{ fontSize: "13px", color: "#7a8a80", marginTop: "2px" }}>
              Age {student.age} · Last: {formatDate(student.last_session_at)}
            </div>
          </div>
          <div style={{ marginLeft: "12px" }}>
            <StatusBadge status={student.status} label={student.status_label} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginTop: "12px",
            fontSize: "12px",
          }}
        >
          <div>
            <div style={{ color: "#7a8a80", marginBottom: "2px" }}>Baseline Mean</div>
            <div style={{ fontWeight: "700", color: "#1e2d26" }}>
              {student.baseline_mean}
            </div>
          </div>
          <div>
            <div style={{ color: "#7a8a80", marginBottom: "2px" }}>Std Dev</div>
            <div style={{ fontWeight: "700", color: "#1e2d26" }}>
              {student.baseline_std}
            </div>
          </div>
          <div>
            <div style={{ color: "#7a8a80", marginBottom: "2px" }}>Signal Score</div>
            <div style={{ fontWeight: "700", color: "#1e2d26" }}>
              {(student.signal_score * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: "120px",
        }}
      >
        <button
          onClick={onStartSession}
          style={{
            borderRadius: "12px",
            background: "#4a7a5a",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2c3e35";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#4a7a5a";
          }}
        >
          Start Session
        </button>
        <button
          onClick={onViewProfile}
          style={{
            borderRadius: "12px",
            border: "1.5px solid #e0e8e4",
            background: "transparent",
            color: "#3a4a40",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f7fb";
            e.currentTarget.style.borderColor = "#4a7a5a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e0e8e4";
          }}
        >
          View Profile
        </button>
        <button
          onClick={onViewReport}
          style={{
            borderRadius: "12px",
            border: "1.5px solid #e0e8e4",
            background: "transparent",
            color: "#3a4a40",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f7fb";
            e.currentTarget.style.borderColor = "#4a7a5a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e0e8e4";
          }}
        >
          View Report
        </button>
      </div>
    </div>
  );
}
