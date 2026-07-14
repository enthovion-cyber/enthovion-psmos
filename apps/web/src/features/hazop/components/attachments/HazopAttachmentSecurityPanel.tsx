import type { HazopAttachment } from '../../types/hazop-attachment.types';
import { Panel } from './HazopAttachmentCategoryPanel';

export function HazopAttachmentSecurityPanel({ rows }: { rows: HazopAttachment[] }) {
  const restricted = rows.filter((row) => ['Restricted', 'Confidential'].includes(row.visibility ?? ''));
  const pendingScan = rows.filter((row) => ['Pending Scan', 'Not Scanned'].includes(row.scan_status ?? ''));
  const review = rows.filter((row) => row.review_required && !['Approved', 'Not Required'].includes(row.review_status ?? ''));
  return <Panel title="File Security / Version Info"><Metric label="Restricted / confidential" value={restricted.length} /><Metric label="Pending or not scanned" value={pendingScan.length} /><Metric label="Needs review" value={review.length} /><Metric label="Highest version" value={Math.max(0, ...rows.map((row) => Number(row.version ?? 1)))} /></Panel>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="mb-2 flex justify-between rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span className="text-[var(--psm-muted)]">{label}</span><span className="font-semibold">{value}</span></div>;
}
