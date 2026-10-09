import React from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  link: string;
  value: number;
  color?: string;
  iconBackground?: string;
  icon?: React.ReactNode;
  state?: any;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  color = 'text-blue-600',
  iconBackground = 'bg-blue-50',
  icon,
  link,
  state,
}) => (
  <Link
    to={link}
    state={state}
    className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
  >
    <div className="flex items-start justify-between">
      {icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBackground} ${color}`}>
          {icon}
        </div>
      )}
      <span className="ml-auto text-gray-300 transition group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true">
        →
      </span>
    </div>
    <p className="mt-5 text-sm font-medium text-gray-500">{label}</p>
    <p className={`mt-1 text-3xl font-bold tracking-tight ${color}`}>{value.toLocaleString()}</p>
  </Link>
);
