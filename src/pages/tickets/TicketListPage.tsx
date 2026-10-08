import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import { useAuth } from '../../context/AuthContext';
import { UserRole, type TicketFilters } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Pagination } from '../../components/shared/Pagination';
import { Spinner } from '../../components/shared/Spinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { TicketFiltersBar } from '../../components/tickets/TicketFiltersBar';
import { format } from 'date-fns';

export const TicketListPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketService.getTickets(filters),
    refetchOnMount: 'always',
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
                    <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/tickets/${ticket._id}`} className="hover:text-blue-600 transition-colors">
                          <p className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ticket.ticketId}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {typeof ticket.category === 'object' ? ticket.category.name : ticket.category}
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
