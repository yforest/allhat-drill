import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DrillChartData } from '../types/api';

interface Props {
  data: DrillChartData[];
}

export default function Chart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 min-h-64 w-full bg-white rounded-lg p-4 shadow border border-gray-200 flex items-center justify-center">
        <span className="text-gray-500">データがありません</span>
      </div>
    );
  }

  return (
    <div className="h-64 min-h-64 w-full bg-white rounded-lg p-4 shadow border border-gray-200">
      <h2 className="text-sm font-medium text-gray-700 mb-2">訓練種別割合</h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color ?? '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}