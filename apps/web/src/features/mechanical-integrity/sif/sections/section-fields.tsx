import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function TextField({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label className="space-y-1 text-sm"><span className="font-semibold">{label}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>;
}

export function TextArea({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-sm"><span className="font-semibold">{label}</span><textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>;
}

export function SelectField({ label, value, options, onChange }: { label: string; value: any; options: string[]; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-sm"><span className="font-semibold">{label}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: any; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <SectionCard title={title} description={description}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div></SectionCard>;
}
