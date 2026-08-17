'use client';

import { useState } from 'react';
import { useMocTrainingSettings } from '../hooks/useMocTrainingSettings';
import { mocTrainingService } from '../services/moc-training.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MiniField, PanelGrid } from './MocTrainingPanelPrimitives';

export function MocTrainingSettingsPage() {
  const query = useMocTrainingSettings();
  const [saving, setSaving] = useState(false);
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const settings = query.data ?? {};
  async function save() {
    setSaving(true);
    try {
      await mocTrainingService.updateSettings(settings);
      await query.refetch();
    } finally {
      setSaving(false);
    }
  }
  return <div className="space-y-6"><TrainingMocHeader title="MOC Training Settings" /><TrainingCard title="Policy Snapshot" subtitle="Company/site MOC training policy returned by backend."><PanelGrid><MiniField label="Default due days" value={settings.default_due_days} /><MiniField label="Block implementation until complete" value={settings.block_implementation_until_complete} /><MiniField label="Block closure until verified" value={settings.block_closure_until_verified} /><MiniField label="Startup block enabled" value={settings.startup_block_enabled} /><MiniField label="Waivers allowed" value={settings.waivers_allowed} /><MiniField label="Evidence required" value={settings.evidence_required} /></PanelGrid><div className="mt-4"><TrainingButton onClick={save} disabled={saving} title={saving ? 'Saving MOC training settings.' : undefined}>{saving ? 'Saving...' : 'Save Settings'}</TrainingButton></div></TrainingCard></div>;
}
