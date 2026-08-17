'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';
import { useTrainingRecordSettings } from '../hooks/useTrainingRecordSettings';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingRecordsHeader } from './TrainingRecordsHeader';

export function TrainingRecordSettingsPage() {
  const qc = useQueryClient();
  const query = useTrainingRecordSettings();
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => setForm(query.data?.settings ?? query.data ?? {}), [query.data]);
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.updateSettings(data), onSuccess: () => void qc.invalidateQueries({ queryKey: ['training-records', 'settings'] }) });
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const keys = ['attendance_required_for_completion', 'evidence_required_for_safety_critical', 'verification_required_for_manual_records', 'approval_required_for_verified_records', 'lock_attendance_after_submit', 'manual_correction_requires_reason', 'cross_site_worker_requires_permission', 'document_control_required_for_certificates', 'audit_downloads_exports'];
  return <div className="space-y-5"><TrainingRecordsHeader title="Training Record Settings" /><TrainingCard title="Policy Controls" subtitle="Company/site settings drive backend attendance, completion, verification, approval, evidence and lock rules."><div className="grid gap-3 md:grid-cols-2">{keys.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))} />{key.replace(/_/g, ' ')}</label>)}</div><div className="mt-4"><TrainingButton onClick={() => mutation.mutate(form)} disabled={mutation.isPending} title={mutation.isPending ? 'Settings save is already running.' : 'Save backend policy settings.'}>{mutation.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton></div>{mutation.error ? <div className="mt-3"><TrainingErrorState message={mutation.error} /></div> : null}</TrainingCard></div>;
}
