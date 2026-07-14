import { Download } from 'lucide-react';
import { Panel } from './HazopReadinessChecklist';

export function HazopExportApprovalPackagePanel({ onExport, loading }: { onExport: () => void; loading?: boolean }) {
  return <Panel title="Approval Package"><button disabled={loading} onClick={onExport} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold hover:bg-[var(--psm-surface-2)] disabled:opacity-50"><Download size={15} /> {loading ? 'Exporting...' : 'Export Review Package'}</button><p className="mt-3 text-xs text-[var(--psm-muted)]">Includes study info, readiness checks, closure blockers, sign-offs, comments, and workflow status.</p></Panel>;
}
