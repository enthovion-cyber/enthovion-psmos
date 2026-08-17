import { useQuery } from '@tanstack/react-query';
import { regulatoryRegisterService } from '../services/regulatory-register.service';

export function useRegulatoryRegister(filters?: Record<string, unknown>, view?: string) {
  return useQuery({ queryKey: ['regulatory', 'register', view ?? 'register', filters], queryFn: () => view ? regulatoryRegisterService.filtered(view, filters) : regulatoryRegisterService.register(filters), refetchOnWindowFocus: false });
}
