'use client';

export function WorkflowStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'psm-badge-success',
    Active: 'psm-badge-success',
    APPROVED: 'psm-badge-success',
    Approved: 'psm-badge-success',
    DRAFT: 'psm-badge-muted',
    Draft: 'psm-badge-muted',
    INACTIVE: 'psm-badge-muted',
    Rejected: 'psm-badge-danger',
    REJECTED: 'psm-badge-danger',
    Returned: 'psm-badge-warning',
    Overridden: 'psm-badge-warning',
    Pending: 'psm-badge-muted'
  };
  return <span className={`psm-badge ${styles[status] ?? 'psm-badge-info'}`}>{status}</span>;
}

export function StepStatusBadge({ status }: { status: string }) {
  return <WorkflowStatusBadge status={status} />;
}
