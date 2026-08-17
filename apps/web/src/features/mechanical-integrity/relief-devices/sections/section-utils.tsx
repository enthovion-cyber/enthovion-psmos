import type { ReactNode } from 'react';

export function SectionShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {description ? <p className="text-sm text-[var(--psm-muted)]">{description}</p> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export function Field({ label, name, value, onChange, type = 'text', required }: { label: string; name: string; value?: unknown; onChange: (name: string, value: string | boolean) => void; type?: string; required?: boolean }) {
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(name, event.target.checked)} />
        {label}
      </label>
    );
  }
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium">{label}{required ? ' *' : ''}</span>
      <input className="w-full rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2" name={name} value={String(value ?? '')} type={type} onChange={(event) => onChange(name, event.target.value)} />
    </label>
  );
}
