import apiClient from '../lib/api';
import type { PaginatedApiResponse, ActivityLog } from '../types';

export const activityService = {
  async getActivityLogs(params: Record<string, string | number> = {}) {
    const { data } = await apiClient.get<PaginatedApiResponse<ActivityLog>>('/activity', { params });
    return data;
  },
};
