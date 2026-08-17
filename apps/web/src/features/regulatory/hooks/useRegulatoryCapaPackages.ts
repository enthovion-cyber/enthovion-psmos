import { useQuery } from '@tanstack/react-query';
import { regulatoryCapaPackageService } from '../services/regulatory-capa-package.service';

export function useRegulatoryCapaPackages(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'capa', filters], queryFn: () => regulatoryCapaPackageService.register(filters), refetchOnWindowFocus: false });
}
