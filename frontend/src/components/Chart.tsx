import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { DrillChartData } from "../types/api";

export default function Chart({ data }: { data: DrillChartData[] }) {
  // fallback が空でも空配列を渡す
  const chartData = Array.isArray(data) ? data : [];

  // 色が未設定の要素に対するデフォルトカラーパレット
  const palette = ["#60A5FA", "#34D399", "#F59E0B", "#F97316", "#EF4444", "#A78BFA", "#F472B6"];

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            label={(entry) => entry.name} // スライスに数字ではなく訓練名を表示
          >
            {chartData.map((entry, idx) => (
              <Cell key={entry.name + idx} fill={entry.color ?? palette[idx % palette.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any, name: any) => [value, name]} />
          <Legend
            verticalAlign="bottom"
            formatter={(value: any) => <span style={{ color: "#374151" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}