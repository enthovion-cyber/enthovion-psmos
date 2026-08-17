import type { ReactNode } from 'react';
import { PsiCard, PsiEmptyState, PsiProgress } from '../shared/PsiUi';

export function Field({ label, value, warn }: { label: string; value: ReactNode; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${warn ? 'border-warning/30 bg-warning/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p>
      <div className="mt-1 text-sm font-medium text-[var(--psm-fg)]">{value ?? <span className="text-warning">Missing</span>}</div>
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function TextInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: any; onChange: (value: any) => void; placeholder?: string; type?: string }) {
  return <label className="space-y-1 text-sm font-semibold"><span>{label}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(type === 'number' ? event.target.valueAsNumber : event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>;
}

export function TextArea({ label, value, onChange, placeholder }: { label: string; value?: any; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="space-y-1 text-sm font-semibold md:col-span-2 xl:col-span-3"><span>{label}</span><textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary" /></label>;
}

export function SelectInput({ label, value, options, onChange }: { label: string; value?: any; options: string[]; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-sm font-semibold"><span>{label}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 outline-none focus:border-primary"><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

export function InfoPanel({ title, subtitle, rows, emptyTitle = 'No data recorded', emptyMessage = 'Backend returned no rows for this section.' }: { title: string; subtitle?: string | undefined; rows: Array<Record<string, any>>; emptyTitle?: string | undefined; emptyMessage?: string | undefined }) {
  return (
    <PsiCard title={title} subtitle={subtitle}>
      {!rows.length ? <PsiEmptyState title={emptyTitle} message={emptyMessage} /> : <div className="grid gap-3 md:grid-cols-2">{rows.map((row, index) => <div key={row.id ?? index} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">{Object.entries(row).slice(0, 8).map(([key, value]) => <p key={key} className="text-sm"><span className="font-semibold">{key.replaceAll('_', ' ')}:</span> {String(value ?? 'Missing')}</p>)}</div>)}</div>}
    </PsiCard>
  );
}

export function ReadinessPanel({ title, checks, score }: { title: string; checks: Array<Record<string, any>>; score?: number | null | undefined }) {
  return (
    <PsiCard title={title} subtitle="Backend-generated completeness, conflict, MOC, PSSR, MI, evidence, and review readiness.">
      {score !== null && score !== undefined ? <div className="mb-4"><div className="mb-2 flex justify-between text-sm"><span>Readiness score</span><span>{score}%</span></div><PsiProgress value={score} /></div> : null}
      {!checks.length ? <PsiEmptyState title="Readiness not evaluated" message="Run the backend completeness check to generate material compatibility readiness." /> : <div className="space-y-2">{checks.map((check, index) => <div key={check.id ?? index} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div><p className="font-semibold">{check.check_name ?? check.checkName ?? 'Readiness check'}</p><p className="text-sm text-[var(--psm-muted)]">{check.message ?? check.finding ?? check.required_action ?? 'No detail provided.'}</p></div><span className={check.passed ? 'text-success' : check.severity === 'Critical' ? 'text-danger' : 'text-warning'}>{check.passed ? 'Passed' : check.severity ?? 'Open'}</span></div>)}</div>}
    </PsiCard>
  );
}
