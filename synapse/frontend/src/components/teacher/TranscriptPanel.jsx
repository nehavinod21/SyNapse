export default function TranscriptPanel({ transcript }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
        maxHeight: "300px",
        overflowY: "auto",
      }}
    >
      <h3 style={{fontSize: "13px", fontWeight: "700", color: "#1e2d26", marginBottom: "16px"}}>
        Transcript
      </h3>
      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
        {transcript && transcript.length > 0 ? (
          transcript.map((entry, idx) => {
            let bubbleColor = "#f5f7fb";
            let textColor = "#3a4a40";

            if (entry.speaker === "system") {
              bubbleColor = "#e8f4ec";
              textColor = "#4a7a5a";
            }

            return (
              <div key={idx} style={{padding: "12px", background: bubbleColor, borderRadius: "10px"}}>
                <div style={{fontSize: "10px", color: "#7a8a80", marginBottom: "4px", fontWeight: "600"}}>
                  {entry.speaker.toUpperCase()}
                </div>
                <div style={{fontSize: "13px", color: textColor, lineHeight: "1.4"}}>
                  {entry.message}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{textAlign: "center", color: "#7a8a80", fontSize: "12px", padding: "20px"}}>
            No transcript yet
          </div>
        )}
      </div>
    </div>
  );
}
