'use client';

type Field = { key: string; label: string; type?: 'text' | 'number' | 'checkbox' };

export function TechnicalDataSectionCard({ title, fields, values, onChange }: { title: string; fields: Field[]; values: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-[var(--psm-text)]">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="space-y-1 text-sm">
            <span className="font-semibold text-[var(--psm-muted)]">{field.label}</span>
            {field.type === 'checkbox' ? (
              <select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-[var(--psm-text)]" value={values[field.key] === true ? 'true' : values[field.key] === false ? 'false' : ''} onChange={(event) => onChange(field.key, event.target.value === '' ? null : event.target.value === 'true')}>
                <option value="">Not set</option><option value="true">Yes</option><option value="false">No</option>
              </select>
            ) : (
              <input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-[var(--psm-text)]" type={field.type ?? 'text'} value={String(values[field.key] ?? '')} onChange={(event) => onChange(field.key, event.target.value)} />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}
