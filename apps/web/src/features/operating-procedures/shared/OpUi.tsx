'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'good' | 'warn' | 'danger' | 'info';

export function OpCard({ title, subtitle, children, action }: { title?: string | undefined; subtitle?: string | undefined; children: ReactNode; action?: ReactNode | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      {title || subtitle || action ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-semibold text-[var(--psm-fg)]">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-[var(--psm-muted)]">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function OpButton({ children, href, onClick, disabled, variant = 'primary', type = 'button' }: { children: ReactNode; href?: string | undefined; onClick?: (() => void) | undefined; disabled?: boolean | undefined; variant?: 'primary' | 'secondary' | 'danger' | undefined; type?: 'button' | 'submit' | undefined }) {
  const cls = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${variant === 'primary' ? 'bg-primary text-white hover:bg-primary/90' : variant === 'danger' ? 'bg-danger text-white hover:bg-danger/90' : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]'} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`;
  if (href && !disabled) return <Link className={cls} href={href}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} className={cls}>{children}</button>;
}

const toneCls: Record<Tone, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-primary/30 bg-primary/10 text-primary',
  neutral: 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
};

export function OpBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${toneCls[tone]}`}>{children || 'Not Set'}</span>;
}

export function OpMetric({ label, value, href, tone = 'neutral' }: { label: string; value: ReactNode; href?: string | undefined; tone?: Tone }) {
  const body = (
    <div className={`h-full rounded-xl border p-4 ${tone === 'neutral' ? 'border-[var(--psm-line)] bg-[var(--psm-surface)]' : toneCls[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p>
      <div className="mt-3 text-2xl font-bold text-[var(--psm-fg)]">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function OpLoading({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />)}</div>;
}

export function OpError({ error, onRetry }: { error: unknown; onRetry?: (() => void) | undefined }) {
  return <OpCard title="Unable to load Operating Procedures" subtitle={formatOpError(error)} action={onRetry ? <OpButton variant="secondary" onClick={onRetry}>Retry</OpButton> : undefined}><p className="text-sm text-[var(--psm-muted)]">The backend rejected or failed this request. Permissions and site isolation are still enforced.</p></OpCard>;
}

export function OpEmpty({ title, message, action }: { title: string; message: string; action?: ReactNode | undefined }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-8 text-center"><h3 className="text-lg font-semibold text-[var(--psm-fg)]">{title}</h3><p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--psm-muted)]">{message}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function OpField({ label, children, helper, required }: { label: string; children: ReactNode; helper?: string | undefined; required?: boolean }) {
  return <label className="block space-y-1 text-sm"><span className="font-semibold text-[var(--psm-fg)]">{label}{required ? <span className="text-danger"> *</span> : null}</span>{children}{helper ? <span className="block text-xs text-[var(--psm-muted)]">{helper}</span> : null}</label>;
}

export const opInput = 'min-h-10 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-fg)] outline-none focus:border-primary';

export function formatOpError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  const e = error as { response?: { data?: { message?: unknown } }; message?: unknown } | null;
  const m = e?.response?.data?.message ?? e?.message;
  return Array.isArray(m) ? m.join(', ') : m ? String(m) : 'Unexpected error';
}

export function statusTone(status?: string | null): Tone {
  switch (status) {
    case 'Published': case 'Approved': case 'Certified': return 'good';
    case 'In Review': case 'Review Complete': case 'Pending Approval': case 'Under Revision': case 'Upcoming': case 'Due': return 'warn';
    case 'Rejected': case 'Overdue': case 'Expired': case 'Withdrawn': return 'danger';
    case 'Draft': return 'info';
    default: return 'neutral';
  }
}

export function criticalityTone(c?: string | null): Tone { return c === 'High' ? 'danger' : c === 'Medium' ? 'warn' : 'neutral'; }

export function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleDateString() : '-'; }
export function fmtDateTime(v?: string | null) { return v ? new Date(v).toLocaleString() : '-'; }

const nav = [
  { label: 'Dashboard', href: '/operating-procedures' },
  { label: 'Procedure Register', href: '/operating-procedures/register' },
  { label: 'Execution Runs & Checklists', href: '/operating-procedures/executions' },
  { label: 'Annual Certification', href: '/operating-procedures/certification' },
  { label: 'Safe Work Practices & JSA', href: '/operating-procedures/safe-work-practices' },
  { label: 'Worker Acknowledgments', href: '/operating-procedures/acknowledgments' },
  { label: 'Change Flags Inbox', href: '/operating-procedures/change-flags' },
  { label: 'Audit Packages & Reports', href: '/operating-procedures/reports' },
  { label: 'New Procedure', href: '/operating-procedures/new' },
  { label: 'Certification Due', href: '/operating-procedures/register?overdue=true' },
  { label: 'Settings', href: '/operating-procedures/settings' }
];

export function OpLayout({ children, current }: { children: ReactNode; current?: string }) {
  const pathname = usePathname();
  return (
    <div className="space-y-5">
      <nav className="text-sm text-[var(--psm-muted)]"><Link href="/operating-procedures" className="hover:text-primary">Operating Procedures</Link>{current ? <> / <span className="text-[var(--psm-fg)]">{current}</span></> : null}</nav>
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
          {nav.map((n) => {
            const active = pathname === n.href.split('?')[0] && (n.href.includes('?') ? false : true);
            return <Link key={n.label} href={n.href} className={`block rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-primary/10 text-primary' : 'text-[var(--psm-fg)] hover:bg-[var(--psm-surface-2)]'}`}>{n.label}</Link>;
          })}
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function OpHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
