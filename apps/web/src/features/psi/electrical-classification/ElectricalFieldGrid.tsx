'use client';

type Field = { key: string; label: string; type?: 'text' | 'textarea' | 'checkbox' | 'date' | 'datetime-local' | 'number' | 'select'; options?: string[] };

export function ElectricalFieldGrid({ fields, value, onChange }: { fields: Field[]; value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => {
        if (field.type === 'checkbox') return <label key={field.key} className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm"><input type="checkbox" checked={Boolean(value[field.key])} onChange={(event) => onChange({ [field.key]: event.target.checked })} />{field.label}</label>;
        if (field.type === 'textarea') return <label key={field.key} className="md:col-span-2 xl:col-span-3 text-sm font-semibold">{field.label}<textarea className="mt-1 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 font-normal" value={String(value[field.key] ?? '')} onChange={(event) => onChange({ [field.key]: event.target.value })} /></label>;
        if (field.type === 'select') return <label key={field.key} className="text-sm font-semibold">{field.label}<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 font-normal" value={String(value[field.key] ?? '')} onChange={(event) => onChange({ [field.key]: event.target.value })}><option value="">Select...</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></label>;
        return <label key={field.key} className="text-sm font-semibold">{field.label}<input type={field.type ?? 'text'} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 font-normal" value={String(value[field.key] ?? '')} onChange={(event) => onChange({ [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value })} /></label>;
      })}
    </div>
  );
}
