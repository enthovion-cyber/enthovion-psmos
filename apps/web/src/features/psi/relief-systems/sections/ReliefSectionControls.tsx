export const inputClass = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm disabled:opacity-70';

export function TextField({ label, name, value, onChange, type = 'text', required = false }: { label: string; name: string; value: unknown; onChange: (patch: Record<string, unknown>) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-1 text-xs font-semibold text-[var(--psm-muted)]">{label}<input required={required} type={type} value={String(value ?? '')} onChange={(e) => onChange({ [name]: type === 'number' ? Number(e.target.value) : e.target.value })} className={inputClass} /></label>;
}

export function TextAreaField({ label, name, value, onChange }: { label: string; name: string; value: unknown; onChange: (patch: Record<string, unknown>) => void }) {
  return <label className="grid gap-1 text-xs font-semibold text-[var(--psm-muted)] md:col-span-3">{label}<textarea value={String(value ?? '')} onChange={(e) => onChange({ [name]: e.target.value })} className={`${inputClass} min-h-20`} /></label>;
}

export function SelectField({ label, name, value, options, onChange, required = false }: { label: string; name: string; value: unknown; options: string[]; onChange: (patch: Record<string, unknown>) => void; required?: boolean }) {
  return <label className="grid gap-1 text-xs font-semibold text-[var(--psm-muted)]">{label}<select required={required} value={String(value ?? '')} onChange={(e) => onChange({ [name]: e.target.value })} className={inputClass}><option value="">Select</option>{options.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

export function CheckboxField({ label, name, value, onChange }: { label: string; name: string; value: unknown; onChange: (patch: Record<string, unknown>) => void }) {
  return <label className={`${inputClass} flex items-center gap-2 text-sm`}><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange({ [name]: e.target.checked })} /> {label}</label>;
}
