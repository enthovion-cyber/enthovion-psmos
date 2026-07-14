export function SignatureStatusBadge({ status }: { status?: string | null }) {
  const tone = status === 'Signed' || status === 'Active'
    ? 'psm-badge-success'
    : status === 'Rejected' || status === 'Disabled'
      ? 'psm-badge-danger'
      : status === 'Draft'
        ? 'psm-badge-warning'
        : 'psm-badge-muted';
  return <span className={`psm-badge ${tone}`}>{status ?? 'Pending'}</span>;
}
