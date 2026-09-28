export default function SignalIntensityCard({ signal, baselineMean, baselineStd, zScore }) {
  const intensityPercent = Math.min(100, Math.max(0, signal * 100));
  const intensityColor = intensityPercent > 70 ? "#ef5350" : intensityPercent > 40 ? "#ffa726" : "#81c784";

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
        Signal Intensity
      </h3>

      {/* Progress bar */}
      <div style={{marginBottom: "16px"}}>
        <div
          style={{
            height: "24px",
            background: "#f0f0f0",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${intensityPercent}%`,
              background: intensityColor,
              transition: "width 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {intensityPercent > 5 && `${Math.round(intensityPercent)}%`}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          fontSize: "12px",
        }}
      >
        <div>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Signal Value</div>
          <div style={{fontWeight: "700", color: "#1e2d26"}}>
            {(signal * 10).toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Z-Score</div>
          <div style={{fontWeight: "700", color: "#1e2d26"}}>
            {zScore > 0 ? "+" : ""}{zScore.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Baseline Mean</div>
          <div style={{fontWeight: "700", color: "#1e2d26"}}>
            {baselineMean.toFixed(1)}
          </div>
        </div>
        <div>
          <div style={{color: "#7a8a80", marginBottom: "2px"}}>Std Dev</div>
          <div style={{fontWeight: "700", color: "#1e2d26"}}>
            {baselineStd.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
