import { AlertTriangle, CheckCircle2, Database, FileCheck2, FileText, Link2, UploadCloud } from 'lucide-react';
import type { AttachmentSummary } from '../../services/ptw-attachment.service';

export function AttachmentSummaryCard({ summary }: { summary?: AttachmentSummary | undefined }) {
  const complete = summary?.status === 'Complete' || summary?.status === 'Not Required';
  const items = [
    { label: 'Total', value: summary?.totalAttachments ?? 0, icon: FileText, tone: 'text-primary' },
    { label: 'Required', value: summary?.requiredAttachments ?? 0, icon: FileCheck2, tone: 'text-success' },
    { label: 'Missing', value: summary?.missingRequired ?? 0, icon: AlertTriangle, tone: 'text-danger' },
    { label: 'Uploaded Today', value: summary?.uploadedToday ?? 0, icon: UploadCloud, tone: 'text-warning' },
    { label: 'Linked Docs', value: summary?.linkedDocuments ?? 0, icon: Link2, tone: 'text-primary' },
    { label: 'Storage', value: `${Math.round((summary?.storageUsedBytes ?? 0) / 1024)} KB`, icon: Database, tone: 'text-[var(--psm-muted)]' }
  ];
  return <section className="psm-card p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="text-sm font-semibold uppercase tracking-wide">Attachments Summary</h3><p className="mt-1 text-sm text-[var(--psm-muted)]">Permit-specific files, evidence, certificates, and linked controlled documents.</p></div><div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${complete ? 'border-success/40 bg-success/10 text-success' : 'border-danger/40 bg-danger/10 text-danger'}`}>{complete ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{summary?.status ?? 'Loading'}</div></div><div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">{items.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${tone}`}><Icon size={15} /> {label}</div><div className="mt-2 text-xl font-semibold">{value}</div></div>)}</div>{summary?.missingTypes?.length ? <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">Missing required files: {summary.missingTypes.join(', ')}</div> : null}</section>;
}
