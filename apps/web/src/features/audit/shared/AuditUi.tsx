import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuditCard({ title, subtitle, children, action }: { title?: string | undefined; subtitle?: string | undefined; children: ReactNode; action?: ReactNode | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      {(title || subtitle || action) ? (
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

export function AuditButton({ children, href, onClick, disabled, title, variant = 'primary', type = 'button' }: { children: ReactNode; href?: string | undefined; onClick?: (() => void) | undefined; disabled?: boolean | undefined; title?: string | undefined; variant?: 'primary' | 'secondary' | 'danger' | undefined; type?: 'button' | 'submit' | undefined }) {
  const className = `inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${variant === 'primary' ? 'bg-primary text-white hover:bg-primary/90' : variant === 'danger' ? 'bg-danger text-white hover:bg-danger/90' : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]'} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`;
  if (href && !disabled) return <Link href={href} className={className} title={title}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} title={disabled ? title : title} className={className}>{children}</button>;
}

export function AuditMetricCard({ label, value, tone = 'neutral', href }: { label: string; value: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' | undefined; href?: string | undefined }) {
  const toneClass = tone === 'good' ? 'border-emerald-500/30 bg-emerald-500/10' : tone === 'warn' ? 'border-amber-500/30 bg-amber-500/10' : tone === 'danger' ? 'border-danger/30 bg-danger/10' : tone === 'info' ? 'border-primary/30 bg-primary/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface)]';
  const body = <div className={`rounded-xl border p-4 ${toneClass}`}><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">{label}</p><div className="mt-3 text-2xl font-bold text-[var(--psm-fg)]">{value}</div></div>;
  return href ? <Link href={href}>{body}</Link> : body;
}

export function AuditBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' }) {
  const cls = tone === 'good' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : tone === 'warn' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : tone === 'danger' ? 'bg-danger/10 text-danger border-danger/30' : tone === 'info' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function AuditLoadingState({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />)}</div>;
}

export function AuditErrorState({ message, onRetry }: { message: unknown; onRetry?: () => void }) {
  return <AuditCard title="Unable to load Audit / Compliance Assurance" subtitle={formatAuditError(message)} action={onRetry ? <AuditButton onClick={onRetry} variant="secondary">Retry</AuditButton> : null}><p className="text-sm text-[var(--psm-muted)]">The backend rejected or failed the request. Direct route permissions are still enforced.</p></AuditCard>;
}

export function AuditEmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-8 text-center"><h3 className="text-lg font-semibold text-[var(--psm-fg)]">{title}</h3><p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--psm-muted)]">{message}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1 text-sm"><span className="font-semibold text-[var(--psm-fg)]">{label}</span>{children}</label>;
}

export function inputClass() {
  return 'min-h-10 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-fg)] outline-none focus:border-primary';
}

export function formatAuditError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') return JSON.stringify(error);
  return 'Unknown error';
}
