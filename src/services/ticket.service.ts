import apiClient from '../lib/api';
import type { ApiResponse, PaginatedApiResponse, Ticket, Comment, ActivityLog, TicketFilters } from '../types';

export const ticketService = {
  async getTickets(filters: TicketFilters = {}) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
    );
    const { data } = await apiClient.get<PaginatedApiResponse<Ticket>>('/tickets', { params });
    return data;
  },

  async getTicketById(id: string) {
    const { data } = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return data.data;
  },

  async createTicket(formData: FormData) {
    const { data } = await apiClient.post<ApiResponse<Ticket>>('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async updateTicket(id: string, updates: Partial<{ subject: string; description: string; priority: string; status: string; tags: string[] }>) {
    const { data } = await apiClient.patch<ApiResponse<Ticket>>(`/tickets/${id}`, updates);
    return data.data;
  },

  async assignTicket(id: string, agentId: string) {
    const { data } = await apiClient.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign`, { agentId });
    return data.data;
  },

  async deleteTicket(id: string) {
    await apiClient.delete(`/tickets/${id}`);
  },

  async getAvailableTickets(filters: TicketFilters = {}) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
    );
    const { data } = await apiClient.get<PaginatedApiResponse<Ticket>>('/tickets/available', { params });
    return data;
  },

  async getComments(ticketId: string) {
    const { data } = await apiClient.get<ApiResponse<Comment[]>>(`/tickets/${ticketId}/comments`);
    return data.data;
  },

  async addComment(ticketId: string, formData: FormData) {
    const { data } = await apiClient.post<ApiResponse<Comment>>(`/tickets/${ticketId}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async deleteComment(ticketId: string, commentId: string) {
    await apiClient.delete(`/tickets/${ticketId}/comments/${commentId}`);
  },

  async getTicketActivity(ticketId: string) {
    const { data } = await apiClient.get<ApiResponse<ActivityLog[]>>(`/tickets/${ticketId}/activity`);
    return data.data;
  },
};
