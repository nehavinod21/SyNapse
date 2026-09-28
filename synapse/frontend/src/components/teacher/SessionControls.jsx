export default function SessionControls({ onPause, onNextTurn, onEnd, isLoading = false }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
        display: "flex",
        gap: "12px",
      }}
    >
      <button
        onClick={onPause}
        disabled={isLoading}
        style={{
          flex: 1,
          borderRadius: "12px",
          border: "1.5px solid #ffa726",
          background: "transparent",
          color: "#ffa726",
          padding: "12px 16px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#fff3e0";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        ⏸ Pause
      </button>

      <button
        onClick={onNextTurn}
        disabled={isLoading}
        style={{
          flex: 1,
          borderRadius: "12px",
          border: "1.5px solid #29b6f6",
          background: "transparent",
          color: "#29b6f6",
          padding: "12px 16px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#e1f5fe";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        ➜ Next Turn
      </button>

      <button
        onClick={onEnd}
        disabled={isLoading}
        style={{
          flex: 1,
          borderRadius: "12px",
          border: "1.5px solid #ef5350",
          background: "transparent",
          color: "#ef5350",
          padding: "12px 16px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#ffebee";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        ✕ End
      </button>
    </div>
  );
}
