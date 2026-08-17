'use client';

import { TrainingCard } from '../../../shared/TrainingUi';

export function SessionIdentitySection({ form, update, context }: SectionProps) {
  return (
    <TrainingCard title="1. Session Identity" subtitle="Session title, code, type, scope, owner, status, and notes.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Session title" value={form.sessionTitle ?? form.session_title} onChange={(v) => update({ sessionTitle: v })} required />
        <Field label="Session code" value={form.sessionCode ?? form.session_code} onChange={(v) => update({ sessionCode: v })} />
        <Select label="Session type" value={form.sessionType ?? form.session_type ?? 'Classroom'} options={context?.lookups?.['session-types']} onChange={(v) => update({ sessionType: v })} />
        <Select label="Site" value={form.siteId ?? form.site_id ?? ''} options={context?.sites?.map((s: any) => ({ value: s.id, label: s.name ?? s.code ?? s.id }))} onChange={(v) => update({ siteId: v })} required />
        <Select label="Unit optional" value={form.unitId ?? form.unit_id ?? ''} options={context?.units?.map((u: any) => ({ value: u.id, label: u.name ?? u.code ?? u.id }))} onChange={(v) => update({ unitId: v })} />
        <Select label="Area optional" value={form.areaId ?? form.area_id ?? ''} options={context?.areas?.map((a: any) => ({ value: a.id, label: a.name ?? a.code ?? a.id }))} onChange={(v) => update({ areaId: v })} />
        <Field label="Department optional" value={form.departmentId ?? form.department_id} onChange={(v) => update({ departmentId: v })} />
        <Select label="Session owner" value={form.ownerUserId ?? form.owner_user_id ?? ''} options={context?.users?.map((u: any) => ({ value: u.id, label: `${u.displayName ?? u.email} - ${u.email}` }))} onChange={(v) => update({ ownerUserId: v })} required />
        <Select label="Session status" value={form.sessionStatus ?? form.session_status ?? 'Draft'} options={context?.lookups?.['session-statuses']} onChange={(v) => update({ sessionStatus: v })} />
        <textarea className="min-h-24 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm md:col-span-2" placeholder="Description / notes" value={form.description ?? ''} onChange={(e) => update({ description: e.currentTarget.value })} />
      </div>
    </TrainingCard>
  );
}

export type SectionProps = { form: Record<string, any>; update: (patch: Record<string, any>) => void; context?: Record<string, any> | undefined };

export function Field({ label, value, onChange, required, type = 'text' }: { label: string; value?: any; onChange: (v: string) => void; required?: boolean | undefined; type?: string | undefined }) {
  return <label className="text-sm font-semibold">{label}{required ? ' *' : ''}<input type={type} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-normal" value={value ?? ''} onChange={(e) => onChange(e.currentTarget.value)} /></label>;
}

export function Select({ label, value, options = [], onChange, required }: { label: string; value?: any; options?: Array<string | { value: string; label: string }> | undefined; onChange: (v: string) => void; required?: boolean | undefined }) {
  return <label className="text-sm font-semibold">{label}{required ? ' *' : ''}<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-normal" value={value ?? ''} onChange={(e) => onChange(e.currentTarget.value)}><option value="">Select</option>{options.map((option) => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
