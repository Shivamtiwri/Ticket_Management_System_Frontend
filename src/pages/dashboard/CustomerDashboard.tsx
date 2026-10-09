import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import { StatCard } from '../../components/shared/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Spinner } from '../../components/shared/Spinner';
import { ErrorState } from '../../components/shared/ErrorState';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleDot, Clock3, Ticket } from 'lucide-react';

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
  const metricCards = [
    { label: 'Total tickets', value: stats?.total ?? 0, color: 'text-gray-700', iconBackground: 'bg-gray-100', icon: <Ticket className="h-5 w-5" />, state: undefined },
    { label: 'Open', value: stats?.open ?? 0, color: 'text-blue-600', iconBackground: 'bg-blue-50', icon: <CircleDot className="h-5 w-5" />, state: { filters: { status: 'OPEN' } } },
    { label: 'In progress', value: stats?.inProgress ?? 0, color: 'text-amber-600', iconBackground: 'bg-amber-50', icon: <Clock3 className="h-5 w-5" />, state: { filters: { status: 'IN_PROGRESS' } } },
    { label: 'Resolved', value: stats?.resolved ?? 0, color: 'text-emerald-600', iconBackground: 'bg-emerald-50', icon: <CheckCircle2 className="h-5 w-5" />, state: { filters: { status: 'RESOLVED' } } },
    { label: 'Closed', value: stats?.closed ?? 0, color: 'text-gray-500', iconBackground: 'bg-gray-100', icon: <CheckCircle2 className="h-5 w-5" />, state: { filters: { status: 'CLOSED' } } },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My dashboard</h1>
          
        </div>
        <Link to="/tickets/new" className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
          <Ticket className="h-4 w-4" />
          Create ticket
        </Link>
      </header>

      <section aria-label="Ticket totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((metric) => (
          <StatCard
            key={metric.label}
            link="/tickets"
            label={metric.label}
            value={metric.value}
            color={metric.color}
            iconBackground={metric.iconBackground}
            icon={metric.icon}
            state={metric.state}
          />
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-gray-900">Recent tickets</h2>
            <p className="mt-1 text-sm text-gray-500">Your latest support requests</p>
          </div>
          <Link to="/tickets" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {!data?.recentTickets?.length ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Ticket className="h-6 w-6" />
            </div>
            <p className="mt-3 font-medium text-gray-900">No tickets yet</p>
            <p className="mt-1 text-sm text-gray-500">Create a ticket and our team will be happy to help.</p>
            <Link to="/tickets/new" className="btn-primary mt-4">Create a ticket</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentTickets.map((t) => (
              <Link key={t._id} to={`/tickets/${t._id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{t.subject}</p>
                  <p className="mt-1 text-xs text-gray-500">{t.ticketId} <span className="mx-1.5 text-gray-300">·</span> Updated {format(new Date(t.updatedAt), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
