// Removed: only Register, Login and Dashboard functionality is kept in this file.
import apiClient from '../lib/api';
import type { ApiResponse, Category } from '../types';

export const categoryService = {
  async getCategories() {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return data.data;
  },
  async getActiveCategories() {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories/active');
    return data.data;
  },
  async createCategory(payload: { name: string; description?: string }) {
    const { data } = await apiClient.post<ApiResponse<Category>>('/categories', payload);
    return data.data;
  },
  async updateCategory(id: string, payload: Partial<Category>) {
    const { data } = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, payload);
    return data.data;
  },
  async toggleCategoryStatus(id: string) {
    const { data } = await apiClient.patch<ApiResponse<Category>>(`/categories/${id}/toggle-status`);
    return data.data;
  },
  async deleteCategory(id: string) {
    await apiClient.delete(`/categories/${id}`);
  },
};
