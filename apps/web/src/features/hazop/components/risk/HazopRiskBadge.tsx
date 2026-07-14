import { cn } from '@/utils/cn';
import { RiskBadge } from '../shared/HazopBadges';

export function HazopRiskBadge({ value }: { value?: string }) {
  return value ? <RiskBadge value={value} /> : <RiskBadge />;
}

export function HazopRiskStatusBadge({ children, tone = 'slate' }: { children: any; tone?: 'red' | 'amber' | 'green' | 'slate' }) {
  const styles = {
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    slate: 'border-slate-500/30 bg-slate-500/10 text-slate-300'
  };
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', styles[tone])}>{children}</span>;
}

export function HazopRiskPanel({ title, icon: Icon, children }: { title: string; icon: any; children: any }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><Icon size={16} className="text-[var(--psm-muted)]" /></div><div className="space-y-3">{children}</div></section>;
}

export function HazopRiskMiniButton({ children, onClick, disabled }: { children: any; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className="rounded-md border border-[var(--psm-line)] px-2 py-1 text-xs font-semibold hover:bg-[var(--psm-surface-2)] disabled:cursor-not-allowed disabled:opacity-50">{children}</button>;
}

export function HazopRiskMetric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-2xl font-semibold">{value ?? '-'}</div></div>;
}

export function HazopRiskStateCard({ title, text, tone = 'slate' }: { title: string; text: string; tone?: 'red' | 'amber' | 'slate' }) {
  const toneClass = tone === 'red' ? 'border-red-500/30 text-red-200' : tone === 'amber' ? 'border-amber-500/30 text-amber-200' : 'border-[var(--psm-line)] text-[var(--psm-muted)]';
  return <div className={cn('rounded-xl border bg-[var(--psm-surface)] p-5 text-sm', toneClass)}><div className="font-semibold">{title}</div><p className="mt-1">{text}</p></div>;
}

export function HazopRiskEmptyLine({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}

export function HazopRiskSelect({ value, values, onChange }: { value: string; values: string[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="input">{values.map((item) => <option key={item} value={item}>{item}</option>)}</select>;
}
