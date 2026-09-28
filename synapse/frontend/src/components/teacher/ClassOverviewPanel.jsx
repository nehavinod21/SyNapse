export default function ClassOverviewPanel({ avgEngagement, sessionsThisWeek, studentsProgress, total }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "24px",
        marginTop: "24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "20px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
      }}
    >
      <div>
        <div style={{ fontSize: "12px", color: "#7a8a80", fontWeight: "600", marginBottom: "8px" }}>
          Avg Engagement
        </div>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "#4a7a5a" }}>
          {avgEngagement.toFixed(1)}
          <span style={{ fontSize: "14px", marginLeft: "4px", color: "#7a8a80" }}>/10</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", color: "#7a8a80", fontWeight: "600", marginBottom: "8px" }}>
          Sessions This Week
        </div>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "#ffa726" }}>
          {sessionsThisWeek}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", color: "#7a8a80", fontWeight: "600", marginBottom: "8px" }}>
          Making Progress
        </div>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "#81c784" }}>
          {studentsProgress}
          <span style={{ fontSize: "14px", marginLeft: "4px", color: "#7a8a80" }}>/{total}</span>
        </div>
      </div>
    </div>
  );
}
