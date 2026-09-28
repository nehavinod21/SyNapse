export default function MetricStatCard({ label, value, unit = "", icon: Icon = null, color = "#4a7a5a" }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
      }}
    >
      {Icon && (
        <div style={{ fontSize: "28px", color, opacity: 0.8 }}>
          <Icon size={28} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", color: "#7a8a80", fontWeight: "500", marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e2d26" }}>
          {value}
          {unit && <span style={{ fontSize: "14px", marginLeft: "4px", color: "#7a8a80" }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
}
