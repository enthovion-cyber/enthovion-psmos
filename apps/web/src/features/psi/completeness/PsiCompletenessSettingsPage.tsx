'use client';

import { useState } from 'react';
import { usePsiCompletenessSettings, usePsiCompletenessSettingsMutation } from '../hooks/usePsiCompletenessSettings';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';

export function PsiCompletenessSettingsPage() {
  const settings = usePsiCompletenessSettings();
  const save = usePsiCompletenessSettingsMutation();
  const [local, setLocal] = useState<Record<string, unknown>>({});
  if (settings.isLoading) return <PsiLoadingState rows={4} />;
  if (settings.isError) return <PsiErrorState message="Completeness settings could not be loaded." onRetry={() => settings.refetch()} />;
  const data: Record<string, unknown> = { ...(settings.data ?? {}), ...local };
  return <div className="space-y-5"><PsiCompletenessHeader title="Completeness Settings" subtitle="Site/company scoring caps, automation, PSSR blocker, notification, waiver, and scheduled run policy." /><PsiCard title="Engine Policy"><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm"><span>Scoring method</span><input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3" value={String(data.scoring_method ?? '')} onChange={(e) => setLocal((current) => ({ ...current, scoring_method: e.target.value }))} /></label><label className="space-y-1 text-sm"><span>PSSR blocker score cap</span><input type="number" className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3" value={Number(data.pssr_blocker_score_cap ?? 74)} onChange={(e) => setLocal((current) => ({ ...current, pssr_blocker_score_cap: Number(e.target.value) }))} /></label>{['auto_create_actions','auto_notify_owners','auto_create_pssr_blockers','allow_critical_waivers','require_esign_for_waiver','scheduled_run_enabled'].map((key) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(data[key])} onChange={(e) => setLocal((current) => ({ ...current, [key]: e.target.checked }))} /> {key.replaceAll('_', ' ')}</label>)}<div className="md:col-span-2"><PsiButton disabled={save.isPending} onClick={() => save.mutate(local)}>{save.isPending ? 'Saving...' : 'Save Settings'}</PsiButton></div></div></PsiCard></div>;
}
