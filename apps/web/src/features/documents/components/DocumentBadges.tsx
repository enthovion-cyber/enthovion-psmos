'use client';

export function DocumentStatusBadge({ status }: { status: string }) {
  const style = status === 'Active' || status === 'Approved' ? 'psm-badge-success' : status === 'Under Review' ? 'psm-badge-info' : status === 'Obsolete' || status === 'Archived' ? 'psm-badge-muted' : status === 'Superseded' ? 'psm-badge-warning' : 'psm-badge-muted';
  return <span className={`psm-badge ${style}`}>{status}</span>;
}

export function DocumentTypeBadge({ type }: { type: string }) {
  return <span className="psm-badge psm-badge-info">{type}</span>;
}
