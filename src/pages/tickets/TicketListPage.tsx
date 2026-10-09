import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import { useAuth } from '../../context/AuthContext';
import { UserRole, TicketStatus, type TicketFilters } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Pagination } from '../../components/shared/Pagination';
import { Spinner } from '../../components/shared/Spinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { TicketFiltersBar } from '../../components/tickets/TicketFiltersBar';
import { format } from 'date-fns';

export const TicketListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
   const navigate = useNavigate();
  const [filters, setFilters] = useState<TicketFilters>(() => {
    const status = searchParams.get('status') as TicketStatus | null;
    const priority = searchParams.get('priority') as any;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') as any;
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
   

    const initialFilters: TicketFilters = { page: 1, limit: 10 };

    // Check location state first (for navigation from dashboard)
    const stateFilters = (location.state as any)?.filters;
    if (stateFilters?.status) {
      if (Object.values(TicketStatus).includes(stateFilters.status)) {
        initialFilters.status = stateFilters.status;
      }
    } else if (status && Object.values(TicketStatus).includes(status)) {
      initialFilters.status = status;
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
      initialFilters.priority = priority;
    }
    if (category) initialFilters.category = category;
    if (search) initialFilters.search = search;
    if (sortBy) initialFilters.sortBy = sortBy;
    if (page) initialFilters.page = parseInt(page);
    if (limit) initialFilters.limit = parseInt(limit);

    return initialFilters;
  });

  // Update URL when filters change
  useEffect(() => {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.page && filters.page !== 1) params.page = filters.page.toString();
    if (filters.limit && filters.limit !== 10) params.limit = filters.limit.toString();
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketService.getTickets(filters),
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  });

  const isCustomer = user?.role === UserRole.CUSTOMER;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isCustomer ? 'My Tickets' : 'All Tickets'}
        </h1>
        {isCustomer && (
          <Link to="/tickets/new" className="btn-primary">New Ticket</Link>
        )}
      </div>

      <TicketFiltersBar filters={filters} onChange={setFilters} />

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : isError && !data ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load tickets.'}
            onRetry={() => refetch()}
          />
        ) : !data?.data?.length ? (
          <EmptyState
            title="No tickets found"
            description="Try adjusting your filters or create a new ticket."
            action={isCustomer ? <Link to="/tickets/new" className="btn-primary">Create Ticket</Link> : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    {!isCustomer && <th className="text-left px-4 py-3 font-medium text-gray-600">Created By</th>}
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((ticket) => (
                    <tr onClick={() => navigate(`/tickets/${ticket._id}`)} key={ticket._id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ticket.ticketId}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {typeof ticket?.category === 'object' ? ticket?.category?.name : ticket?.category}
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      {!isCustomer && (
                        <td className="px-4 py-3 text-gray-600">
                          {typeof ticket.createdBy === 'object' ? ticket.createdBy.name : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {format(new Date(ticket.updatedAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pagination && (
              <Pagination
                pagination={data.pagination}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
