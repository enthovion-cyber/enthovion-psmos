'use client';

import { useQuery } from '@tanstack/react-query';
import { mocEngineeringService } from '../services/moc-engineering.service';

export function useMOCEngineeringPackage(id: string) {
  return useQuery({ queryKey: ['moc', id, 'engineering-package'], queryFn: () => mocEngineeringService.package(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}
