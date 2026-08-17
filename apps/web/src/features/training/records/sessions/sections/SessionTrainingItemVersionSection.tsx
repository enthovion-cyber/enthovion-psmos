'use client';

import { TrainingCard, TrainingBadge } from '../../../shared/TrainingUi';
import { Field, SectionProps, Select } from './SessionIdentitySection';

export function SessionTrainingItemVersionSection({ form, update, context }: SectionProps) {
  const item = context?.requiredTraining?.find((row: any) => row.id === (form.trainingItemId ?? form.training_item_id));
  return (
    <TrainingCard title="2. Training Item / Version" subtitle="Links to Required Training Library and snapshots critical flags, evidence policy, recurrence, and objective.">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Required Training item" value={form.trainingItemId ?? form.training_item_id ?? ''} options={context?.requiredTraining?.map((t: any) => ({ value: t.id, label: `${t.training_code} - ${t.training_title}` }))} onChange={(v) => update({ trainingItemId: v })} />
        <Field label="Legacy/manual training reference" value={form.legacyTrainingTitle} onChange={(v) => update({ legacyTrainingTitle: v })} />
        <Field label="Training version" value={form.trainingItemVersion ?? item?.version ?? ''} onChange={(v) => update({ trainingItemVersion: v })} />
        <Field label="Superseded version reason if applicable" value={form.supersededVersionReason} onChange={(v) => update({ supersededVersionReason: v })} />
      </div>
      {item ? <div className="mt-4 flex flex-wrap gap-2"><TrainingBadge>{item.training_category}</TrainingBadge><TrainingBadge>{item.training_type}</TrainingBadge>{item.safety_critical ? <TrainingBadge tone="danger">Safety-critical</TrainingBadge> : null}{item.psm_critical ? <TrainingBadge tone="warn">PSM-critical</TrainingBadge> : null}{item.ptw_critical ? <TrainingBadge tone="warn">PTW-critical</TrainingBadge> : null}<TrainingBadge>{item.evidence_policy_status}</TrainingBadge><TrainingBadge>{item.recurrence_type}</TrainingBadge></div> : <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Library link missing is allowed only for legacy/imported records and requires reason before scheduling.</div>}
    </TrainingCard>
  );
}
