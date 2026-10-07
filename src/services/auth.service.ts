import apiClient from '../lib/api';
import type { ApiResponse, AuthUser, LoginCredentials, RegisterCredentials, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials) {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: AuthUser }>>(
      '/auth/login',
      credentials
    );
    return data.data;
  },

  async register(credentials: RegisterCredentials) {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: AuthUser }>>(
      '/auth/register',
      credentials
    );
    return data.data;
  },

  async getMe() {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  async refresh(): Promise<{ token: string; user: AuthUser } | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<{ token: string; user: AuthUser }>>(
        '/auth/refresh'
      );
      return data.data ?? null;
    } catch {
      return null;
    }
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await apiClient.patch<ApiResponse<null>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};
