'use client';

import { useQuery } from '@tanstack/react-query';
import { usageService } from '../services/usage.service';

export function useUsage() {
  return useQuery({ queryKey: ['billing', 'usage'], queryFn: usageService.company });
}
