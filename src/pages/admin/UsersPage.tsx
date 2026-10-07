import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { userService } from '../../services/user.service';
import { UserRole } from '../../types';
import { Pagination } from '../../components/shared/Pagination';
import { Spinner } from '../../components/shared/Spinner';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Modal } from '../../components/shared/Modal';
import { getAxiosErrorMessage } from '../../lib/utils';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const ROLE_STYLE: Record<UserRole, string> = {
  [UserRole.ADMIN]:    'bg-red-100 text-red-700',
  [UserRole.AGENT]:    'bg-purple-100 text-purple-700',
  [UserRole.CUSTOMER]: 'bg-blue-100 text-blue-700',
};

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]:    'Admin',
  [UserRole.AGENT]:    'Agent',
  [UserRole.CUSTOMER]: 'Customer',
};

const avatarBg = (role: UserRole) => ROLE_STYLE[role] ?? 'bg-gray-100 text-gray-600';

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

/* ── Component ────────────────────────────────────────────────────────────── */
export const UsersPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toggleTarget, setToggleTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ id: string; name: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () =>
      userService.getUsers({
        page,
        limit: 15,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => userService.toggleUserStatus(id),
    onSuccess: () => { toast.success('User status updated'); setToggleTarget(null); invalidate(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userService.updateUserRole(id, role),
    onSuccess: () => { toast.success('Role updated'); setRoleTarget(null); invalidate(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setRoleFilter('');
    setPage(1);
  };

  const hasFilters = !!search || !!roleFilter;
  const users = data?.data ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage accounts, roles and access</p>
        </div>
        {data?.pagination && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {data.pagination.total.toLocaleString()} users
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input w-64"
            />
            <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
          </form>

          <div className="flex flex-col gap-1">
            <label className="label text-xs">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="input w-40"
            >
              <option value="">All Roles</option>
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary text-sm px-3 py-2 self-end">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-gray-500 font-medium">No users found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary text-sm px-4 py-2 mt-1">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      {/* User cell — avatar + name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 ${avatarBg(u.role)}`}>
                            {getInitials(u.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`badge ${ROLE_STYLE[u.role]}`}>
                          {ROLE_LABEL[u.role]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 badge ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setRoleTarget({ id: u._id, name: u.name }); setNewRole(u.role); }}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => setToggleTarget({ id: u._id, name: u.name, isActive: u.isActive })}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              u.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate(toggleTarget.id)}
        title={toggleTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${toggleTarget?.isActive ? 'deactivate' : 'activate'} ${toggleTarget?.name}?`}
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        isDestructive={toggleTarget?.isActive}
        isLoading={toggleMutation.isPending}
      />

      {/* Change role modal */}
      <Modal isOpen={!!roleTarget} onClose={() => setRoleTarget(null)} title={`Update Role — ${roleTarget?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">New Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input">
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRoleTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => roleTarget && roleMutation.mutate({ id: roleTarget.id, role: newRole })}
              disabled={roleMutation.isPending}
              className="btn-primary"
            >
              {roleMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
