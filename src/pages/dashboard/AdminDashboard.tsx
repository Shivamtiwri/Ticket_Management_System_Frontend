
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import { StatCard } from '../../components/shared/StatCard';
import { Spinner } from '../../components/shared/Spinner';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
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

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total"
          value={stats?.total ?? 0}
          color="text-gray-700"
        />

        <StatCard
          label="Open"
          value={stats?.open ?? 0}
          color="text-blue-600"
        />

        <StatCard
          label="In Progress"
          value={stats?.inProgress ?? 0}
          color="text-yellow-600"
        />

        <StatCard
          label="Resolved"
          value={stats?.resolved ?? 0}
          color="text-green-600"
        />

        <StatCard
          label="Closed"
          value={stats?.closed ?? 0}
          color="text-gray-500"
        />
        <StatCard
          label="Total Category"
          value={stats?.total_category ?? 0}
          color="text-green-500"
        />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        <div className="card w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tickets by Priority
          </h2>

          {!data?.byPriority?.length ? (
            <p className="text-sm text-gray-500">
              No ticket data available.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.byPriority.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm text-gray-700 capitalize">
                    {item._id}
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="card w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tickets by Category
          </h2>

          {!data?.byCategory?.length ? (
            <p className="text-sm text-gray-500">
              No category data available.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.byCategory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm text-gray-700">
                    {item._id}
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="card w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tickets by Agent
          </h2>

          {!data?.byAgent?.length ? (
            <p className="text-sm text-gray-500">
              No assigned tickets yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.byAgent.map((agent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm text-gray-700">
                    {agent._id}
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {agent.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Users by Role
        </h2>

        {!data?.userStats?.length ? (
          <p className="text-sm text-gray-500">
            No user data available.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.userStats.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-gray-700 capitalize">
                  {user._id}
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {user.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
