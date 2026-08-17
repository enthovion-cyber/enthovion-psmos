import { useQuery } from '@tanstack/react-query';
import { psiUnitService } from '../services/psi-unit.service';

export function usePsiUnitFormLookups(params: { siteId?: string | null; departmentId?: string | null; areaId?: string | null; userSearch?: string; equipmentSearch?: string }) {
  const siteId = params.siteId ?? '';
  const departmentId = params.departmentId ?? '';
  const areaId = params.areaId ?? '';
  const userSearch = params.userSearch ?? '';
  const equipmentSearch = params.equipmentSearch ?? '';
  const sites = useQuery({ queryKey: ['psi', 'unit-form', 'sites'], queryFn: () => psiUnitService.unitFormSites(), staleTime: 300_000 });
  const departments = useQuery({ queryKey: ['psi', 'unit-form', 'departments', siteId], queryFn: () => psiUnitService.unitFormDepartments({ siteId }), staleTime: 120_000 });
  const areas = useQuery({ queryKey: ['psi', 'unit-form', 'areas', siteId, departmentId], queryFn: () => psiUnitService.unitFormAreas({ siteId, departmentId }), staleTime: 120_000 });
  const users = useQuery({ queryKey: ['psi', 'unit-form', 'users', siteId, userSearch], queryFn: () => psiUnitService.unitFormUsers({ siteId, search: userSearch }), staleTime: 60_000 });
  const equipment = useQuery({ queryKey: ['psi', 'unit-form', 'equipment', siteId, areaId, equipmentSearch], queryFn: () => psiUnitService.unitFormEquipment({ siteId, areaId, search: equipmentSearch }), enabled: Boolean(siteId), staleTime: 60_000 });
  return {
    sites,
    departments,
    areas,
    users,
    equipment,
    isLoading: sites.isLoading || departments.isLoading || areas.isLoading || users.isLoading || equipment.isLoading,
    error: sites.error ?? departments.error ?? areas.error ?? users.error ?? equipment.error
  };
}
