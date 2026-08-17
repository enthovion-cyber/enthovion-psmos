import { useQuery } from '@tanstack/react-query';
import { regulatoryJurisdictionService } from '../services/regulatory-jurisdiction.service';

export function useRegulatoryJurisdictionDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'jurisdictions', 'dashboard', params], queryFn: () => regulatoryJurisdictionService.dashboard(params), refetchOnWindowFocus: false });
}
