'use client';

import { KeyValueGrid, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

type Props = {
  form: Record<string, any>;
  initial?: Record<string, any> | undefined;
  equipmentLocked?: boolean | undefined;
  onChange: (key: string, value: unknown) => void;
};

export function EquipmentContextSection({ form, initial, equipmentLocked, onChange }: Props) {
  return (
    <SectionCard title="1. Equipment Context" description="Select the exact equipment record and confirm the current MI context used by the backend readiness engine.">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-3">
          <label className="text-sm font-semibold">Equipment ID
            <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.equipmentId} onChange={(event) => onChange('equipmentId', event.target.value)} disabled={Boolean(equipmentLocked)} />
          </label>
          <label className="text-sm font-semibold">Assessment reason
            <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.assessmentReason} onChange={(event) => onChange('assessmentReason', event.target.value)}>
              {(form.assessmentReasons ?? ['Manual review']).map((item: string) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Assessment date
            <input type="date" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.assessmentDate} onChange={(event) => onChange('assessmentDate', event.target.value)} />
          </label>
        </div>
        <KeyValueGrid items={[
          ['Assessment number', initial?.assessment_number],
          ['Current equipment status', initial?.current_equipment_status],
          ['Previous readiness decision', initial?.previous_readiness_decision],
          ['Assessment workflow status', initial?.status ?? 'Draft']
        ]} />
      </div>
    </SectionCard>
  );
}
