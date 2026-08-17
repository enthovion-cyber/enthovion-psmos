'use client';

import { useState } from 'react';
import { AssessmentIdentificationSection } from './sections/AssessmentIdentificationSection';
import { EquipmentSnapshotSection } from './sections/EquipmentSnapshotSection';
import { SafetyPsmFlagsSection } from './sections/SafetyPsmFlagsSection';

export function CriticalityAssessmentForm({ equipmentId, snapshot, saving, onSave }: { equipmentId?: string | undefined; snapshot?: Record<string, unknown> | null | undefined; saving?: boolean | undefined; onSave: (form: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ equipmentId: equipmentId ?? '', assessmentType: 'Initial', assessmentReason: 'Criticality assessment' });
  const onChange = (patch: Record<string, any>) => setForm((current) => ({ ...current, ...patch }));
  return (
    <div className="space-y-4">
      <AssessmentIdentificationSection form={form} onChange={onChange} />
      <EquipmentSnapshotSection snapshot={snapshot ?? null} />
      <SafetyPsmFlagsSection form={form} onChange={onChange} />
      <section className="rounded-xl border border-border bg-card p-4">
        <label className="text-sm">Notes<textarea className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" rows={4} value={form.notes ?? ''} onChange={(e) => onChange({ notes: e.target.value })} /></label>
        <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={saving || !form.equipmentId || !form.assessmentReason} title={!form.equipmentId ? 'Equipment is required.' : !form.assessmentReason ? 'Assessment reason is required.' : undefined} onClick={() => onSave(form)}>{saving ? 'Creating...' : 'Create Assessment'}</button>
      </section>
    </div>
  );
}
