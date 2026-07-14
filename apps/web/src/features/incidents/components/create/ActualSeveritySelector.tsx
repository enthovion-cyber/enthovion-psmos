'use client';
export function ActualSeveritySelector({ severities = [], value, onChange }: { severities?: string[]; value?: string; onChange: (v: string) => void }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{severities.map((s) => <button key={s} type="button" onClick={() => onChange(s)} className={`rounded-lg border p-3 text-left text-sm font-bold ${value === s ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-200' : 'border-slate-200 dark:border-cyan-300/10'}`}>{s}</button>)}</div>;
}
