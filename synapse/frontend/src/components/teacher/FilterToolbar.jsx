export default function FilterToolbar({ statusFilter, setStatusFilter, sortBy, setSortBy }) {
  const statuses = [
    { value: "all", label: "All" },
    { value: "ready", label: "Ready" },
    { value: "needs_support", label: "Needs Support" },
    { value: "needs_immediate_support", label: "Needs Immediate" },
  ];

  const sorts = [
    { value: "recent", label: "Recent" },
    { value: "status", label: "Status" },
    { value: "progress", label: "Progress" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#3a4a40" }}>
          Status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            borderRadius: "12px",
            border: "1.5px solid #e0e8e4",
            background: "#fff",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#3a4a40",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#4a7a5a";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e0e8e4";
          }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#3a4a40", marginRight: "8px" }}>
          Sort:
        </label>
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => setSortBy(s.value)}
            style={{
              borderRadius: "12px",
              border: sortBy === s.value ? "1.5px solid #4a7a5a" : "1.5px solid #e0e8e4",
              background: sortBy === s.value ? "#e8f4ec" : "#fff",
              color: sortBy === s.value ? "#4a7a5a" : "#3a4a40",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (sortBy !== s.value) {
                e.currentTarget.style.borderColor = "#4a7a5a";
                e.currentTarget.style.background = "#f5f7fb";
              }
            }}
            onMouseLeave={(e) => {
              if (sortBy !== s.value) {
                e.currentTarget.style.borderColor = "#e0e8e4";
                e.currentTarget.style.background = "#fff";
              }
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
