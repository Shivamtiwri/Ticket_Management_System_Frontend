import apiClient from '../lib/api';
import type { ApiResponse, CustomerDashboardStats, AgentDashboardStats, AdminDashboardStats } from '../types';

export const dashboardService = {
  async getCustomerDashboard() {
    const { data } = await apiClient.get<ApiResponse<CustomerDashboardStats>>('/dashboard/customer');
    return data.data;
  },
  async getAgentDashboard() {
    const { data } = await apiClient.get<ApiResponse<AgentDashboardStats>>('/dashboard/agent');
    return data.data;
  },
  async getAdminDashboard() {
    const { data } = await apiClient.get<ApiResponse<AdminDashboardStats>>('/dashboard/admin');
    return data.data;
  },
};
