'use client';

import { useState } from 'react';
import { useTrainingSettings, useTrainingSettingsMutation } from '../hooks/useTrainingSettings';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

const policyToggles = [
  ['require_site_assignment_for_active_worker', 'Require site assignment for active worker'],
  ['require_role_assignment_for_active_worker', 'Require role assignment for active worker'],
  ['allow_worker_without_user_account', 'Allow worker without user account'],
  ['contractor_access_requires_site_assignment', 'Contractor access requires site assignment'],
  ['safety_critical_worker_requires_review', 'Safety-critical worker requires review']
] as const;

export function TrainingSettingsPage() {
  const query = useTrainingSettings();
  const mutation = useTrainingSettingsMutation();
  const [value, setValue] = useState<Record<string, any>>({});
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const current = { ...(query.data ?? {}), ...value };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Training Settings</p><h1 className="mt-2 text-3xl font-bold">Settings Foundation</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">Company/site policy foundation for active worker assignment, role assignment, contractor access, and expiry warnings.</p></div><TrainingButton href="/training-competency/final-integration" variant="secondary">Final Integration</TrainingButton></div>
      {mutation.isError ? <TrainingErrorState message={mutation.error.message} /> : null}
      <TrainingCard title="Policy Controls" subtitle="Backend consumes these settings for readiness blockers.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Training expiry warning days" value={current.default_training_expiry_warning_days} onChange={(v) => setValue((old) => ({ ...old, defaultTrainingExpiryWarningDays: Number(v) }))} />
          <Field label="Certification expiry warning days" value={current.default_certification_expiry_warning_days} onChange={(v) => setValue((old) => ({ ...old, defaultCertificationExpiryWarningDays: Number(v) }))} />
          {policyToggles.map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(current[key])} onChange={(e) => setValue((old) => ({ ...old, [key]: e.target.checked }))} />{label}</label>)}
        </div>
        <div className="mt-4 flex justify-end"><TrainingButton disabled={mutation.isPending} onClick={() => mutation.mutate(current)}>{mutation.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton></div>
      </TrainingCard>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><input type="number" className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}
