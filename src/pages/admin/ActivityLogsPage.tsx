import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { activityService } from '../../services/activity.service';
import { Pagination } from '../../components/shared/Pagination';
import { Spinner } from '../../components/shared/Spinner';
import type { ActivityLog } from '../../types';

type ActionMeta = { label: string; dot: string; badge: string };

const ACTION_META: Record<string, ActionMeta> = {
  TICKET_CREATED:    { label: 'Ticket Created',    dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700'       },
  TICKET_UPDATED:    { label: 'Ticket Updated',    dot: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700'   },
  TICKET_ASSIGNED:   { label: 'Ticket Assigned',   dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700'   },
  TICKET_REASSIGNED: { label: 'Ticket Reassigned', dot: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-700'   },
  STATUS_CHANGED:    { label: 'Status Changed',    dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700'     },
  PRIORITY_CHANGED:  { label: 'Priority Changed',  dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700'   },
  COMMENT_ADDED:     { label: 'Comment Added',     dot: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-700'       },
  TICKET_RESOLVED:   { label: 'Ticket Resolved',   dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  TICKET_CLOSED:     { label: 'Ticket Closed',     dot: 'bg-gray-500',    badge: 'bg-gray-100 text-gray-600'       },
  USER_CREATED:      { label: 'User Created',      dot: 'bg-cyan-500',    badge: 'bg-cyan-100 text-cyan-700'       },
  USER_UPDATED:      { label: 'User Updated',      dot: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700'         },
  USER_DEACTIVATED:  { label: 'User Deactivated',  dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700'         },
  USER_ACTIVATED:    { label: 'User Activated',    dot: 'bg-green-500',   badge: 'bg-green-100 text-green-700'     },
  CATEGORY_CREATED:  { label: 'Category Created',  dot: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700'       },
  CATEGORY_UPDATED:  { label: 'Category Updated',  dot: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700'       },
};

const DEFAULT_META: ActionMeta = { label: 'Action', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' };

const getMeta = (action: string): ActionMeta =>
  ACTION_META[action] ?? { ...DEFAULT_META, label: action.replace(/_/g, ' ') };

const ROLE_AVATAR_BG: Record<string, string> = {
  ADMIN:    'bg-red-100 text-red-700',
  AGENT:    'bg-purple-100 text-purple-700',
  CUSTOMER: 'bg-blue-100 text-blue-700',
};

const ActorAvatar: React.FC<{ name: string; role: string }> = ({ name, role }) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const bg = ROLE_AVATAR_BG[role] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${bg}`}>
      {initials}
    </span>
  );
};

const LogRow: React.FC<{ log: ActivityLog; isLast: boolean }> = ({ log, isLast }) => {
  const meta = getMeta(log.action);
  const actor = typeof log.actor === 'object' ? log.actor : null;
  const actorName = actor?.name ?? 'Unknown';
  const actorRole = actor?.role ?? '';
  const ts = new Date(log.createdAt);

  return (
    <div className="relative flex gap-4 px-5 py-4 group hover:bg-gray-50 transition-colors">
      {!isLast && (
        <span className="absolute left-[2.35rem] top-10 bottom-0 w-px bg-gray-100 group-hover:bg-gray-200 transition-colors" />
      )}

      <div className="relative flex-shrink-0 flex flex-col items-center mt-0.5">
        <span className={`w-3 h-3 rounded-full ${meta.dot} ring-2 ring-white`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${meta.badge}`}>
              {meta.label}
            </span>

            {log.ticket && (
              <Link
                to={`/tickets/${log.ticket.ticketId}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {log.ticket.ticketId}
              </Link>
            )}
          </div>

          <time
            dateTime={log.createdAt}
            className="text-xs text-gray-400 flex-shrink-0 tabular-nums"
            title={format(ts, 'PPpp')}
          >
            {formatDistanceToNow(ts, { addSuffix: true })}
          </time>
        </div>

        <p className="mt-1 text-sm text-gray-800 leading-snug">{log.description}</p>

        <div className="mt-2 flex items-center gap-1.5">
          <ActorAvatar name={actorName} role={actorRole} />
          <span className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{actorName}</span>
            {actorRole && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_AVATAR_BG[actorRole] ?? 'bg-gray-100 text-gray-500'}`}>
                {actorRole}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const ACTION_OPTIONS = Object.keys(ACTION_META);

export const ActivityLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, action, search],
    queryFn: () =>
      activityService.getActivityLogs({
        page,
        limit: 20,
        ...(action && { action }),
        ...(search && { search }),
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setAction('');
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const hasFilters = !!action || !!search;
  const logs = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all system events and changes</p>
        </div>
        {data?.pagination && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {data.pagination.total.toLocaleString()} total events
          </span>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search description or actor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input w-64"
            />
            <button type="submit" className="btn-primary text-sm px-4 py-2">
              Search
            </button>
          </form>

          <div className="flex flex-col gap-1">
            <label className="label text-xs">Filter by action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="input w-52"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_META[a].label}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary text-sm px-3 py-2 self-end">
              Clear filters
            </button>
          )}
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {action && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getMeta(action).badge}`}>
                {getMeta(action).label}
                <button onClick={() => { setAction(''); setPage(1); }} className="ml-1 hover:opacity-70">✕</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                "{search}"
                <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="ml-1 hover:opacity-70">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Spinner />
            <span className="text-sm">Loading activity...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-gray-500 font-medium">No activity logs found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary text-sm px-4 py-2">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="w-3" />
              <span className="flex-1">Event</span>
              <span>Time</span>
            </div>

            <div className="divide-y divide-gray-50">
              {logs.map((log, idx) => (
                <LogRow key={log._id} log={log} isLast={idx === logs.length - 1} />
              ))}
            </div>

            {data?.pagination && (
              <Pagination pagination={data.pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
