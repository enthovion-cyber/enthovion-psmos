import { api } from '@/services/api';

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response = await api.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: Record<string, unknown>) {
  const response = await api.post<T>(url, data ?? {});
  return response.data;
}

export async function patch<T>(url: string, data?: Record<string, unknown>) {
  const response = await api.patch<T>(url, data ?? {});
  return response.data;
}

export async function remove<T>(url: string, data?: Record<string, unknown>) {
  const response = await api.delete<T>(url, { data: data ?? {} });
  return response.data;
}
