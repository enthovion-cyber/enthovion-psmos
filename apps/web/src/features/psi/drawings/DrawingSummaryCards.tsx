import { PsiMetricCard } from '../shared/PsiUi';
import type { DrawingSummary } from '../types/drawing.types';

const cards: Array<[string, keyof DrawingSummary, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
  ['Total Drawings', 'totalDrawings', '/process-safety-information/drawings', 'neutral'],
  ['Current Approved', 'currentApprovedDrawings', '/process-safety-information/drawings?currentApproved=true', 'good'],
  ['P&IDs', 'pids', '/process-safety-information/drawings/pids', 'neutral'],
  ['PFDs', 'pfds', '/process-safety-information/drawings/pfds', 'neutral'],
  ['Missing Current Version', 'drawingsMissingCurrentApprovedVersion', '/process-safety-information/drawings/missing', 'danger'],
  ['Superseded', 'supersededDrawings', '/process-safety-information/drawings/superseded', 'warn'],
  ['Redlines Open', 'redlinesOpen', '/process-safety-information/drawings/redlines', 'warn'],
  ['Pending Approval', 'pendingApproval', '/process-safety-information/drawings/pending-approval', 'warn'],
  ['As-Built Required', 'asBuiltVerificationRequired', '/process-safety-information/drawings/as-built-verification', 'warn'],
  ['MOC Updates Required', 'mocUpdatesRequired', '/process-safety-information/drawings/moc-updates-required', 'warn'],
  ['PSSR Blockers', 'pssrBlockers', '/process-safety-information/drawings/pssr-blockers', 'danger'],
  ['Units Missing P&ID', 'unitsMissingPid', '/process-safety-information/drawings/missing?drawingType=P%26ID', 'danger'],
  ['Units Missing PFD', 'unitsMissingPfd', '/process-safety-information/drawings/missing?drawingType=PFD', 'danger'],
  ['Equipment Missing Link', 'equipmentMissingDrawingLink', '/process-safety-information/drawings/missing?relationship=Equipment', 'warn'],
  ['Relief Systems Missing P&ID', 'reliefSystemsMissingPid', '/process-safety-information/drawings/missing?relationship=Relief', 'warn'],
  ['SIS / Interlocks Missing C&E', 'sisInterlocksMissingCauseEffect', '/process-safety-information/drawings/missing?type=cause-effect', 'warn'],
  ['Expired / Superseded Docs', 'documentsExpiredSuperseded', '/process-safety-information/drawings/superseded', 'danger'],
  ['Review Overdue', 'reviewOverdue', '/process-safety-information/drawings?reviewOverdue=true', 'danger']
];

export function DrawingSummaryCards({ summary }: { summary: DrawingSummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, href, tone]) => <PsiMetricCard key={key} label={label} value={String(summary[key] ?? 0)} href={href} tone={tone} />)}</div>;
}
