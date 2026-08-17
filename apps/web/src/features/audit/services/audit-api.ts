import { api } from '@/services/api';

function unwrap<T>(response: { data: T | { data?: T } }) {
  const body = response.data as { data?: T };
  return body && typeof body === 'object' && 'data' in body ? body.data as T : response.data as T;
}

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response = await api.get<T>(url, { params });
  return unwrap<T>(response);
}

export async function post<T>(url: string, data?: Record<string, unknown>) {
  const response = await api.post<T>(url, data ?? {});
  return unwrap<T>(response);
}

export async function patch<T>(url: string, data?: Record<string, unknown>) {
  const response = await api.patch<T>(url, data ?? {});
  return unwrap<T>(response);
}

export async function remove<T>(url: string, data?: Record<string, unknown>) {
  const response = await api.delete<T>(url, { data: data ?? {} });
  return unwrap<T>(response);
}
