'use client';

import { useState } from 'react';
import { useMatrixSettings, useMatrixSettingsMutation } from '../hooks/useMatrixSettings';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';

const toggles = ['auto_evaluate_on_worker_change','auto_evaluate_on_rule_change','auto_create_actions_for_critical_gaps','auto_notify_workers','auto_notify_supervisors','block_ptw_on_required_training_gap','block_moc_on_required_training_gap','block_pssr_on_required_training_gap','allow_safety_critical_waivers','require_esign_for_blocker_waiver','scheduled_matrix_run_enabled'] as const;

export function TrainingMatrixSettingsPage() {
  const query = useMatrixSettings();
  const mutation = useMatrixSettingsMutation();
  const [patch, setPatch] = useState<Record<string, any>>({});
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const current = { ...(query.data ?? {}), ...patch };
  return <div className="space-y-5"><TrainingMatrixHeader title="Training Matrix Settings" subtitle="Company/site policy controls for expiry, blockers, automatic actions, notifications, waivers, and scheduled runs." />{mutation.isError ? <TrainingErrorState message={mutation.error.message} /> : null}<TrainingCard title="Policy Controls"><div className="grid gap-3 md:grid-cols-2"><Field label="Default expiry warning days" value={current.default_expiry_warning_days} onChange={(v) => setPatch((old) => ({ ...old, default_expiry_warning_days: Number(v) }))} /><Field label="Default grace period days" value={current.default_grace_period_days} onChange={(v) => setPatch((old) => ({ ...old, default_grace_period_days: Number(v) }))} />{toggles.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(current[key])} onChange={(e) => setPatch((old) => ({ ...old, [key]: e.target.checked }))} />{key.replaceAll('_', ' ')}</label>)}<Field label="Scheduled run frequency" value={current.scheduled_matrix_run_frequency} onChange={(v) => setPatch((old) => ({ ...old, scheduled_matrix_run_frequency: v }))} /></div><div className="mt-4 flex justify-end"><TrainingButton disabled={mutation.isPending} onClick={() => mutation.mutate(current)} title={mutation.isPending ? 'Saving matrix settings' : ''}>{mutation.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton></div></TrainingCard></div>;
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) { return <label className="text-sm font-semibold">{label}<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>; }
