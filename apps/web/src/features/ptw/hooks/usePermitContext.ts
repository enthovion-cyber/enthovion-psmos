import { useQuery } from '@tanstack/react-query';
import { ptwService } from '@/services/ptw.service';

export function usePermitContext() {
  const context = useQuery({ queryKey: ['ptw', 'new', 'context'], queryFn: () => ptwService.newContext() });
  const equipment = useQuery({ queryKey: ['ptw', 'new', 'equipment-search', ''], queryFn: () => ptwService.equipmentSearch('') });
  const activePermits = useQuery({ queryKey: ['ptw', 'new', 'active-permits'], queryFn: () => ptwService.list({ status: 'Active', limit: '100' }) });

  return {
    context,
    equipment,
    activePermits,
    isLoading: context.isLoading || equipment.isLoading || activePermits.isLoading,
    isError: context.isError || equipment.isError || activePermits.isError
  };
}
