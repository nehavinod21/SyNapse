export default function TurnCounterCard({ turnIndex, turnTarget, durationSeconds, engagementScore }) {
  const durationMinutes = Math.floor(durationSeconds / 60);
  const durationSeconds_ = durationSeconds % 60;

  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
        flex: 1,
      }}
    >
      <h3 style={{fontSize: "13px", fontWeight: "700", color: "#1e2d26", marginBottom: "16px"}}>
        Conversation Progress
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          fontSize: "12px",
        }}
      >
        <div>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Turn</div>
          <div style={{fontWeight: "700", color: "#1e2d26", fontSize: "18px"}}>
            {turnIndex} / {turnTarget}
          </div>
        </div>
        <div>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Duration</div>
          <div style={{fontWeight: "700", color: "#1e2d26", fontSize: "18px"}}>
            {durationMinutes}:{String(durationSeconds_).padStart(2, "0")}
          </div>
        </div>
        <div style={{gridColumn: "1 / -1"}}>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Engagement Score</div>
          <div
            style={{
              fontWeight: "700",
              color: "#4a7a5a",
              fontSize: "20px",
            }}
          >
            {engagementScore.toFixed(1)} / 10
          </div>
        </div>
      </div>
    </div>
  );
}
