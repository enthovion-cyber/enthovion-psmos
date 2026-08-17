import type { ReactNode } from 'react';
import { RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';

export function RegulatoryFormSection({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <RegulatoryCard title={title} subtitle={subtitle}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div></RegulatoryCard>;
}

export function RegulatoryTextField({ label, name, form, setForm, helper, type = 'text', required }: { label: string; name: string; form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; helper?: string | undefined; type?: string | undefined; required?: boolean | undefined }) {
  return (
    <RegulatoryField label={`${label}${required ? ' *' : ''}`} helper={helper}>
      <input type={type} className={regulatoryInputClass()} value={String(form[name] ?? '')} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
    </RegulatoryField>
  );
}

export function RegulatorySelectField({ label, name, options, form, setForm, helper, required }: { label: string; name: string; options?: string[] | undefined; form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; helper?: string | undefined; required?: boolean | undefined }) {
  return (
    <RegulatoryField label={`${label}${required ? ' *' : ''}`} helper={helper}>
      <select className={regulatoryInputClass()} value={String(form[name] ?? '')} onChange={(event) => setForm({ ...form, [name]: event.target.value })}>
        <option value="">Select</option>
        {(options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </RegulatoryField>
  );
}

export function RegulatoryTextareaField({ label, name, form, setForm, helper, required }: { label: string; name: string; form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; helper?: string | undefined; required?: boolean | undefined }) {
  return (
    <RegulatoryField label={`${label}${required ? ' *' : ''}`} helper={helper}>
      <textarea rows={4} className={regulatoryInputClass()} value={String(form[name] ?? '')} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
    </RegulatoryField>
  );
}
