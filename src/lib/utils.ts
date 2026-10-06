import { TicketStatus, TicketPriority } from '../types';

export const getStatusColor = (status: TicketStatus): string => {
  const map: Record<TicketStatus, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    ASSIGNED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    WAITING_FOR_USER: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const getPriorityColor = (priority: TicketPriority): string => {
  const map: Record<TicketPriority, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return map[priority] || 'bg-gray-100 text-gray-600';
};

export const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const getAxiosErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || fallback;
  }
  return fallback;
};
