import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

const StatsCard: React.FC<Props> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
};

export default StatsCard;