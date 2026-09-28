import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function EmotionDistributionChart({ data }) {
  const colors = ["#4a7a5a", "#ffa726", "#ab47bc", "#29b6f6", "#ec407a"];

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
        Emotion Distribution
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="percentage" nameKey="emotion" cx="50%" cy="50%" outerRadius={80}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
