import { useQuery } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';

export function useCertificationDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'certifications', 'dashboard', filters], queryFn: () => certificationService.dashboard(filters) });
}

export function useCertifications(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'certifications', 'register', filters], queryFn: () => certificationService.register(filters) });
}

export function useFilteredCertifications(view: 'expiring' | 'expired' | 'missing' | 'pending-verification' | 'rejected' | 'safety-critical', filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'certifications', view, filters], queryFn: () => certificationService.filtered(view, filters) });
}
