import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from '../services/auth.service';
// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BASE_URL = ' https://ticket-management-system-backend-8.onrender.com/api';

export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

export const fileUrl = (filePath: string): string => {
  const path = filePath.replace(/^\/+/, '');
  return import.meta.env.DEV ? `/${path}` : `${API_ORIGIN}/${path}`;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, 
});


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


let isRefreshing = false;


type FailedQueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let failedQueue: FailedQueueEntry[] = [];

function drainQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

function forceLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  window.dispatchEvent(new Event('auth:logout'));
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const result = await authService.refresh();

    if (!result) {
      drainQueue(new Error('Session expired'), null);
      isRefreshing = false;
      forceLogout();
      return Promise.reject(error);
    }


    const { token: newToken, user } = result;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));

    
    window.dispatchEvent(new CustomEvent('auth:refresh', { detail: { token: newToken, user } }));

    
    drainQueue(null, newToken);
    isRefreshing = false;

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(originalRequest);
  }
);

export default apiClient;
