'use client';

import { useState } from 'react';
import { useSopAckSettings, useSopAckSettingsMutation } from '../hooks/useSopAckSettings';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckHeader } from './SopAckHeader';

export function SopAckSettingsPage() {
  const query = useSopAckSettings();
  const mutation = useSopAckSettingsMutation();
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const values = draft ?? query.data ?? {};
  return <div className="space-y-5"><SopAckHeader title="SOP Acknowledgement Settings" subtitle="Company/site policy for due dates, re-acknowledgement, current-version gaps, blockers, verification, waivers and sync behavior." actions={false} /><TrainingCard title="Policy JSON"><textarea value={JSON.stringify(values, null, 2)} onChange={(event) => { try { setDraft(JSON.parse(event.target.value)); } catch { setDraft({ raw: event.target.value }); } }} className="min-h-96 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-xs" /><div className="mt-3"><TrainingButton disabled={!draft || mutation.isPending} title={!draft ? 'No unsaved settings changes.' : 'Save backend settings.'} onClick={() => mutation.mutate(draft ?? {})}>{mutation.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton></div></TrainingCard></div>;
}
