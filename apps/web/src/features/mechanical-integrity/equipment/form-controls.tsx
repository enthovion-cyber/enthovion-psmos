import type { ReactNode } from 'react';

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{label}{required ? <span className="text-danger"> *</span> : null}</span>{children}</label>;
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value?: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className="psm-input w-full" value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export function SelectInput({ value, onChange, options }: { value?: string; onChange: (value: string) => void; options: string[] }) {
  return <select className="psm-input w-full" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}</select>;
}
