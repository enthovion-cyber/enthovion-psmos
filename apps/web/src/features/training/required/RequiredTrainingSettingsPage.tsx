'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { requiredTrainingService } from '../services/required-training.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { RequiredTrainingHeader } from './RequiredTrainingHeader';

const keys = ['owner_required', 'reviewer_required', 'evidence_policy_required', 'approved_document_required_for_safety_critical', 'matrix_link_required_for_active', 'competency_link_required_for_safety_critical', 'controlled_edit_requires_new_version', 'import_requires_review'];

export function RequiredTrainingSettingsPage() {
  const query = useQuery({ queryKey: ['required-training', 'settings'], queryFn: () => requiredTrainingService.settings() });
  const [form, setForm] = useState<Record<string, any>>({});
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => requiredTrainingService.updateSettings(data), onSuccess: (row) => setForm(row) });
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} />;
  const value = { ...(query.data ?? {}), ...form };
  return <div className="space-y-5"><RequiredTrainingHeader title="Required Training Settings" /><TrainingCard title="Policy controls" subtitle="Company/site rules that drive backend readiness, controlled edit, import review, document evidence, and sync expectations."><div className="grid gap-3 md:grid-cols-2">{keys.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><input type="checkbox" checked={Boolean(value[key])} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{key.replace(/_/g, ' ')}</label>)}<label className="block text-sm font-semibold">Review interval days<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" type="number" value={value.review_interval_days ?? 365} onChange={(e) => setForm({ ...form, review_interval_days: Number(e.target.value) || 365 })} /></label></div><div className="mt-4"><TrainingButton onClick={() => mutation.mutate(value)} disabled={mutation.isPending} title={mutation.isPending ? 'Settings save is already running.' : ''}>{mutation.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton></div>{mutation.error ? <div className="mt-3"><TrainingErrorState message={mutation.error} /></div> : null}</TrainingCard></div>;
}
