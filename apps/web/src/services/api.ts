import axios from 'axios';

let refreshInFlight: Promise<string | null> | null = null;

export function hasLocalSession() {
  if (typeof window === 'undefined') return false;
  const token = window.localStorage.getItem('psm.accessToken')?.trim();
  return Boolean(token && token.length > 20 && token.length < 12000);
}

function clearBrowserSession() {
  window.localStorage.removeItem('psm.accessToken');
  window.localStorage.removeItem('psm.refreshToken');
  window.localStorage.removeItem('psm.tenantId');
  window.localStorage.removeItem('psm.selectedSiteId');
}

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = window.localStorage.getItem('psm.refreshToken')?.trim();
    if (!refreshToken) return null;
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const payload = response.data?.data ?? response.data;
      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
      const nextRefreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';
      if (!accessToken) return null;
      window.localStorage.setItem('psm.accessToken', accessToken);
      if (nextRefreshToken) window.localStorage.setItem('psm.refreshToken', nextRefreshToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1',
  timeout: 30000,
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('psm.accessToken')?.trim().replace(/^Bearer\s+/i, '') : null;
  const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('psm.tenantId') : null;
  const selectedSiteId = typeof window !== 'undefined' ? window.localStorage.getItem('psm.selectedSiteId') : null;
  const selectedUnitId = typeof window !== 'undefined' ? window.localStorage.getItem('psm.selectedUnitId') : null;
  const url = String(config.url ?? '');
  if (token && token.length < 12000 && !url.includes('/auth/refresh')) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['x-tenant-id'] = tenantId;
  if (selectedSiteId) config.headers['x-psm-site-id'] = selectedSiteId;
  if (selectedUnitId) config.headers['x-psm-unit-id'] = selectedUnitId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (typeof window !== 'undefined' && error?.response?.status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      }
      clearBrowserSession();
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
