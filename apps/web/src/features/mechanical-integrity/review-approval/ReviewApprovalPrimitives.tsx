'use client';

import type { ReactNode } from 'react';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';

export function ReviewCard({ title, description, actions, children }: { title: string; description?: string | undefined; actions?: ReactNode | undefined; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--psm-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ReviewButton({ children, onClick, disabled, title, type = 'button', variant = 'secondary' }: { children: ReactNode; onClick?: (() => void) | undefined; disabled?: boolean | undefined; title?: string | undefined; type?: 'button' | 'submit' | undefined; variant?: 'primary' | 'secondary' | 'danger' | undefined }) {
  const cls = variant === 'primary'
    ? 'bg-primary text-primary-foreground'
    : variant === 'danger'
      ? 'border-danger/30 bg-danger/10 text-danger'
      : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]';
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={disabled ? title : undefined} className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  );
}

export function KeyValueList({ items }: { items: Array<[string, unknown]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <dt className="text-xs text-[var(--psm-muted)]">{label}</dt>
          <dd className="mt-1 text-sm font-semibold">{cardValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyPanel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">{children}</div>;
}
