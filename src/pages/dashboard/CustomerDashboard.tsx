import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Spinner } from '../../components/shared/Spinner';
import { ErrorState } from '../../components/shared/ErrorState';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const CustomerDashboard: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', 'customer'],
    queryFn: dashboardService.getCustomerDashboard,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  if (isError && !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load dashboard.'}
        onRetry={() => refetch()}
      />
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard link="/tickets" label="Total" value={stats?.total ?? 0} color="text-gray-700" />
        <StatCard link="/tickets" label="Open" value={stats?.open ?? 0} color="text-blue-600" state={{ filters: { status: 'OPEN' } }} />
        <StatCard link="/tickets" label="In Progress" value={stats?.inProgress ?? 0} color="text-yellow-600" state={{ filters: { status: 'IN_PROGRESS' } }} />
        <StatCard link="/tickets" label="Resolved" value={stats?.resolved ?? 0} color="text-green-600" state={{ filters: { status: 'RESOLVED' } }} />
        <StatCard link="/tickets" label="Closed" value={stats?.closed ?? 0} color="text-gray-500" state={{ filters: { status: 'CLOSED' } }} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Tickets</h2>
        </div>
        {!data?.recentTickets?.length ? (
          <p className="text-gray-500 text-sm py-4 text-center">No tickets yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentTickets.map((t) => (
              <Link key={t._id} to={`/tickets/${t._id}`} className="flex items-center justify-between py-3 px-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(t.createdAt), 'MMM d, yyyy')}</p>
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
    </div>
  );
};
