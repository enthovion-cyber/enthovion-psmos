'use client';

import type { ReactNode } from 'react';

export function StepShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm text-[var(--psm-fg)] transition-colors">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-[var(--psm-fg)]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
  error,
  required
}: {
  label: string;
  children: ReactNode;
  error?: string | undefined;
  required?: boolean | undefined;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs font-semibold text-rose-500">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  'h-11 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm text-[var(--psm-fg)] outline-none placeholder:text-[var(--psm-muted)] focus:border-primary transition-colors';
export const textAreaClass =
  'min-h-28 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-fg)] outline-none placeholder:text-[var(--psm-muted)] focus:border-primary transition-colors';

export function ToggleCard({
  active,
  title,
  detail,
  onClick
}: {
  active: boolean;
  title: string;
  detail?: string | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3.5 text-left transition-all ${
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] hover:border-primary/50'
      }`}
    >
      <span className="block text-sm font-bold text-[var(--psm-fg)]">{title}</span>
      {detail ? <span className="mt-1 block text-xs text-[var(--psm-muted)]">{detail}</span> : null}
    </button>
  );
}
