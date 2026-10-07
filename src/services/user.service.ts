import apiClient from '../lib/api';
import type { ApiResponse, PaginatedApiResponse, User } from '../types';

export const userService = {
  async getUsers(params: Record<string, string | number> = {}) {
    const { data } = await apiClient.get<PaginatedApiResponse<User>>('/users', { params });
    return data;
  },
  async getAgents() {
    const { data } = await apiClient.get<ApiResponse<User[]>>('/users/agents');
    return data.data;
  },
  async getUserById(id: string) {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },
  async updateProfile(updates: Partial<User>) {
    const { data } = await apiClient.put<ApiResponse<User>>('/users/profile', updates);
    return data.data;
  },
  async updateUser(id: string, updates: Partial<User>) {
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}`, updates);
    return data.data;
  },
  async updateUserRole(id: string, role: string) {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return data.data;
  },
  async toggleUserStatus(id: string) {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    return data.data;
  },
};
