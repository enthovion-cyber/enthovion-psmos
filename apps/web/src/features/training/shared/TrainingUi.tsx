import Link from 'next/link';
import type { ReactNode } from 'react';

export function TrainingCard({ title, subtitle, children, action }: { title?: string | undefined; subtitle?: string | undefined; children: ReactNode; action?: ReactNode | undefined }) {
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

export function TrainingButton({ children, href, onClick, disabled, title, variant = 'primary', type = 'button' }: { children: ReactNode; href?: string | undefined; onClick?: (() => void) | undefined; disabled?: boolean | undefined; title?: string | undefined; variant?: 'primary' | 'secondary' | 'danger' | undefined; type?: 'button' | 'submit' | undefined }) {
  const className = `inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition ${
    variant === 'primary' ? 'bg-primary text-white hover:bg-primary/90 disabled:bg-primary/40' : variant === 'danger' ? 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15 disabled:opacity-50' : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)] disabled:opacity-50'
  }`;
  if (href && !disabled) return <Link href={href} className={className} title={title}>{children}</Link>;
  return <button type={type} className={className} onClick={onClick} disabled={disabled} title={disabled ? title : undefined}>{children}</button>;
}

export function TrainingMetricCard({ label, value, href, tone = 'neutral' }: { label: string; value: ReactNode; href?: string | undefined; tone?: 'neutral' | 'good' | 'warn' | 'danger' | undefined }) {
  const toneClass = tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warning' : tone === 'good' ? 'text-success' : 'text-[var(--psm-fg)]';
  const body = <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p></div>;
  return href ? <Link href={href}>{body}</Link> : body;
}

export function TrainingLoadingState({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]" />)}</div>;
}

export function TrainingEmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center"><h3 className="text-base font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--psm-muted)]">{message}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function formatTrainingError(error: unknown): string {
  if (!error) return 'Unknown error.';
  if (typeof error === 'string') return error;
  if (Array.isArray(error)) return error.map(formatTrainingError).join(', ');
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const value = error as { response?: { data?: unknown }; message?: unknown; error?: unknown; details?: unknown; statusCode?: unknown };
    if (value.response?.data) return formatTrainingError(value.response.data);
    if (value.message) return formatTrainingError(value.message);
    const parts = [
      value.error ? formatTrainingError(value.error) : '',
      value.details ? formatTrainingError(value.details) : '',
      value.statusCode ? `Status ${String(value.statusCode)}` : ''
    ].filter(Boolean);
    if (parts.length) return parts.join(' - ');
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error.';
    }
  }
  return String(error);
}

export function TrainingErrorState({ message, onRetry }: { message: unknown; onRetry?: () => void }) {
  return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger"><p className="font-semibold">Unable to load Training & Competency.</p><p className="mt-1 text-sm">{formatTrainingError(message)}</p>{onRetry ? <div className="mt-3"><TrainingButton variant="secondary" onClick={onRetry}>Retry</TrainingButton></div> : null}</div>;
}

export function TrainingProgress({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${safe}%` }} /></div>;
}

export function TrainingBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' }) {
  const cls = tone === 'good' ? 'border-success/30 bg-success/10 text-success' : tone === 'warn' ? 'border-warning/30 bg-warning/10 text-warning' : tone === 'danger' ? 'border-danger/30 bg-danger/10 text-danger' : tone === 'info' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
