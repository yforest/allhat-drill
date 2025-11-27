import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'シェイクアウト', value: 40 },
  { name: '炊き出し', value: 25 },
  { name: '避難訓練', value: 20 },
  { name: '応急救護', value: 10 },
  { name: '情報伝達', value: 5 },
];

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

const Chart: React.FC = () => {
  return (
    <div className="h-64 w-full bg-white rounded-lg p-4 shadow border border-gray-200">
      <h2 className="text-sm font-medium text-gray-700 mb-2">訓練種別割合</h2>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
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