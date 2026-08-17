'use client';

import { useState } from 'react';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingApprovalSettings, useTrainingApprovalSettingsMutations } from '../hooks/useTrainingApprovalSettings';
import { TrainingReviewHeader } from './TrainingReviewHeader';

const toggles = ['require_approval_for_safety_critical_profiles','require_approval_for_required_training','require_approval_for_safety_critical_training_records','require_approval_for_safety_critical_certificates','require_approval_for_assessment_overrides','require_approval_for_sop_ack_waivers','require_approval_for_moc_training_waivers','require_approval_for_pssr_training_waivers','require_approval_for_ptw_authorizations','require_approval_for_ptw_emergency_override','require_approval_for_restricted_reports','require_esign_for_safety_critical_approval','auto_escalate_overdue_approvals','auto_lock_source_after_approval','stale_approval_blocks_decision'];
export function TrainingApprovalSettingsPage() {
  const query = useTrainingApprovalSettings();
  const mutations = useTrainingApprovalSettingsMutations();
  const [patch, setPatch] = useState<Record<string, any>>({});
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const current = { ...(query.data ?? {}), ...patch };
  return <div className="space-y-5"><TrainingReviewHeader title="Review & Approval Settings" subtitle="Site/company policy for safety-critical reviews, waivers, e-signatures, SLA escalation, locking, and stale package blocking." onRefresh={() => query.refetch()} />{mutations.updateSettings.isError ? <TrainingErrorState message={mutations.updateSettings.error} /> : null}<TrainingCard title="Policy Controls"><label className="text-sm font-semibold">Default approval SLA hours<input type="number" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={current.default_approval_sla_hours ?? 72} onChange={(e) => setPatch((old) => ({ ...old, default_approval_sla_hours: Number(e.target.value) }))} /></label><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{toggles.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(current[key])} onChange={(e) => setPatch((old) => ({ ...old, [key]: e.target.checked }))} />{key.replaceAll('_', ' ')}</label>)}</div><div className="mt-4 flex justify-end"><TrainingButton disabled={mutations.updateSettings.isPending} onClick={() => mutations.updateSettings.mutate(current)}>{mutations.updateSettings.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton></div></TrainingCard></div>;
}
