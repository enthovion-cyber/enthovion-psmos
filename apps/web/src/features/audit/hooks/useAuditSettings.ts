import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auditSettingsService, type AuditSettingsSection } from '../services/audit-settings.service';

export function useAuditSettings() {
  return useQuery({ queryKey: ['audit', 'settings', 'consolidated'], queryFn: auditSettingsService.getConsolidated });
}

export function useAuditSettingsSummary() {
  return useQuery({ queryKey: ['audit', 'settings', 'summary'], queryFn: auditSettingsService.summary });
}

export function useAuditSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ section, payload }: { section: AuditSettingsSection; payload: Record<string, unknown> }) => auditSettingsService.updateSection(section, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'settings'] }),
  });
}
