'use client';

import { useState } from 'react';
import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass, formatRegulatoryError } from './shared/RegulatoryUi';
import { useRegulatorySettings, useRegulatorySettingsMutation } from './hooks/useRegulatorySettings';

export function RegulatorySettingsPage() {
  const query = useRegulatorySettings();
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const updateSettings = useRegulatorySettingsMutation();
  const settings = form ?? query.data ?? {};
  async function save() {
    try {
      await updateSettings.mutateAsync(settings);
      setForm(null);
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }
  if (query.isLoading) return <RegulatoryLayout current="Settings"><RegulatoryLoadingState rows={6} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Settings"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Settings">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory Settings" subtitle="Company/site configuration for Phase 1 register validation and review foundation." onRefresh={() => query.refetch()} />
        <RegulatoryCard title="Foundation Settings" subtitle="Backend enforces these settings during create/update/status changes.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {['require_owner_for_active_item', 'require_review_date_for_active_item', 'require_risk_basis_for_critical_item', 'require_rationale_for_not_applicable'].map((key) => <RegulatoryField key={key} label={key.replace(/_/g, ' ')}><select className={regulatoryInputClass()} value={String(settings[key] ?? false)} onChange={(event) => setForm({ ...settings, [key]: event.target.value === 'true' })}><option value="false">No</option><option value="true">Yes</option></select></RegulatoryField>)}
            <RegulatoryField label="Default review frequency"><input className={regulatoryInputClass()} value={String(settings.default_review_frequency ?? '')} onChange={(event) => setForm({ ...settings, default_review_frequency: event.target.value })} /></RegulatoryField>
          </div>
          <div className="mt-4"><RegulatoryButton disabled={updateSettings.isPending} onClick={() => void save()}>{updateSettings.isPending ? 'Saving...' : 'Save Settings'}</RegulatoryButton></div>
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
