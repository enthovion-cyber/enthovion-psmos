'use client';

import { useState } from 'react';
import { ActionButton, PrimaryButton } from './SafeguardUiPrimitives';
import { CheckboxField, FormSection, SelectField, TextArea, TextField } from '../sif/sections/section-fields';

export function SafeguardSimpleForm({ kind, mode, initial, saving, onSubmit, onCancel }: { kind: 'Interlock' | 'Critical Alarm'; mode: 'create' | 'edit'; initial?: Record<string, any>; saving?: boolean; onSubmit: (input: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>(() => initial ?? { status: 'Draft', safetyCritical: true, psmCritical: true });
  const set = (patch: Record<string, any>) => setForm((current) => ({ ...current, ...patch }));
  const tagKey = kind === 'Interlock' ? 'interlockTag' : 'alarmTag';
  const nameKey = kind === 'Interlock' ? 'interlockName' : 'alarmName';
  return (
    <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); await onSubmit(form); }}>
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{mode === 'create' ? `Create ${kind}` : `Edit ${kind}`}</p>
        <h1 className="text-2xl font-bold">{kind} Specification</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Identification, cause/effect, equipment, schedule, bypass foundation, document links, readiness, and review workflow.</p>
      </header>
      <FormSection title={`${kind} Identification`}>
        <TextField label={`${kind} tag`} value={form[tagKey] ?? form[tagKey.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]} onChange={(value) => set({ [tagKey]: value })} />
        <TextField label={`${kind} name`} value={form[nameKey]} onChange={(value) => set({ [nameKey]: value })} />
        <SelectField label="Status" value={form.status} options={['Draft', 'Active', 'Degraded', 'Out of Service', 'Archived']} onChange={(status) => set({ status })} />
        <TextField label="Company ID" value={form.companyId ?? form.company_id} onChange={(companyId) => set({ companyId })} />
        <TextField label="Site ID" value={form.siteId ?? form.site_id} onChange={(siteId) => set({ siteId })} />
        <TextField label="Equipment ID" value={form.equipmentId ?? form.equipment_id} onChange={(equipmentId) => set({ equipmentId })} />
        <TextArea label="Description / basis" value={form.description} onChange={(description) => set({ description })} />
        <CheckboxField label="Safety critical" checked={form.safetyCritical ?? form.safety_critical} onChange={(safetyCritical) => set({ safetyCritical })} />
        <CheckboxField label="PSM critical" checked={form.psmCritical ?? form.psm_critical} onChange={(psmCritical) => set({ psmCritical })} />
      </FormSection>
      <FormSection title="Cause / Effect / Response">
        <TextArea label="Cause / input" value={form.causeInput ?? form.cause_input} onChange={(causeInput) => set({ causeInput })} />
        <TextArea label="Effect / output action" value={form.effectOutput ?? form.effect_output} onChange={(effectOutput) => set({ effectOutput })} />
        <TextField label="Trip / alarm setpoint" value={form.setpoint} onChange={(setpoint) => set({ setpoint })} />
        <TextArea label="Operator response" value={form.operatorResponse ?? form.operator_response} onChange={(operatorResponse) => set({ operatorResponse })} />
      </FormSection>
      <FormSection title="Schedule / Bypass / Readiness">
        <TextField label="Last test date" type="date" value={form.lastTestDate ?? form.last_test_date} onChange={(lastTestDate) => set({ lastTestDate })} />
        <TextField label="Next test due date" type="date" value={form.nextTestDueDate ?? form.next_test_due_date} onChange={(nextTestDueDate) => set({ nextTestDueDate })} />
        <SelectField label="Due status" value={form.dueStatus ?? form.due_status} options={['Not Scheduled', 'On Track', 'Due Soon', 'Overdue']} onChange={(dueStatus) => set({ dueStatus })} />
        <CheckboxField label="Bypass allowed" checked={form.bypassAllowed ?? form.bypass_allowed} onChange={(bypassAllowed) => set({ bypassAllowed })} />
        <CheckboxField label="Startup blocked when impaired" checked={form.startupBlocked ?? form.startup_blocked} onChange={(startupBlocked) => set({ startupBlocked })} />
        <TextArea label="Compensating measures" value={form.compensatingMeasures ?? form.compensating_measures} onChange={(compensatingMeasures) => set({ compensatingMeasures })} />
      </FormSection>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-bg)] py-4"><ActionButton onClick={onCancel}>Cancel</ActionButton><PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</PrimaryButton></div>
    </form>
  );
}
