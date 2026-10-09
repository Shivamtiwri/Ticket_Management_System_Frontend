import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Layers3,
  Ticket,
  Users,
  UserRoundCheck,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { Spinner } from '../../components/shared/Spinner';
import { ErrorState } from '../../components/shared/ErrorState';

const numberFormatter = new Intl.NumberFormat();

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  link: string;
  state?: { filters: { status: string } };
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color, link, state }) => (
  <Link
    to={link}
    state={state}
    className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
  >
    <div className="flex items-start justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
    </div>
    <p className="mt-5 text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{numberFormatter.format(value)}</p>
  </Link>
);

interface BreakdownItem {
  _id: string;
  count: number;
}

const BreakdownPanel: React.FC<{
  title: string;
  description: string;
  items: BreakdownItem[];
  emptyMessage: string;
  formatLabel?: (label: string) => string;
}> = ({ title, description, items, emptyMessage, formatLabel = (label) => label }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
    {items.length === 0 ? (
      <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">{emptyMessage}</p>
    ) : (
      <div className="space-y-4">
        {items.map((item, index) => {
          return (
            <div key={`${item._id}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-gray-700">{formatLabel(item._id || 'Uncategorized')}</span>
              <span className="shrink-0 font-medium tabular-nums text-gray-900">{numberFormatter.format(item.count)}</span>
            </div>
          );
        })}
      </div>
    )}
  </section>
);

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: dashboardService.getAdminDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load dashboard.'}
        onRetry={() => refetch()}
      />
    );
  }

  const stats = data?.stats;
  const quickLinks = [
    { label: 'Manage users', to: '/users', icon: <Users className="h-4 w-4" /> },
    { label: 'Manage agents', to: '/agents', icon: <UserRoundCheck className="h-4 w-4" /> },
    { label: 'Categories', to: '/categories', icon: <Layers3 className="h-4 w-4" /> },
    { label: 'Activity log', to: '/activity', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Admin dashboard</h1>
         
        </div>
       
      </header>

      <section aria-label="Ticket and category totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total tickets" value={stats?.total ?? 0} icon={<Ticket className="h-5 w-5" />} color="bg-blue-50 text-blue-600" link="/tickets" />
        <MetricCard label="Open" value={stats?.open ?? 0} icon={<CircleDot className="h-5 w-5" />} color="bg-sky-50 text-sky-600" link="/tickets" state={{ filters: { status: 'OPEN' } }} />
        <MetricCard label="In progress" value={stats?.inProgress ?? 0} icon={<Activity className="h-5 w-5" />} color="bg-amber-50 text-amber-600" link="/tickets" state={{ filters: { status: 'IN_PROGRESS' } }} />
        <MetricCard label="Resolved" value={stats?.resolved ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-emerald-50 text-emerald-600" link="/tickets" state={{ filters: { status: 'RESOLVED' } }} />
        <MetricCard label="Closed" value={stats?.closed ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-gray-100 text-gray-600" link="/tickets" state={{ filters: { status: 'CLOSED' } }} />
        <MetricCard label="Categories" value={stats?.total_category ?? 0} icon={<Layers3 className="h-5 w-5" />} color="bg-violet-50 text-violet-600" link="/categories" />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Support insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownPanel
            title="Tickets by priority"
            description="Share of tickets at each priority level"
            items={data?.byPriority ?? []}
            emptyMessage="No ticket data available."
          />
          <BreakdownPanel
            title="Tickets by category"
            description="Ticket volume across categories"
            items={data?.byCategory ?? []}
            emptyMessage="No category data available."
          />
          <BreakdownPanel
            title="Tickets by agent"
            description="Currently assigned tickets per agent"
            items={data?.byAgent ?? []}
            emptyMessage="No assigned tickets yet."
          />
          <BreakdownPanel
            title="Users by role"
            description="Registered users across the support team"
            items={data?.userStats ?? []}
            emptyMessage="No user data available."
            formatLabel={(role) => role.charAt(0) + role.slice(1).toLowerCase()}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold text-gray-900">Quick access</h2>
        <p className="mt-1 text-sm text-gray-500">Common administration tools</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {/* <span className="text-gray-400">{item.icon}</span> */}
              {item.label}
              <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
