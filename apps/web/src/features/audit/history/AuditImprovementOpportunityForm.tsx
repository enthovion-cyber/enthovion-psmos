'use client';

import { useState } from 'react';
import { AuditButton, Field, inputClass } from '../shared/AuditUi';
import { validateImprovementOpportunity } from '../schemas/audit-continuous-improvement.schema';

export function AuditImprovementOpportunityForm({ saving, onSubmit }: { saving?: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState<Record<string, unknown>>({ opportunityType: 'Preventive Action Opportunity', opportunityStatus: 'Open' });
  const errors = validateImprovementOpportunity(form);
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (!errors.length) onSubmit(form); }}><div className="grid gap-3 md:grid-cols-2"><Field label="Opportunity title"><input className={inputClass()} value={String(form.opportunityTitle ?? '')} onChange={(event) => set('opportunityTitle', event.target.value)} /></Field><Field label="Opportunity type"><select className={inputClass()} value={String(form.opportunityType ?? '')} onChange={(event) => set('opportunityType', event.target.value)}>{['Preventive Action Opportunity', 'Training Improvement', 'Procedure Revision', 'PTW Control Improvement', 'MOC Process Improvement', 'PSSR Readiness Improvement', 'PSI Completeness Improvement', 'MI Program Improvement', 'Evidence Collection Improvement', 'Audit Checklist Improvement', 'Standard Mapping Improvement', 'CAPA Effectiveness Improvement', 'Review SLA Improvement', 'Management Review Topic', 'Custom'].map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Manual creation reason"><textarea className={inputClass()} value={String(form.manualCreationReason ?? '')} onChange={(event) => set('manualCreationReason', event.target.value)} /></Field><Field label="Recommended action"><textarea className={inputClass()} value={String(form.recommendedAction ?? '')} onChange={(event) => set('recommendedAction', event.target.value)} /></Field></div>{errors.length ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors.join(' ')}</div> : null}<AuditButton type="submit" disabled={saving || errors.length > 0} title={errors[0] ?? 'Create CI opportunity'}>{saving ? 'Saving...' : 'Create Opportunity'}</AuditButton></form>;
}
