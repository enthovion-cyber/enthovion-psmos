import type { ReactNode } from 'react';
import { PsiCard, PsiEmptyState, PsiProgress } from '../shared/PsiUi';

export function Field({ label, value, warn }: { label: string; value: ReactNode; warn?: boolean | undefined }) {
  return <div className={`rounded-lg border p-3 ${warn ? 'border-warning/30 bg-warning/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><div className="mt-1 text-sm font-medium">{value ?? <span className="text-warning">Missing</span>}</div></div>;
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function TextInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: any; onChange: (value: any) => void; placeholder?: string | undefined; type?: string | undefined }) {
  return <label className="space-y-1 text-sm font-semibold"><span>{label}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(type === 'number' ? event.target.valueAsNumber : event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>;
}

export function TextArea({ label, value, onChange, placeholder }: { label: string; value?: any; onChange: (value: string) => void; placeholder?: string | undefined }) {
  return <label className="space-y-1 text-sm font-semibold md:col-span-2 xl:col-span-3"><span>{label}</span><textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>;
}

export function SelectInput({ label, value, options, onChange }: { label: string; value?: any; options: string[]; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-sm font-semibold"><span>{label}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary"><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked?: boolean | undefined; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

export function DetailGrid({ rows }: { rows: Array<[string, ReactNode, boolean?]> }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map(([label, value, warn]) => <Field key={label} label={label} value={value} warn={warn} />)}</div>;
}

export function SafeguardListPanel({ title, subtitle, rows, emptyTitle, emptyMessage }: { title: string; subtitle?: string | undefined; rows: Array<Record<string, any>>; emptyTitle: string; emptyMessage: string }) {
  return <PsiCard title={title} subtitle={subtitle}>{!rows.length ? <PsiEmptyState title={emptyTitle} message={emptyMessage} /> : <div className="grid gap-3 md:grid-cols-2">{rows.map((row, index) => <article key={row.id ?? index} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">{Object.entries(row).slice(0, 9).map(([key, value]) => <p key={key} className="text-sm"><span className="font-semibold">{key.replaceAll('_', ' ')}:</span> {String(value ?? 'Missing')}</p>)}</article>)}</div>}</PsiCard>;
}

export function SafeguardReadinessList({ checks, score }: { checks: Array<Record<string, any>>; score?: number | null | undefined }) {
  return <>{score !== null && score !== undefined ? <div className="mb-4"><div className="mb-2 flex justify-between text-sm"><span>Readiness score</span><span>{score}%</span></div><PsiProgress value={score} /></div> : null}{!checks.length ? <PsiEmptyState title="Readiness not evaluated" message="Run backend completeness to calculate safeguard gaps, PSSR blockers, MI readiness impact, evidence gaps, and source status gaps." /> : <div className="space-y-2">{checks.map((check, index) => <div key={check.id ?? index} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div><p className="font-semibold">{check.check_title ?? 'Readiness check'}</p><p className="text-sm text-[var(--psm-muted)]">{check.message ?? 'No detail returned.'}</p></div><span className={check.status === 'Complete' ? 'text-success' : check.status === 'Critical Gaps' ? 'text-danger' : 'text-warning'}>{check.status ?? 'Open'}</span></div>)}</div>}</>;
}
