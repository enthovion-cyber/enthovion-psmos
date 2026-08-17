'use client';

import { useState } from 'react';
import { TrainingButton, TrainingCard, TrainingEmptyState } from '../../../shared/TrainingUi';
import { Field, SectionProps, Select } from './SessionIdentitySection';

export function SessionRosterSelectionSection({ form, update, context }: SectionProps) {
  const [workerId, setWorkerId] = useState('');
  const roster = form.roster ?? [];
  return (
    <TrainingCard title="5. Roster Selection" subtitle="Manual workers now; matrix-gap, role, PTW/MOC/PSSR, and required-training generation are available after session save.">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Select label="Worker" value={workerId} options={context?.workers?.map((w: any) => ({ value: w.id, label: `${w.display_name} - ${w.work_email ?? w.employee_id ?? w.worker_type}` }))} onChange={setWorkerId} />
        <div className="self-end"><TrainingButton onClick={() => { if (workerId && !roster.some((r: any) => r.workerId === workerId)) update({ roster: [...roster, { workerId, rosterStatus: 'Added', requiredBecause: 'Manual worker selection' }] }); }}>Add worker</TrainingButton></div>
      </div>
      {!roster.length ? <TrainingEmptyState title="No roster yet" message="Add workers manually or save the session and generate from Training Matrix gaps, Required Training assignment, or job role." /> : <div className="mt-4 divide-y divide-[var(--psm-line)]">{roster.map((row: any, i: number) => <div key={`${row.workerId}-${i}`} className="flex items-center justify-between py-2 text-sm"><span>{context?.workers?.find((w: any) => w.id === row.workerId)?.display_name ?? row.workerId}</span><button type="button" className="text-danger" onClick={() => update({ roster: roster.filter((_: any, idx: number) => idx !== i) })}>Remove</button></div>)}</div>}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="Required because" value={form.requiredBecause} onChange={(v) => update({ requiredBecause: v })} />
        <Field label="MOC/PSSR/PTW link optional" value={form.linkedNeed} onChange={(v) => update({ linkedNeed: v })} />
        <Select label="Roster status default" value={form.rosterStatus ?? 'Added'} options={context?.lookups?.['roster-statuses']} onChange={(v) => update({ rosterStatus: v })} />
      </div>
    </TrainingCard>
  );
}
