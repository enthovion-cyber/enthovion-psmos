import type { ReactNode } from 'react';

export function EquipmentDesignFieldGrid({ items }: { items: Array<{ label: string; value: ReactNode; tone?: 'normal' | 'warn' | 'danger' }> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{item.label}</dt>
          <dd className={`mt-1 text-sm font-medium ${item.tone === 'danger' ? 'text-danger' : item.tone === 'warn' ? 'text-warning' : 'text-[var(--psm-fg)]'}`}>{item.value ?? 'Not provided'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function valueOf(source: Record<string, unknown> | null | undefined, key: string, fallback = 'Not provided') {
  const value = source?.[key];
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
