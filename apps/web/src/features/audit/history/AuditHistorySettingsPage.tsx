'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { auditHistoryService } from '../services/audit-history.service';
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState, Field, inputClass } from '../shared/AuditUi';

export function AuditHistorySettingsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['audit', 'trend-settings'], queryFn: () => auditHistoryService.settings() });
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => auditHistoryService.updateSettings(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'trend-settings'] }) });
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={6} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const settings = draft ?? query.data ?? {};
  const set = (key: string, value: unknown) => setDraft((current) => ({ ...(current ?? query.data ?? {}), [key]: value }));
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Audit Trend Settings" subtitle="Company/site scoped repeat detection windows, similarity, staleness, auto-clustering, and notification foundation." /><AuditCard title="Trend settings" subtitle="Settings changes are backend-audited and write Audit trend history events."><div className="grid gap-4 md:grid-cols-2"><Field label="Repeat detection window days"><input className={inputClass()} type="number" value={Number(settings.repeat_detection_window_days ?? 1095)} onChange={(event) => set('repeat_detection_window_days', Number(event.target.value))} /></Field><Field label="Repeat after CAPA window days"><input className={inputClass()} type="number" value={Number(settings.repeat_after_capa_window_days ?? 1095)} onChange={(event) => set('repeat_after_capa_window_days', Number(event.target.value))} /></Field><Field label="Minimum matches for recurring issue"><input className={inputClass()} type="number" value={Number(settings.minimum_matches_for_recurring_issue ?? 2)} onChange={(event) => set('minimum_matches_for_recurring_issue', Number(event.target.value))} /></Field><Field label="Minimum matches for systemic issue"><input className={inputClass()} type="number" value={Number(settings.minimum_matches_for_systemic_issue ?? 3)} onChange={(event) => set('minimum_matches_for_systemic_issue', Number(event.target.value))} /></Field><Field label="Similarity threshold"><input className={inputClass()} type="number" step="0.01" min="0" max="1" value={Number(settings.similarity_threshold ?? 0.75)} onChange={(event) => set('similarity_threshold', Number(event.target.value))} /></Field>{['enable_similarity_matching', 'require_review_for_repeat_confirmation', 'auto_detect_repeat_findings', 'auto_create_recurring_issue_cluster', 'auto_create_improvement_opportunity', 'auto_mark_trends_stale_on_source_change', 'auto_notify_owner_on_critical_trend', 'auto_notify_audit_lead_on_repeat_after_capa'].map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => set(key, event.target.checked)} />{key.replaceAll('_', ' ')}</label>)}</div><div className="mt-4"><AuditButton onClick={() => mutation.mutate(settings)} disabled={mutation.isPending} title="Save audited trend settings">{mutation.isPending ? 'Saving...' : 'Save Settings'}</AuditButton></div></AuditCard>{mutation.isError ? <AuditErrorState message={mutation.error} /> : null}</div></AuditLayout>;
}
