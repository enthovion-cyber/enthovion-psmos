'use client';

import { KeyValueGrid, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

type Props = {
  form: Record<string, any>;
  linkedRecords?: Array<Record<string, unknown>>;
  onChange: (key: string, value: unknown) => void;
};

export function LinkedRecordsSection({ form, linkedRecords, onChange }: Props) {
  return (
    <SectionCard title="6. Linked Records" description="Link PSSR, MOC, deviation, work order, inspection, PSV/SIS test, document, or manual evidence without duplicating source data.">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3">
          <label className="text-sm font-semibold">Linked module
            <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.linkedModule} onChange={(event) => onChange('linkedModule', event.target.value)}>
              {['PSSR','MOC','Deviation','Work Order','Inspection','CML/TML Remaining Life','PM','Calibration','PSV','SIF/SIS','Bypass/Impairment','Document Control','Manual'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Linked record ID
            <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.linkedRecordId} onChange={(event) => onChange('linkedRecordId', event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Linked record number / label
            <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.linkedRecordNumber} onChange={(event) => onChange('linkedRecordNumber', event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Relationship type
            <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.relationshipType} onChange={(event) => onChange('relationshipType', event.target.value)} />
          </label>
        </div>
        {linkedRecords?.length ? <KeyValueGrid items={linkedRecords.map((record) => [String(record.linked_record_number ?? record.linked_record_id), `${record.linked_module ?? 'Record'} - ${record.relationship_type ?? 'Evidence'}`])} /> : <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">No linked records saved yet. Add a module and record ID before save to create the first link.</div>}
      </div>
    </SectionCard>
  );
}
