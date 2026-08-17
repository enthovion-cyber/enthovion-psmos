'use client';

import { useState } from 'react';
import { TrainingButton, TrainingCard, TrainingEmptyState } from '../../../shared/TrainingUi';
import { Field, SectionProps, Select } from './SessionIdentitySection';

export function SessionLinksPurposeSection({ form, update, context }: SectionProps) {
  const [link, setLink] = useState<Record<string, any>>({ linkedModule: 'Training Matrix gap', required: true });
  const links = form.links ?? [];
  return (
    <TrainingCard title="7. Links / Purpose" subtitle="Link gaps, blockers, PTW/MOC/PSSR readiness, SOP, PSI, HAZOP, incidents, equipment, or Document Control evidence without duplicating source systems.">
      <div className="grid gap-3 md:grid-cols-4">
        <Select label="Link type" value={link.linkedModule} options={context?.lookups?.['training-record-link-types']} onChange={(v) => setLink((c) => ({ ...c, linkedModule: v }))} />
        <Field label="Source record ID" value={link.linkedRecordId} onChange={(v) => setLink((c) => ({ ...c, linkedRecordId: v }))} />
        <Field label="Relationship reason" value={link.relationshipReason} onChange={(v) => setLink((c) => ({ ...c, relationshipReason: v }))} />
        <div className="self-end"><TrainingButton onClick={() => { if (link.linkedModule && link.linkedRecordId) update({ links: [...links, link] }); }}>Add link</TrainingButton></div>
      </div>
      {!links.length ? <TrainingEmptyState title="No linked gaps or blockers" message="Add linked matrix, competency, PTW, MOC, PSSR, SOP, PSI, HAZOP, incident, equipment, or document records when applicable." /> : <div className="mt-4 divide-y divide-[var(--psm-line)]">{links.map((row: any, i: number) => <div key={`${row.linkedModule}-${i}`} className="flex items-center justify-between py-2 text-sm"><span>{row.linkedModule} - {row.linkedRecordId}</span><button type="button" className="text-danger" onClick={() => update({ links: links.filter((_: any, idx: number) => idx !== i) })}>Remove</button></div>)}</div>}
    </TrainingCard>
  );
}
