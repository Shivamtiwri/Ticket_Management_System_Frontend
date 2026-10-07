import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Spinner } from '../../components/shared/Spinner';
import { format } from 'date-fns';

export const AgentDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'agent'],
    queryFn: dashboardService.getAgentDashboard,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Assigned" value={stats?.assigned ?? 0} color="text-purple-600" />
        <StatCard label="Open" value={stats?.open ?? 0} color="text-blue-600" />
        <StatCard label="In Progress" value={stats?.inProgress ?? 0} color="text-yellow-600" />
        <StatCard label="Waiting" value={stats?.waitingForUser ?? 0} color="text-orange-600" />
        <StatCard label="Resolved" value={stats?.resolved ?? 0} color="text-green-600" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Tickets</h2>
          <Link to="/tickets" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {!data?.recentTickets?.length ? (
          <p className="text-gray-500 text-sm py-4 text-center">No assigned tickets.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentTickets.map((t) => (
              <Link key={t._id} to={`/tickets/${t._id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {typeof t.createdBy === 'object' ? t.createdBy.name : 'Unknown'} · {format(new Date(t.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link to="/tickets/available" className="btn-primary inline-flex">View Available Tickets</Link>
    </div>
  );
};
