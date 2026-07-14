'use client';

export function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>{right}</div>{children}</section>;
}

export function Field({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value?: any; onChange: (v: any) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}{required ? ' *' : ''}<input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-cyan-300/10 dark:bg-[#06111f] dark:text-slate-100" /></label>;
}

export function TextArea({ label, value, onChange, required, placeholder, rows = 3 }: { label: string; value?: any; onChange: (v: any) => void; required?: boolean; placeholder?: string; rows?: number }) {
  return <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}{required ? ' *' : ''}<textarea rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-cyan-300/10 dark:bg-[#06111f] dark:text-slate-100" /></label>;
}

export function Select({ label, value, onChange, options = [], required }: { label: string; value?: any; onChange: (v: any) => void; options?: any[]; required?: boolean }) {
  return <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}{required ? ' *' : ''}<select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-cyan-300/10 dark:bg-[#06111f] dark:text-slate-100"><option value="">Select...</option>{options.map((o) => <option key={String(o.id ?? o.value ?? o.name ?? o)} value={String(o.id ?? o.value ?? o.name ?? o)}>{String(o.name ?? o.label ?? o.displayName ?? o.title ?? o)}</option>)}</select></label>;
}

export function Toggle({ label, checked, onChange, disabled, reason }: { label: string; checked?: boolean; onChange: (v: boolean) => void; disabled?: boolean; reason?: string }) {
  return <button type="button" disabled={disabled} title={disabled ? reason : undefined} onClick={() => onChange(!checked)} className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold ${checked ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-200' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-cyan-300/10 dark:bg-[#06111f] dark:text-slate-300'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>{label}<span className="ml-2">{checked ? 'Yes' : 'No'}</span></button>;
}

export function StateBanner({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'success'; children: React.ReactNode }) {
  const styles = tone === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-100' : tone === 'warn' ? 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-100' : tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100' : 'border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-100';
  return <div className={`rounded-lg border p-3 text-sm ${styles}`}>{children}</div>;
}
