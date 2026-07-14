import { Archive, CalendarDays, FileImage, FileSpreadsheet, FileText, ShieldAlert } from 'lucide-react';
import type { HazopAttachmentSummary } from '../../types/hazop-attachment.types';

const cards = [
  ['totalAttachments', 'Total attachments', Archive],
  ['images', 'Images', FileImage],
  ['pdfs', 'PDFs', FileText],
  ['spreadsheets', 'Spreadsheets', FileSpreadsheet],
  ['filesNeedingReview', 'Need review', ShieldAlert],
  ['filesUploadedThisWeek', 'Uploaded this week', CalendarDays],
  ['largeFiles', 'Large files', Archive],
  ['restrictedFiles', 'Restricted', ShieldAlert]
] as const;

export function HazopAttachmentSummaryCards({ summary, onFilter }: { summary?: HazopAttachmentSummary; onFilter?: (key: string) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{cards.map(([key, label, Icon]) => <button key={key} onClick={() => onFilter?.(key)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left hover:bg-[var(--psm-surface-2)]"><div className="flex items-center justify-between text-xs text-[var(--psm-muted)]"><span>{label}</span><Icon size={16} /></div><div className="mt-3 text-2xl font-semibold text-sky-200">{Number(summary?.[key] ?? 0)}</div></button>)}</div>;
}
