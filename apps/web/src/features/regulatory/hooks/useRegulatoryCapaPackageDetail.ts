import { useQuery } from '@tanstack/react-query';
import { regulatoryCapaPackageService } from '../services/regulatory-capa-package.service';

export function useRegulatoryCapaPackageDetail(capaPackageId: string) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'capa', capaPackageId], queryFn: () => regulatoryCapaPackageService.detail(capaPackageId), enabled: Boolean(capaPackageId), refetchOnWindowFocus: false });
}

export function useRegulatoryCapaPackageSection(capaPackageId: string, section: string) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'capa', capaPackageId, section], queryFn: () => regulatoryCapaPackageService.section(capaPackageId, section), enabled: Boolean(capaPackageId && section), refetchOnWindowFocus: false });
}
