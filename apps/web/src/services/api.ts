import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1',
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('psm.accessToken') : null;
  const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('psm.tenantId') : null;
  const selectedSiteId = typeof window !== 'undefined' ? window.localStorage.getItem('psm.selectedSiteId') : null;
  const url = String(config.url ?? '');
  if (token && token.length < 12000 && !url.includes('/auth/refresh')) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['x-tenant-id'] = tenantId;
  if (selectedSiteId) config.headers['x-psm-site-id'] = selectedSiteId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (typeof window !== 'undefined' && error?.response?.status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/refresh')) {
      const refreshToken = window.localStorage.getItem('psm.refreshToken');
      const tenantId = window.localStorage.getItem('psm.tenantId');
      if (refreshToken) {
        try {
          originalRequest._retry = true;
          const refreshResponse = await api.post('/auth/refresh', { refreshToken });
          const nextAccessToken = refreshResponse.data.data.accessToken;
          const nextRefreshToken = refreshResponse.data.data.refreshToken;
          window.localStorage.setItem('psm.accessToken', nextAccessToken);
          window.localStorage.setItem('psm.refreshToken', nextRefreshToken);
          if (tenantId) window.localStorage.setItem('psm.tenantId', tenantId);
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
          return api(originalRequest);
        } catch {
          // Fall through to session clear below.
        }
      }
      window.localStorage.removeItem('psm.accessToken');
      window.localStorage.removeItem('psm.refreshToken');
      window.localStorage.removeItem('psm.tenantId');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/session-expired')) {
        window.location.href = '/session-expired';
      }
    }
    const message = apiErrorMessage(error);
    if (message && error instanceof Error) error.message = message;
    return Promise.reject(error);
  }
);

function apiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as any;
  const message = data?.message ?? data?.error?.message ?? data?.details;
  if (Array.isArray(message)) return message.map((item) => {
    if (typeof item === 'string') return item;
    if (item?.message && item?.field) return `${item.field}: ${item.message}`;
    if (item?.message) return item.message;
    return JSON.stringify(item);
  }).join(', ');
  if (message && typeof message === 'object') return message.message ?? JSON.stringify(message);
  if (typeof message === 'string' && message.trim()) return message;
  if (error.response?.status === 403) return 'You do not have permission to perform this action.';
  if (error.response?.status === 400) return 'The request was rejected by validation.';
  return null;
}
