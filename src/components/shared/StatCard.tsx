import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color = 'text-blue-600', icon }) => (
  <div className="card flex items-center gap-4">
    {icon && <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>{icon}</div>}
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);
