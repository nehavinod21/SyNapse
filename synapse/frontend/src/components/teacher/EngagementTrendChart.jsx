import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EngagementTrendChart({ data }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#fff",
        border: "1.5px solid #e0e8e4",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(74, 122, 90, 0.08)",
      }}
    >
      <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e2d26", marginBottom: "16px" }}>
        Engagement Trend
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e8e4" />
          <XAxis dataKey="day" stroke="#7a8a80" style={{ fontSize: "12px" }} />
          <YAxis stroke="#7a8a80" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e0e8e4",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4a7a5a"
            strokeWidth={2}
            dot={{ fill: "#4a7a5a", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
