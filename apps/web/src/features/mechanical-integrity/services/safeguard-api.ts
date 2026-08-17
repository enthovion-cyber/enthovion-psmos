import { api } from '@/services/api';

export function unwrap<T>(response: any): T {
  return response.data.data as T;
}

export function get<T>(url: string, params: Record<string, unknown> = {}): Promise<T> {
  return api.get(url, { params }).then((response) => unwrap<T>(response));
}

export function post<T>(url: string, input: Record<string, unknown> = {}): Promise<T> {
  return api.post(url, input).then((response) => unwrap<T>(response));
}

export function patch<T>(url: string, input: Record<string, unknown> = {}): Promise<T> {
  return api.patch(url, input).then((response) => unwrap<T>(response));
}

export function remove<T>(url: string): Promise<T> {
  return api.delete(url).then((response) => unwrap<T>(response));
}
