import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { userService } from '../../services/user.service';
import { UserRole } from '../../types';
import { Pagination } from '../../components/shared/Pagination';
import { Spinner } from '../../components/shared/Spinner';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { ErrorState } from '../../components/shared/ErrorState';
import { getAxiosErrorMessage } from '../../lib/utils';

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

export const AgentsPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [toggleTarget, setToggleTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', 'agents-list', page, search],
    queryFn: () =>
      userService.getUsers({
        page,
        limit: 15,
        role: UserRole.AGENT,
        ...(search && { search }),
      }),
    placeholderData: keepPreviousData,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => userService.toggleUserStatus(id),
    onSuccess: () => {
      toast.success('Agent status updated');
      setToggleTarget(null);
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const agents = data?.data ?? [];
  const activeCount = agents.filter((a) => a.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your support team</p>
        </div>
        {data?.pagination && (
          <div className="flex items-center gap-2">
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              {activeCount} active
            </span>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {data.pagination.total.toLocaleString()} total
            </span>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search agents by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input w-72"
            />
            <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
          </form>
          {search && (
            <button onClick={clearSearch} className="btn-secondary text-sm px-3 py-2 self-end">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : isError && agents.length === 0 ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load agents.'}
            onRetry={() => refetch()}
          />
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-gray-500 font-medium">No agents found</p>
            {search && (
              <button onClick={clearSearch} className="btn-secondary text-sm px-4 py-2 mt-1">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Agent</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Department</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Last Login</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 bg-purple-100 text-purple-700">
                            {getInitials(agent.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{agent.name}</p>
                            <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {agent.department ? (
                          <span className="badge bg-gray-100 text-gray-600">{agent.department}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 badge ${
                          agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs tabular-nums">
                        {agent.lastLogin ? (
                          <span
                            className="text-gray-600"
                            title={format(new Date(agent.lastLogin), 'PPpp')}
                          >
                            {formatDistanceToNow(new Date(agent.lastLogin), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-gray-300">Never</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                        {format(new Date(agent.createdAt), 'MMM d, yyyy')}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setToggleTarget({ id: agent._id, name: agent.name, isActive: agent.isActive })}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              agent.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {agent.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && (
              <Pagination pagination={data.pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate(toggleTarget.id)}
        title={toggleTarget?.isActive ? 'Deactivate Agent' : 'Activate Agent'}
        message={`Are you sure you want to ${toggleTarget?.isActive ? 'deactivate' : 'activate'} ${toggleTarget?.name}?`}
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        isDestructive={toggleTarget?.isActive}
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
};
