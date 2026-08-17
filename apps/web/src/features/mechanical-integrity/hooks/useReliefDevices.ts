import { useQuery } from '@tanstack/react-query';
import { reliefDeviceService } from '../services/relief-device.service';

export function useReliefDevices(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-devices', equipmentId ?? 'all', filters], queryFn: () => reliefDeviceService.registry(filters, equipmentId) });
}

export function useReliefDeviceDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-device-dashboard', filters], queryFn: () => reliefDeviceService.dashboard(filters) });
}

export function useReliefDeviceSummary(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-device-summary', filters], queryFn: () => reliefDeviceService.summary(filters) });
}
