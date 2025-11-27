import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartData } from '../types/api';

interface Props {
  chartData: ChartData[];
}

const Chart: React.FC<Props> = ({ chartData }) => {
  return (
    <div className="h-64 min-h-64 w-full bg-white rounded-lg p-4 shadow border border-gray-200">
      <h2 className="text-sm font-medium text-gray-700 mb-2">訓練種別割合</h2>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color ?? '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;