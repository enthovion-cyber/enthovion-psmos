'use client';

import type { ReactNode } from 'react';

export function Field({ label, children, helper }: { label: string; children: ReactNode; helper?: string | undefined }) {
  return <label className="block"><span className="text-xs font-semibold text-[var(--psm-muted)]">{label}</span><div className="mt-1">{children}</div>{helper ? <span className="mt-1 block text-xs text-[var(--psm-muted)]">{helper}</span> : null}</label>;
}

export function Input({ value, onChange, placeholder, type = 'text' }: { value?: unknown; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />;
}

export function Select({ value, onChange, options, placeholder = 'Select' }: { value?: unknown; onChange: (value: string) => void; options?: string[] | undefined; placeholder?: string | undefined }) {
  return <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">{placeholder}</option>{(options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

export function Check({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
