import { TicketStatus, TicketPriority } from '../types';


export const getStatusColor = (status: TicketStatus): string => {
  const map: Record<TicketStatus, string> = {
    OPEN:             'bg-blue-100 text-blue-700',
    ASSIGNED:         'bg-violet-100 text-violet-700',
    IN_PROGRESS:      'bg-amber-100 text-amber-700',
    WAITING_FOR_USER: 'bg-orange-100 text-orange-700',
    RESOLVED:         'bg-emerald-100 text-emerald-700',
    CLOSED:           'bg-gray-100 text-gray-500',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
};

export const getPriorityColor = (priority: TicketPriority): string => {
  const map: Record<TicketPriority, string> = {
    LOW:      'bg-slate-100 text-slate-600',
    MEDIUM:   'bg-yellow-100 text-yellow-700',
    HIGH:     'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-600';
};

export const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

interface ApiErrorPayload {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
}

export const getAxiosErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: ApiErrorPayload } };
    const data = axiosError.response?.data;
    const details = (data?.errors ?? [])
      .map((e) => e.message)
      .filter((m): m is string => Boolean(m))
      .join('. ');
    if (details) {
      return data?.message ? `${data.message}: ${details}` : details;
    }
    return data?.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};
