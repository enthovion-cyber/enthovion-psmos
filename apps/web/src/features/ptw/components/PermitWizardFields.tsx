'use client';

import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import type { PermitCreateValues } from '../schemas/permit.schema';

export function Field({ name, label, required, children }: { name: keyof PermitCreateValues | string; label: string; required?: boolean; children: ReactNode }) {
  const { formState: { errors } } = useFormContext<PermitCreateValues>();
  const error = getError(errors, String(name));
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}{required ? <span className="text-red-300">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

export function Input({ name, type = 'text', placeholder }: { name: keyof PermitCreateValues; type?: string; placeholder?: string }) {
  const { register } = useFormContext<PermitCreateValues>();
  return <input type={type} placeholder={placeholder} className="ptw-input w-full" {...register(name as any)} />;
}

export function Textarea({ name, placeholder }: { name: keyof PermitCreateValues; placeholder?: string }) {
  const { register } = useFormContext<PermitCreateValues>();
  return <textarea placeholder={placeholder} className="ptw-input min-h-24 w-full resize-y" {...register(name as any)} />;
}

export function Select({ name, options }: { name: keyof PermitCreateValues; options: Array<string | { value: string; label: string }> }) {
  const { register } = useFormContext<PermitCreateValues>();
  return (
    <select className="ptw-input w-full" {...register(name as any)}>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return <option key={value} value={value}>{label}</option>;
      })}
    </select>
  );
}

export function Check({ name, label }: { name: keyof PermitCreateValues; label: string }) {
  const { register } = useFormContext<PermitCreateValues>();
  return (
    <label className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-black/10 px-3 py-2 text-sm text-slate-200">
      <input type="checkbox" className="h-4 w-4 accent-blue-500" {...register(name as any)} />
      <span>{label}</span>
    </label>
  );
}

export function StepPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#0b1d31]/95 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 border-b border-cyan-300/10 pb-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="md:col-span-2 xl:col-span-3 pt-2 text-xs font-bold uppercase tracking-wider text-blue-300">{children}</div>;
}

function getError(errors: Record<string, any>, path: string) {
  const value = path.split('.').reduce<any>((acc, part) => acc?.[part], errors);
  return value?.message as string | undefined;
}
