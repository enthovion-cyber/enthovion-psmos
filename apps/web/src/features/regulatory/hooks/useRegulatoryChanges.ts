import { useQuery } from '@tanstack/react-query';
import { regulatoryChangeService } from '../changes/service';
export const useRegulatoryChanges = (params?: Record<string, unknown>) => useQuery({ queryKey: ['regulatory', 'changes', params], queryFn: () => regulatoryChangeService.register(params), refetchOnWindowFocus: false });
export const useRegulatoryChangeDashboard = () => useQuery({ queryKey: ['regulatory', 'changes', 'dashboard'], queryFn: () => regulatoryChangeService.dashboard(), refetchOnWindowFocus: false });
