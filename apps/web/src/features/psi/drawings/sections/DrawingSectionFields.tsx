import type { ReactNode } from 'react';
import type { DrawingLookups } from '../../types/drawing.types';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: unknown; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={String(value ?? '')} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export function SelectInput({ value, onChange, options, placeholder = 'Select' }: { value: unknown; onChange: (value: string) => void; options: string[]; placeholder?: string }) {
  return <select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>;
}

export function ToggleInput({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} />;
}

export type SectionProps = { value: Record<string, any>; lookups?: DrawingLookups | undefined; forcedUnitId?: string | undefined; onChange: (patch: Record<string, any>) => void };
