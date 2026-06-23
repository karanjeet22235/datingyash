import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        return Promise.reject(error);
      }
      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return api(original);
      }
      isRefreshing = true;
      try {
        const resp = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', resp.data.accessToken);
        pendingQueue.forEach((fn) => fn());
        pendingQueue = [];
        return api(original);
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = axios.create({ baseURL: `${API_URL}/api` });
adminApi.interceptors.request.use((config) => {
  const secret = sessionStorage.getItem('adminSecret');
  if (secret) config.headers['x-admin-secret'] = secret;
  return config;
});
