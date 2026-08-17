import { useQuery } from '@tanstack/react-query';
import { regulatoryJurisdictionService } from '../services/regulatory-jurisdiction.service';

export function useRegulatoryJurisdictionDetail(id?: string) {
  return useQuery({ queryKey: ['regulatory', 'jurisdiction', id], queryFn: () => regulatoryJurisdictionService.detail(id as string), enabled: Boolean(id), refetchOnWindowFocus: false });
}
