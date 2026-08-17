'use client';

import { useState } from 'react';
import { usePssrTrainingSettings } from '../hooks/usePssrTrainingSettings';
import { pssrTrainingService } from '../services/pssr-training.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { MiniField, PanelGrid } from './PssrTrainingPanelPrimitives';

export function PssrTrainingSettingsPage() {
  const query = usePssrTrainingSettings();
  const [saving, setSaving] = useState(false);
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const settings = query.data ?? {};
  async function save() {
    setSaving(true);
    try {
      await pssrTrainingService.updateSettings(settings);
      await query.refetch();
    } finally {
      setSaving(false);
    }
  }
  return <div className="space-y-6"><TrainingPssrHeader title="PSSR Training Settings" /><TrainingCard title="Policy Snapshot" subtitle="Company/site PSSR training policy returned by backend."><PanelGrid><MiniField label="Default due days" value={settings.default_due_days} /><MiniField label="Block approval until complete" value={settings.block_approval_until_complete} /><MiniField label="Block handover until verified" value={settings.block_handover_until_verified} /><MiniField label="Startup block enabled" value={settings.startup_block_enabled} /><MiniField label="Waivers allowed" value={settings.waivers_allowed} /><MiniField label="Evidence required" value={settings.evidence_required} /></PanelGrid><div className="mt-4"><TrainingButton onClick={save} disabled={saving} title={saving ? 'Saving PSSR training settings.' : undefined}>{saving ? 'Saving...' : 'Save Settings'}</TrainingButton></div></TrainingCard></div>;
}

