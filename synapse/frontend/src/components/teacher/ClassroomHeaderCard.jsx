export default function ClassroomHeaderCard({ classroom, sessionActive, currentTime, onStartClass }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        background: "linear-gradient(135deg, #4a7a5a 0%, #2c3e35 100%)",
        color: "#fff",
        padding: "28px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "24px",
        boxShadow: "0 8px 24px rgba(74, 122, 90, 0.15)",
      }}
    >
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>
          {classroom}
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            opacity: 0.95,
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: sessionActive ? "#81c784" : "#bdbdbd",
            }}
          />
          <span>Session: {sessionActive ? "ACTIVE" : "Inactive"}</span>
          <span>•</span>
          <span>{currentTime}</span>
        </div>
      </div>
      <button
        onClick={onStartClass}
        style={{
          borderRadius: "12px",
          background: "#fff",
          color: "#4a7a5a",
          border: "none",
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: "700",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Try Emotion Detection
      </button>
    </div>
  );
}
