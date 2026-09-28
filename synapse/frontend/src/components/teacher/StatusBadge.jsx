export default function StatusBadge({ status, label }) {
  const colors = {
    ready: { bg: "#e8f5e9", color: "#2e7d32", border: "#81c784" },
    needs_support: { bg: "#fff3e0", color: "#e65100", border: "#ffb74d" },
    needs_immediate_support: { bg: "#ffebee", color: "#c62828", border: "#ef5350" },
  };

  const style = colors[status] || colors.ready;

  return (
    <div
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: "14px",
        fontSize: "12px",
        fontWeight: "600",
        backgroundColor: style.bg,
        color: style.color,
        border: `1.5px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}
