import Link from 'next/link';
import type { ReactNode } from 'react';

export function RegulatoryCard({ title, subtitle, children, action }: { title?: string | undefined; subtitle?: string | undefined; children: ReactNode; action?: ReactNode | undefined }) {
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

export function RegulatoryButton({ children, href, onClick, disabled, title, variant = 'primary', type = 'button' }: { children: ReactNode; href?: string | undefined; onClick?: (() => void) | undefined; disabled?: boolean | undefined; title?: string | undefined; variant?: 'primary' | 'secondary' | 'danger' | undefined; type?: 'button' | 'submit' | undefined }) {
  const className = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${variant === 'primary' ? 'bg-primary text-white hover:bg-primary/90' : variant === 'danger' ? 'bg-danger text-white hover:bg-danger/90' : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]'} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`;
  if (href && !disabled) return <Link className={className} href={href} title={title}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} title={title} className={className}>{children}</button>;
}

export function RegulatoryMetricCard({ label, value, href, tone = 'neutral' }: { label: string; value: ReactNode; href?: string | undefined; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' | undefined }) {
  const toneClass = tone === 'good' ? 'border-emerald-500/30 bg-emerald-500/10' : tone === 'warn' ? 'border-amber-500/30 bg-amber-500/10' : tone === 'danger' ? 'border-danger/30 bg-danger/10' : tone === 'info' ? 'border-primary/30 bg-primary/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface)]';
  const body = <div className={`h-full rounded-xl border p-4 ${toneClass}`}><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p><div className="mt-3 text-2xl font-bold text-[var(--psm-fg)]">{value}</div></div>;
  return href ? <Link href={href}>{body}</Link> : body;
}

export function RegulatoryBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' | undefined }) {
  const cls = tone === 'good' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : tone === 'warn' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' : tone === 'danger' ? 'border-danger/30 bg-danger/10 text-danger' : tone === 'info' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{children || 'Not Set'}</span>;
}

export function RegulatoryLoadingState({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />)}</div>;
}

export function RegulatoryErrorState({ message, onRetry }: { message: unknown; onRetry?: (() => void) | undefined }) {
  return <RegulatoryCard title="Unable to load Regulatory Register" subtitle={formatRegulatoryError(message)} action={onRetry ? <RegulatoryButton variant="secondary" onClick={onRetry}>Retry</RegulatoryButton> : undefined}><p className="text-sm text-[var(--psm-muted)]">The backend rejected or failed this request. Direct API permissions and site isolation are still enforced.</p></RegulatoryCard>;
}

export function RegulatoryEmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode | undefined }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-8 text-center"><h3 className="text-lg font-semibold text-[var(--psm-fg)]">{title}</h3><p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--psm-muted)]">{message}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function RegulatoryField({ label, children, helper }: { label: string; children: ReactNode; helper?: string | undefined }) {
  return <label className="space-y-1 text-sm"><span className="font-semibold text-[var(--psm-fg)]">{label}</span>{children}{helper ? <span className="block text-xs text-[var(--psm-muted)]">{helper}</span> : null}</label>;
}

export function regulatoryInputClass() {
  return 'min-h-10 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-fg)] outline-none focus:border-primary';
}

export function formatRegulatoryError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') return JSON.stringify(error);
  return 'Unknown error';
}
