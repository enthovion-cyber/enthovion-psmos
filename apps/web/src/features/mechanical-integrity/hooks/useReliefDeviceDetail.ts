import { useQuery } from '@tanstack/react-query';
import { reliefDeviceService } from '../services/relief-device.service';

export function useReliefDeviceDetail(reliefDeviceId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-device', reliefDeviceId], queryFn: () => reliefDeviceService.get(reliefDeviceId!), enabled: !!reliefDeviceId });
}
