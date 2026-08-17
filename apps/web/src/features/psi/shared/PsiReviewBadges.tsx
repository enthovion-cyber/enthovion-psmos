function toneFor(value?: string | null) {
  const text = String(value ?? '').toLowerCase();
  if (/approved|passed|current|complete|signed/.test(text)) return 'border-success/30 bg-success/10 text-success';
  if (/reject|failed|block|overdue|stale/.test(text)) return 'border-danger/30 bg-danger/10 text-danger';
  if (/return|warning|pending|delegated|escalated|required|moc|pssr/.test(text)) return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
}

export function PsiBadge({ value, fallback = 'Not set' }: { value?: string | boolean | null | undefined; fallback?: string | undefined }) {
  const label = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || fallback;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneFor(String(label))}`}>{label}</span>;
}

export function PsiApprovalStatusBadge({ value }: { value?: string | null | undefined }) { return <PsiBadge value={value} fallback="No status" />; }
export function PsiValidationStatusBadge({ value }: { value?: string | null | undefined }) { return <PsiBadge value={value} fallback="Not run" />; }
export function PsiApprovalStageBadge({ value }: { value?: string | null | undefined }) { return <PsiBadge value={value} fallback="No stage" />; }
export function PsiDecisionBadge({ value }: { value?: string | null | undefined }) { return <PsiBadge value={value} fallback="No decision" />; }
export function ESignatureStatusBadge({ value }: { value?: string | null | undefined }) { return <PsiBadge value={value} fallback="Not required" />; }
export function ReviewOverdueBadge({ overdue }: { overdue?: boolean | null | undefined }) { return <PsiBadge value={overdue ? 'Overdue' : 'On schedule'} />; }
export function ApprovalStaleBadge({ stale }: { stale?: boolean | null | undefined }) { return <PsiBadge value={stale ? 'Stale / Revalidation Required' : 'Current'} />; }
