import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ticketService } from '../../services/ticket.service';
import { useAuth } from '../../context/AuthContext';
import { type TicketFilters } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/shared/Badges';
import { Pagination } from '../../components/shared/Pagination';
import { Spinner } from '../../components/shared/Spinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { getAxiosErrorMessage } from '../../lib/utils';

export const AvailableTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'available', filters],
    queryFn: () => ticketService.getAvailableTickets(filters),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      ticketService.assignTicket(id, agentId),
    onSuccess: () => {
      toast.success('Ticket accepted!');
      qc.invalidateQueries({ queryKey: ['tickets', 'available'] });
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Available Tickets</h1>
      <p className="text-gray-500 text-sm">Unassigned open tickets you can pick up.</p>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !data?.data?.length ? (
          <EmptyState title="No available tickets" description="All tickets are currently assigned." />
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
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/tickets/${ticket._id}`} className="hover:text-blue-600">
                          <p className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-gray-400">{ticket.ticketId}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {typeof ticket.category === 'object' ? ticket.category.name : '—'}
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => assignMutation.mutate({ id: ticket._id, agentId: user!.id })}
                          disabled={assignMutation.isPending}
                          className="btn-primary text-xs px-3 py-1"
                        >
                          Accept
                        </button>
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
